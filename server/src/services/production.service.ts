import { Types } from "mongoose";
import { ProductionPlan, ProductionPlanStatus } from "../models/ProductionPlan";
import { WorkOrder, IWorkOrder, WorkOrderStatus, StageStatus, JobCardStatus } from "../models/WorkOrder";
import { Warehouse } from "../models/Warehouse";
import { inventoryService } from "./inventory.service";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";
import { HttpError, notFound, badRequest } from "../utils/httpError";
import { generateDocNumber, round2, escapeRegex, paginate, buildDateRange } from "../utils/docNumber";
import { logger } from "../config/logger";

export const DEFAULT_STAGES = ["Material Preparation", "Processing", "Assembly", "Quality Check", "Packaging"];

const WORK_ORDER_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  Planned: ["Released", "In Progress", "Cancelled"],
  Released: ["In Progress", "On Hold", "Cancelled"],
  "In Progress": ["On Hold", "Completed", "Cancelled"],
  "On Hold": ["In Progress", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

const PLAN_TRANSITIONS: Record<ProductionPlanStatus, ProductionPlanStatus[]> = {
  Draft: ["Approved", "Cancelled"],
  Approved: ["In Progress", "Completed", "Cancelled"],
  "In Progress": ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

export interface CreatePlanInput {
  title: string;
  factoryId?: string;
  startDate: string;
  endDate: string;
  priority?: "low" | "medium" | "high" | "urgent";
  notes?: string;
  items: Array<{ productId?: string; itemName: string; sku: string; plannedQuantity: number; unit?: string; notes?: string }>;
}

export interface CreateWorkOrderInput {
  planId?: string;
  factoryId?: string;
  warehouseId: string;
  outputWarehouseId?: string;
  productId?: string;
  itemName: string;
  sku: string;
  unit?: string;
  plannedQuantity: number;
  priority?: "low" | "medium" | "high" | "urgent";
  plannedStartDate?: string;
  plannedEndDate?: string;
  assignedTo?: string;
  notes?: string;
  stages?: string[];
  materials?: Array<{ sku: string; itemName: string; requiredQuantity: number; unit?: string }>;
}

export interface JobCardInput {
  title: string;
  stageName?: string;
  assignedTo?: string;
  plannedHours?: number;
  instructions?: string;
}

export interface UpdateJobCardInput {
  status?: JobCardStatus;
  actualHours?: number;
  assignedTo?: string;
  notes?: string;
}

export interface ConsumeMaterialInput {
  items: Array<{ sku: string; quantity: number; notes?: string }>;
  warehouseId?: string;
}

export interface RecordOutputInput {
  quantity: number;
  scrapQuantity?: number;
  scrapReason?: string;
  warehouseId?: string;
  unitCost?: number;
  notes?: string;
  markComplete?: boolean;
}

export interface RecordScrapInput {
  quantity: number;
  reason: string;
  stageName?: string;
  notes?: string;
}

const toId = (id?: string) => (id ? new Types.ObjectId(id) : undefined);

export class ProductionService {
  // ==========================================
  // PRODUCTION PLANNING
  // ==========================================

  async createPlan(companyId: string, userId: string, input: CreatePlanInput) {
    if (new Date(input.endDate) < new Date(input.startDate)) {
      throw badRequest("Plan end date cannot be before its start date");
    }

    const plan = await ProductionPlan.create({
      companyId: new Types.ObjectId(companyId),
      planNumber: await generateDocNumber(ProductionPlan, companyId, "PP"),
      title: input.title.trim(),
      factoryId: toId(input.factoryId),
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      priority: input.priority || "medium",
      notes: input.notes,
      status: "Draft",
      createdBy: new Types.ObjectId(userId),
      items: input.items.map((item) => ({
        productId: toId(item.productId),
        itemName: item.itemName.trim(),
        sku: item.sku.trim().toUpperCase(),
        plannedQuantity: Number(item.plannedQuantity),
        producedQuantity: 0,
        unit: item.unit || "units",
        notes: item.notes,
      })),
    });

    await auditService.log({
      companyId,
      userId,
      action: "PRODUCTION_PLAN_CREATED",
      module: "production",
      referenceId: plan._id.toString(),
      after: { planNumber: plan.planNumber, title: plan.title, items: plan.items.length },
    });

    return plan;
  }

  async getPlans(companyId: string, query: any) {
    const { page, limit, skip } = paginate(query);
    const filter: any = { companyId, isDeleted: { $ne: true } };
    if (query.status) filter.status = query.status;
    if (query.factoryId) filter.factoryId = query.factoryId;
    const dateRange = buildDateRange(query.startDate, query.endDate);
    if (dateRange) filter.startDate = dateRange;
    if (query.search) {
      const rx = { $regex: escapeRegex(query.search), $options: "i" };
      filter.$or = [{ planNumber: rx }, { title: rx }, { "items.itemName": rx }, { "items.sku": rx }];
    }

    const [plans, total] = await Promise.all([
      ProductionPlan.find(filter)
        .populate("factoryId", "name code")
        .populate("createdBy", "firstName lastName email")
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit),
      ProductionPlan.countDocuments(filter),
    ]);

    return { success: true, data: plans, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getPlanById(companyId: string, planId: string) {
    const plan = await ProductionPlan.findOne({ _id: planId, companyId, isDeleted: { $ne: true } })
      .populate("factoryId", "name code")
      .populate("createdBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email");
    if (!plan) throw notFound("Production plan");

    const workOrders = await WorkOrder.find({ companyId, planId, isDeleted: { $ne: true } })
      .select("workOrderNumber itemName sku plannedQuantity producedQuantity status plannedEndDate")
      .sort({ createdAt: -1 });

    return { plan, workOrders };
  }

  async updatePlanStatus(companyId: string, userId: string, planId: string, status: ProductionPlanStatus) {
    const plan = await ProductionPlan.findOne({ _id: planId, companyId, isDeleted: { $ne: true } });
    if (!plan) throw notFound("Production plan");

    if (!PLAN_TRANSITIONS[plan.status].includes(status)) {
      throw badRequest(`Cannot move production plan from '${plan.status}' to '${status}'`);
    }

    const previousStatus = plan.status;
    plan.status = status;
    if (status === "Approved") {
      plan.approvedBy = new Types.ObjectId(userId);
      plan.approvedAt = new Date();
    }
    await plan.save();

    await auditService.log({
      companyId,
      userId,
      action: "PRODUCTION_PLAN_STATUS_UPDATED",
      module: "production",
      referenceId: plan._id.toString(),
      before: { status: previousStatus },
      after: { status },
    });

    await notificationService.notifyUsers(
      companyId,
      [plan.createdBy],
      `Production plan ${plan.planNumber} ${status.toLowerCase()}`,
      `Production plan "${plan.title}" moved from ${previousStatus} to ${status}.`,
      "order_status",
      { link: "/app/production" }
    );

    return plan;
  }

  // ==========================================
  // WORK ORDERS
  // ==========================================

  async createWorkOrder(companyId: string, userId: string, input: CreateWorkOrderInput) {
    const warehouse = await Warehouse.findOne({ _id: input.warehouseId, companyId, isDeleted: { $ne: true } });
    if (!warehouse) throw notFound("Warehouse");

    if (input.outputWarehouseId) {
      const outputWarehouse = await Warehouse.findOne({ _id: input.outputWarehouseId, companyId, isDeleted: { $ne: true } });
      if (!outputWarehouse) throw notFound("Output warehouse");
    }

    if (input.planId) {
      const plan = await ProductionPlan.findOne({ _id: input.planId, companyId, isDeleted: { $ne: true } });
      if (!plan) throw notFound("Production plan");
      if (plan.status === "Cancelled" || plan.status === "Completed") {
        throw badRequest(`Cannot add work orders to a ${plan.status.toLowerCase()} production plan`);
      }
    }

    const workOrderNumber = await generateDocNumber(WorkOrder, companyId, "WO");
    const stageNames = input.stages && input.stages.length > 0 ? input.stages : DEFAULT_STAGES;

    const workOrder = await WorkOrder.create({
      companyId: new Types.ObjectId(companyId),
      workOrderNumber,
      planId: toId(input.planId),
      factoryId: toId(input.factoryId),
      warehouseId: new Types.ObjectId(input.warehouseId),
      outputWarehouseId: toId(input.outputWarehouseId),
      productId: toId(input.productId),
      itemName: input.itemName.trim(),
      sku: input.sku.trim().toUpperCase(),
      unit: input.unit || "units",
      plannedQuantity: Number(input.plannedQuantity),
      priority: input.priority || "medium",
      plannedStartDate: input.plannedStartDate ? new Date(input.plannedStartDate) : undefined,
      plannedEndDate: input.plannedEndDate ? new Date(input.plannedEndDate) : undefined,
      assignedTo: toId(input.assignedTo),
      notes: input.notes,
      status: "Planned",
      stages: stageNames.map((name, index) => ({ name, sequence: index + 1, status: "pending" })),
      materials: (input.materials || []).map((m) => ({
        sku: m.sku.trim().toUpperCase(),
        itemName: m.itemName.trim(),
        requiredQuantity: Number(m.requiredQuantity),
        consumedQuantity: 0,
        unit: m.unit || "units",
      })),
      statusTimeline: [
        { status: "Planned", timestamp: new Date(), updatedBy: new Types.ObjectId(userId), comment: "Work order created" },
      ],
      createdBy: new Types.ObjectId(userId),
    });

    await auditService.log({
      companyId,
      userId,
      action: "WORK_ORDER_CREATED",
      module: "production",
      referenceId: workOrder._id.toString(),
      after: { workOrderNumber, sku: workOrder.sku, plannedQuantity: workOrder.plannedQuantity },
    });

    if (input.assignedTo && input.assignedTo !== userId) {
      await notificationService.notifyUsers(
        companyId,
        [input.assignedTo],
        `Work order ${workOrderNumber} assigned to you`,
        `Produce ${workOrder.plannedQuantity} ${workOrder.unit} of ${workOrder.itemName} (${workOrder.sku}).`,
        "production_update",
        { link: `/app/production/work-orders/${workOrder._id}` }
      );
    }

    return workOrder;
  }

  async getWorkOrders(companyId: string, query: any) {
    const { page, limit, skip } = paginate(query);
    const filter: any = { companyId, isDeleted: { $ne: true } };
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.factoryId) filter.factoryId = query.factoryId;
    if (query.warehouseId) filter.warehouseId = query.warehouseId;
    if (query.planId) filter.planId = query.planId;
    const dateRange = buildDateRange(query.startDate, query.endDate);
    if (dateRange) filter.createdAt = dateRange;
    if (query.search) {
      const rx = { $regex: escapeRegex(query.search), $options: "i" };
      filter.$or = [{ workOrderNumber: rx }, { itemName: rx }, { sku: rx }];
    }

    const sortField = ["createdAt", "plannedEndDate", "plannedQuantity", "workOrderNumber"].includes(query.sortBy)
      ? query.sortBy
      : "createdAt";
    const sortDir = query.sortOrder === "asc" ? 1 : -1;

    const [workOrders, total] = await Promise.all([
      WorkOrder.find(filter)
        .select("-consumptionLog -scrapLog -outputLog -statusTimeline")
        .populate("factoryId", "name code")
        .populate("warehouseId", "name code")
        .populate("planId", "planNumber title")
        .populate("assignedTo", "firstName lastName email")
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit),
      WorkOrder.countDocuments(filter),
    ]);

    return { success: true, data: workOrders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getWorkOrderById(companyId: string, workOrderId: string) {
    const workOrder = await WorkOrder.findOne({ _id: workOrderId, companyId, isDeleted: { $ne: true } })
      .populate("factoryId", "name code")
      .populate("warehouseId", "name code")
      .populate("outputWarehouseId", "name code")
      .populate("planId", "planNumber title status")
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("jobCards.assignedTo", "firstName lastName email")
      .populate("statusTimeline.updatedBy", "firstName lastName");
    if (!workOrder) throw notFound("Work order");
    return workOrder;
  }

  private async loadWorkOrder(companyId: string, workOrderId: string) {
    const workOrder = await WorkOrder.findOne({ _id: workOrderId, companyId, isDeleted: { $ne: true } });
    if (!workOrder) throw notFound("Work order");
    return workOrder;
  }

  private assertActive(workOrder: IWorkOrder) {
    if (workOrder.status === "Completed" || workOrder.status === "Cancelled") {
      throw badRequest(`Work order ${workOrder.workOrderNumber} is ${workOrder.status.toLowerCase()} and can no longer be modified`);
    }
  }

  private pushStatus(workOrder: IWorkOrder, status: WorkOrderStatus, userId: string, comment?: string) {
    workOrder.status = status;
    workOrder.statusTimeline.push({ status, timestamp: new Date(), updatedBy: new Types.ObjectId(userId), comment });
    if (status === "In Progress" && !workOrder.actualStartDate) workOrder.actualStartDate = new Date();
    if (status === "Completed") workOrder.actualEndDate = new Date();
  }

  // Shop-floor activity implicitly starts a planned/released work order
  private autoStart(workOrder: IWorkOrder, userId: string, reason: string) {
    if (workOrder.status === "Planned" || workOrder.status === "Released") {
      this.pushStatus(workOrder, "In Progress", userId, reason);
    }
  }

  private async notifyWorkOrder(companyId: string, workOrder: IWorkOrder, title: string, message: string) {
    await notificationService.notifyUsers(
      companyId,
      [workOrder.createdBy, workOrder.assignedTo],
      title,
      message,
      "order_status",
      { link: `/app/production/work-orders/${workOrder._id}` }
    );
  }

  async updateWorkOrderStatus(companyId: string, userId: string, workOrderId: string, status: WorkOrderStatus, comment?: string) {
    const workOrder = await this.loadWorkOrder(companyId, workOrderId);

    if (!WORK_ORDER_TRANSITIONS[workOrder.status].includes(status)) {
      throw badRequest(`Cannot move work order from '${workOrder.status}' to '${status}'`);
    }

    const previousStatus = workOrder.status;
    this.pushStatus(workOrder, status, userId, comment);
    if (status === "Completed") {
      workOrder.stages.forEach((stage) => {
        if (stage.status === "pending" || stage.status === "in_progress") {
          stage.status = "completed";
          stage.completedAt = new Date();
          stage.completedBy = new Types.ObjectId(userId);
        }
      });
    }
    await workOrder.save();

    if (status === "Completed" || status === "In Progress") {
      await this.syncPlanProgress(companyId, workOrder);
    }

    await auditService.log({
      companyId,
      userId,
      action: "WORK_ORDER_STATUS_UPDATED",
      module: "production",
      referenceId: workOrder._id.toString(),
      before: { status: previousStatus },
      after: { status, comment },
    });

    await this.notifyWorkOrder(
      companyId,
      workOrder,
      `Work order ${workOrder.workOrderNumber}: ${status}`,
      `Work order for ${workOrder.itemName} moved from ${previousStatus} to ${status}.${comment ? ` Note: ${comment}` : ""}`
    );

    return workOrder;
  }

  // ------------------------------------------
  // Production Stage Tracking
  // ------------------------------------------

  async updateStage(
    companyId: string,
    userId: string,
    workOrderId: string,
    stageId: string,
    input: { status: StageStatus; notes?: string }
  ) {
    const workOrder = await this.loadWorkOrder(companyId, workOrderId);
    this.assertActive(workOrder);

    const stage = workOrder.stages.id(stageId);
    if (!stage) throw notFound("Production stage");

    const previousStatus = stage.status;
    stage.status = input.status;
    if (input.notes !== undefined) stage.notes = input.notes;
    if (input.status === "in_progress" && !stage.startedAt) stage.startedAt = new Date();
    if (input.status === "completed" || input.status === "skipped") {
      stage.completedAt = new Date();
      stage.completedBy = new Types.ObjectId(userId);
      if (!stage.startedAt) stage.startedAt = stage.completedAt;
    }
    if (input.status === "pending") {
      stage.startedAt = undefined;
      stage.completedAt = undefined;
      stage.completedBy = undefined;
    }

    if (input.status !== "pending") this.autoStart(workOrder, userId, `Stage "${stage.name}" started`);
    await workOrder.save();

    await auditService.log({
      companyId,
      userId,
      action: "PRODUCTION_STAGE_UPDATED",
      module: "production",
      referenceId: workOrder._id.toString(),
      before: { stage: stage.name, status: previousStatus },
      after: { stage: stage.name, status: input.status },
    });

    return workOrder;
  }

  // ------------------------------------------
  // Job Card Management
  // ------------------------------------------

  async addJobCard(companyId: string, userId: string, workOrderId: string, input: JobCardInput) {
    const workOrder = await this.loadWorkOrder(companyId, workOrderId);
    this.assertActive(workOrder);

    const jobCardNumber = `${workOrder.workOrderNumber}-JC${String(workOrder.jobCards.length + 1).padStart(2, "0")}`;
    workOrder.jobCards.push({
      jobCardNumber,
      title: input.title.trim(),
      stageName: input.stageName,
      assignedTo: toId(input.assignedTo),
      status: "open",
      plannedHours: Number(input.plannedHours) || 0,
      actualHours: 0,
      instructions: input.instructions,
    });
    await workOrder.save();

    await auditService.log({
      companyId,
      userId,
      action: "JOB_CARD_CREATED",
      module: "production",
      referenceId: workOrder._id.toString(),
      after: { jobCardNumber, title: input.title, stageName: input.stageName },
    });

    if (input.assignedTo && input.assignedTo !== userId) {
      await notificationService.notifyUsers(
        companyId,
        [input.assignedTo],
        `Job card ${jobCardNumber} assigned to you`,
        `${input.title}${input.stageName ? ` (stage: ${input.stageName})` : ""} for work order ${workOrder.workOrderNumber}.`,
        "production_update",
        { link: `/app/production/work-orders/${workOrder._id}` }
      );
    }

    return workOrder;
  }

  async updateJobCard(companyId: string, userId: string, workOrderId: string, jobCardId: string, input: UpdateJobCardInput) {
    const workOrder = await this.loadWorkOrder(companyId, workOrderId);
    this.assertActive(workOrder);

    const jobCard = workOrder.jobCards.id(jobCardId);
    if (!jobCard) throw notFound("Job card");

    const before = { status: jobCard.status, actualHours: jobCard.actualHours };
    if (input.status) {
      jobCard.status = input.status;
      if (input.status === "in_progress" && !jobCard.startedAt) jobCard.startedAt = new Date();
      if (input.status === "completed") jobCard.completedAt = new Date();
    }
    if (input.actualHours !== undefined) jobCard.actualHours = Number(input.actualHours);
    if (input.assignedTo !== undefined) jobCard.assignedTo = toId(input.assignedTo);
    if (input.notes !== undefined) jobCard.notes = input.notes;

    if (input.status === "in_progress") this.autoStart(workOrder, userId, `Job card ${jobCard.jobCardNumber} started`);
    await workOrder.save();

    await auditService.log({
      companyId,
      userId,
      action: "JOB_CARD_UPDATED",
      module: "production",
      referenceId: workOrder._id.toString(),
      before: { jobCardNumber: jobCard.jobCardNumber, ...before },
      after: { jobCardNumber: jobCard.jobCardNumber, status: jobCard.status, actualHours: jobCard.actualHours },
    });

    return workOrder;
  }

  // ------------------------------------------
  // Material Consumption (issues raw material stock)
  // ------------------------------------------

  async consumeMaterials(companyId: string, userId: string, workOrderId: string, input: ConsumeMaterialInput) {
    const workOrder = await this.loadWorkOrder(companyId, workOrderId);
    this.assertActive(workOrder);

    const sourceWarehouseId = input.warehouseId || workOrder.warehouseId.toString();
    const consumed: Array<{ sku: string; quantity: number; totalCost: number }> = [];

    for (const item of input.items) {
      const sku = item.sku.trim().toUpperCase();
      let result;
      try {
        result = await inventoryService.stockOut(companyId, userId, {
          warehouseId: sourceWarehouseId,
          sku,
          quantity: Number(item.quantity),
          referenceNumber: workOrder.workOrderNumber,
          reason: `Material consumption for ${workOrder.workOrderNumber}`,
          notes: item.notes,
        });
      } catch (err: any) {
        // Earlier lines in this request are already issued; report what succeeded
        throw new HttpError(
          400,
          `${err.message}${consumed.length ? ` (already consumed: ${consumed.map((c) => `${c.quantity} ${c.sku}`).join(", ")})` : ""}`
        );
      }

      const inventory = result.inventory;
      const totalCost = round2(Number(item.quantity) * inventory.unitCost);
      workOrder.consumptionLog.push({
        sku,
        itemName: inventory.itemName,
        quantity: Number(item.quantity),
        unit: inventory.unit,
        unitCost: inventory.unitCost,
        totalCost,
        referenceNumber: workOrder.workOrderNumber,
        consumedBy: new Types.ObjectId(userId),
        consumedAt: new Date(),
        notes: item.notes,
      });

      const material = workOrder.materials.find((m) => m.sku === sku);
      if (material) {
        material.consumedQuantity = round2(material.consumedQuantity + Number(item.quantity));
      } else {
        workOrder.materials.push({
          sku,
          itemName: inventory.itemName,
          requiredQuantity: 0,
          consumedQuantity: Number(item.quantity),
          unit: inventory.unit,
        });
      }

      workOrder.materialCost = round2(workOrder.materialCost + totalCost);
      consumed.push({ sku, quantity: Number(item.quantity), totalCost });
      // Persist after each line so the record matches the inventory already issued
      await workOrder.save();
    }

    this.autoStart(workOrder, userId, "Material issued to production");
    await workOrder.save();

    await auditService.log({
      companyId,
      userId,
      action: "PRODUCTION_MATERIAL_CONSUMED",
      module: "production",
      referenceId: workOrder._id.toString(),
      after: { workOrderNumber: workOrder.workOrderNumber, warehouseId: sourceWarehouseId, consumed },
    });

    return workOrder;
  }

  // ------------------------------------------
  // Production Completion (receives finished goods)
  // ------------------------------------------

  async recordOutput(companyId: string, userId: string, workOrderId: string, input: RecordOutputInput) {
    const workOrder = await this.loadWorkOrder(companyId, workOrderId);
    this.assertActive(workOrder);

    const quantity = Number(input.quantity) || 0;
    const scrapQuantity = Number(input.scrapQuantity) || 0;
    if (quantity <= 0 && scrapQuantity <= 0 && !input.markComplete) {
      throw badRequest("Provide a produced quantity, a scrap quantity, or mark the work order complete");
    }
    if (scrapQuantity > 0 && !input.scrapReason) {
      throw badRequest("A scrap reason is required when recording scrap");
    }

    const outputWarehouseId = input.warehouseId || workOrder.outputWarehouseId?.toString() || workOrder.warehouseId.toString();

    if (quantity > 0) {
      // Finished goods carry the material cost spread across everything produced so far
      const totalProduced = workOrder.producedQuantity + quantity;
      // Without consumed material there is no cost basis, so leave the stock's existing unit cost alone
      const unitCost =
        input.unitCost !== undefined
          ? Number(input.unitCost)
          : workOrder.materialCost > 0
            ? round2(workOrder.materialCost / totalProduced)
            : undefined;

      try {
        await inventoryService.stockIn(companyId, userId, {
          warehouseId: outputWarehouseId,
          productId: workOrder.productId?.toString(),
          sku: workOrder.sku,
          itemName: workOrder.itemName,
          itemCategory: "finished_goods",
          quantity,
          unit: workOrder.unit,
          unitCost,
          referenceNumber: workOrder.workOrderNumber,
          reason: `Production output from ${workOrder.workOrderNumber}`,
          notes: input.notes,
        });
      } catch (err: any) {
        throw new HttpError(400, err.message);
      }

      workOrder.producedQuantity = round2(totalProduced);
      workOrder.outputLog.push({
        quantity,
        warehouseId: new Types.ObjectId(outputWarehouseId),
        recordedBy: new Types.ObjectId(userId),
        recordedAt: new Date(),
        notes: input.notes,
      });
    }

    if (scrapQuantity > 0) {
      workOrder.scrapQuantity = round2(workOrder.scrapQuantity + scrapQuantity);
      workOrder.scrapLog.push({
        quantity: scrapQuantity,
        reason: input.scrapReason as string,
        recordedBy: new Types.ObjectId(userId),
        recordedAt: new Date(),
        notes: input.notes,
      });
    }

    this.autoStart(workOrder, userId, "Production output recorded");

    const shouldComplete = input.markComplete || workOrder.producedQuantity >= workOrder.plannedQuantity;
    if (shouldComplete) {
      this.pushStatus(
        workOrder,
        "Completed",
        userId,
        `Production completed: ${workOrder.producedQuantity}/${workOrder.plannedQuantity} ${workOrder.unit}`
      );
      workOrder.stages.forEach((stage) => {
        if (stage.status === "pending" || stage.status === "in_progress") {
          stage.status = "completed";
          stage.completedAt = new Date();
          stage.completedBy = new Types.ObjectId(userId);
        }
      });
    }

    await workOrder.save();
    await this.syncPlanProgress(companyId, workOrder);

    await auditService.log({
      companyId,
      userId,
      action: shouldComplete ? "WORK_ORDER_COMPLETED" : "PRODUCTION_OUTPUT_RECORDED",
      module: "production",
      referenceId: workOrder._id.toString(),
      after: {
        workOrderNumber: workOrder.workOrderNumber,
        quantityProduced: quantity,
        scrapQuantity,
        totalProduced: workOrder.producedQuantity,
        warehouseId: outputWarehouseId,
      },
    });

    if (shouldComplete) {
      await this.notifyWorkOrder(
        companyId,
        workOrder,
        `Work order ${workOrder.workOrderNumber} completed`,
        `${workOrder.producedQuantity} ${workOrder.unit} of ${workOrder.itemName} produced (${workOrder.scrapQuantity} scrapped).`
      );
    }

    logger.info(`[Production] ${workOrder.workOrderNumber}: +${quantity} produced, +${scrapQuantity} scrap`);
    return workOrder;
  }

  // ------------------------------------------
  // Scrap Tracking
  // ------------------------------------------

  async recordScrap(companyId: string, userId: string, workOrderId: string, input: RecordScrapInput) {
    const workOrder = await this.loadWorkOrder(companyId, workOrderId);
    this.assertActive(workOrder);

    const quantity = Number(input.quantity);
    workOrder.scrapQuantity = round2(workOrder.scrapQuantity + quantity);
    workOrder.scrapLog.push({
      quantity,
      reason: input.reason,
      stageName: input.stageName,
      recordedBy: new Types.ObjectId(userId),
      recordedAt: new Date(),
      notes: input.notes,
    });
    await workOrder.save();

    await auditService.log({
      companyId,
      userId,
      action: "PRODUCTION_SCRAP_RECORDED",
      module: "production",
      referenceId: workOrder._id.toString(),
      after: { workOrderNumber: workOrder.workOrderNumber, quantity, reason: input.reason, stageName: input.stageName },
    });

    return workOrder;
  }

  // Keep the parent plan's per-item produced quantities and status in step with its work orders
  private async syncPlanProgress(companyId: string, workOrder: IWorkOrder) {
    if (!workOrder.planId) return;
    const plan = await ProductionPlan.findOne({ _id: workOrder.planId, companyId });
    if (!plan || plan.status === "Cancelled") return;

    const siblings = await WorkOrder.find({ companyId, planId: plan._id, isDeleted: { $ne: true }, status: { $ne: "Cancelled" } });
    plan.items.forEach((item) => {
      item.producedQuantity = round2(
        siblings.filter((wo) => wo.sku === item.sku).reduce((sum, wo) => sum + wo.producedQuantity, 0)
      );
    });

    const allDone = plan.items.every((item) => item.producedQuantity >= item.plannedQuantity);
    if (allDone) {
      plan.status = "Completed";
    } else if (plan.status === "Draft" || plan.status === "Approved") {
      plan.status = "In Progress";
    }
    await plan.save();
  }

  // ==========================================
  // PRODUCTION REPORTS
  // ==========================================

  async getReports(companyId: string, query: { startDate?: string; endDate?: string } = {}) {
    const companyObjectId = new Types.ObjectId(companyId);
    const match: any = { companyId: companyObjectId, isDeleted: { $ne: true } };
    const dateRange = buildDateRange(query.startDate, query.endDate);
    if (dateRange) match.createdAt = dateRange;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [statusAgg, totalsAgg, topProducts, monthlyOutput, activePlans, overdue] = await Promise.all([
      WorkOrder.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      WorkOrder.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            planned: { $sum: "$plannedQuantity" },
            produced: { $sum: "$producedQuantity" },
            scrap: { $sum: "$scrapQuantity" },
            materialCost: { $sum: "$materialCost" },
            total: { $sum: 1 },
          },
        },
      ]),
      WorkOrder.aggregate([
        { $match: match },
        { $group: { _id: "$sku", itemName: { $first: "$itemName" }, produced: { $sum: "$producedQuantity" }, scrap: { $sum: "$scrapQuantity" } } },
        { $sort: { produced: -1 } },
        { $limit: 5 },
      ]),
      WorkOrder.aggregate([
        { $match: { companyId: companyObjectId, isDeleted: { $ne: true } } },
        { $unwind: "$outputLog" },
        { $match: { "outputLog.recordedAt": { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: "$outputLog.recordedAt" }, month: { $month: "$outputLog.recordedAt" } },
            quantity: { $sum: "$outputLog.quantity" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      ProductionPlan.countDocuments({ companyId, isDeleted: { $ne: true }, status: { $in: ["Approved", "In Progress"] } }),
      WorkOrder.countDocuments({
        companyId,
        isDeleted: { $ne: true },
        status: { $nin: ["Completed", "Cancelled"] },
        plannedEndDate: { $lt: new Date() },
      }),
    ]);

    const totals = totalsAgg[0] || { planned: 0, produced: 0, scrap: 0, materialCost: 0, total: 0 };
    const byStatus: Record<string, number> = {};
    statusAgg.forEach((s: any) => (byStatus[s._id] = s.count));

    const months: Array<{ label: string; value: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const found = monthlyOutput.find((m: any) => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1);
      months.push({ label: d.toLocaleString("en-US", { month: "short" }), value: found ? found.quantity : 0 });
    }

    const grossOutput = totals.produced + totals.scrap;
    return {
      success: true,
      data: {
        totalWorkOrders: totals.total,
        byStatus,
        activeWorkOrders: (byStatus["Released"] || 0) + (byStatus["In Progress"] || 0) + (byStatus["On Hold"] || 0),
        completedWorkOrders: byStatus["Completed"] || 0,
        overdueWorkOrders: overdue,
        activePlans,
        plannedQuantity: totals.planned,
        producedQuantity: totals.produced,
        scrapQuantity: totals.scrap,
        scrapRate: grossOutput > 0 ? round2((totals.scrap / grossOutput) * 100) : 0,
        completionRate: totals.planned > 0 ? round2((totals.produced / totals.planned) * 100) : 0,
        materialCost: round2(totals.materialCost),
        topProducts: topProducts.map((p: any) => ({ sku: p._id, itemName: p.itemName, produced: p.produced, scrap: p.scrap })),
        monthlyOutput: months,
      },
    };
  }
}

export const productionService = new ProductionService();
export default productionService;
