import mongoose from "mongoose";
import WorkOrder, { IWorkOrder, WorkOrderStage, WorkOrderStatus, WorkOrderPriority } from "../models/WorkOrder";
import Inventory from "../models/Inventory";
import Product from "../models/Product";
import Factory from "../models/Factory";

export class ProductionService {
  async getWorkOrders(
    companyId: string,
    options: {
      factoryId?: string;
      status?: string;
      stage?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { factoryId, status, stage, search, page = 1, limit = 50 } = options;
    const query: any = { company: companyId };

    if (factoryId) {
      query.factory = factoryId;
    }
    if (status) {
      query.status = status;
    }
    if (stage) {
      query.stage = stage;
    }
    if (search) {
      query.$or = [
        { workOrderNumber: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [workOrders, total] = await Promise.all([
      WorkOrder.find(query)
        .populate("factory", "name code location")
        .populate("product", "name sku unit category price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WorkOrder.countDocuments(query),
    ]);

    return {
      workOrders,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getWorkOrderById(companyId: string, id: string): Promise<IWorkOrder | null> {
    return WorkOrder.findOne({ _id: id, company: companyId })
      .populate("factory", "name code location")
      .populate("product", "name sku unit category price")
      .populate("createdBy", "firstName lastName email");
  }

  async createWorkOrder(
    companyId: string,
    userId: string,
    data: {
      factoryId: string;
      productId: string;
      targetQuantity: number;
      unit?: string;
      priority?: WorkOrderPriority;
      startDate?: Date;
      targetCompletionDate: Date;
      notes?: string;
    }
  ): Promise<IWorkOrder> {
    // Verify factory and product exist and belong to tenant
    const [factory, product] = await Promise.all([
      Factory.findOne({ _id: data.factoryId, companyId }),
      Product.findOne({ _id: data.productId, companyId }),
    ]);

    if (!factory) {
      throw new Error("Target factory not found or access denied");
    }
    if (!product) {
      throw new Error("Target product not found or access denied");
    }

    // Generate work order number: WO-YYYYMM-XXXX
    const count = await WorkOrder.countDocuments({ company: companyId });
    const dateStr = new Date().toISOString().slice(0, 7).replace("-", "");
    const seqStr = String(count + 1).padStart(4, "0");
    const workOrderNumber = `WO-${dateStr}-${seqStr}`;

    // Standard stage job cards
    const defaultStages = [
      { stageName: "Material Preparation", status: "IN_PROGRESS" as const, notes: "Gather raw materials" },
      { stageName: "Machining & Processing", status: "PENDING" as const, notes: "Execute component processing" },
      { stageName: "Assembly", status: "PENDING" as const, notes: "Assemble sub-components" },
      { stageName: "Quality Inspection", status: "PENDING" as const, notes: "Conduct quality check QA/QC" },
      { stageName: "Packaging & Handover", status: "PENDING" as const, notes: "Package finished goods" },
    ];

    const workOrder = new WorkOrder({
      workOrderNumber,
      company: companyId,
      factory: data.factoryId,
      product: data.productId,
      targetQuantity: data.targetQuantity,
      completedQuantity: 0,
      scrapQuantity: 0,
      unit: data.unit || product.uom?.unit || "pcs",
      priority: data.priority || "MEDIUM",
      status: "PLANNED",
      stage: "PLANNED",
      startDate: data.startDate || new Date(),
      targetCompletionDate: data.targetCompletionDate,
      jobCards: defaultStages,
      notes: data.notes,
      createdBy: userId,
    });

    await workOrder.save();
    return this.getWorkOrderById(companyId, workOrder._id.toString()) as any;
  }

  async updateWorkOrderStage(
    companyId: string,
    id: string,
    stage: WorkOrderStage,
    status?: WorkOrderStatus
  ): Promise<IWorkOrder | null> {
    const workOrder = await WorkOrder.findOne({ _id: id, company: companyId });
    if (!workOrder) {
      throw new Error("Work order not found");
    }

    workOrder.stage = stage;

    if (stage === "COMPLETED") {
      workOrder.status = "COMPLETED";
      workOrder.actualCompletionDate = new Date();
      workOrder.completedQuantity = workOrder.targetQuantity - workOrder.scrapQuantity;
    } else if (status) {
      workOrder.status = status;
    } else if (workOrder.status === "PLANNED" && stage !== "PLANNED") {
      workOrder.status = "IN_PROGRESS";
    }

    // Update job card status corresponding to stage
    workOrder.jobCards.forEach((card) => {
      const nameLower = card.stageName.toLowerCase();
      const stageLower = stage.toLowerCase().replace("_", " ");
      if (nameLower.includes(stageLower) || stageLower.includes(nameLower)) {
        card.status = "IN_PROGRESS";
        if (!card.startedAt) card.startedAt = new Date();
      }
    });

    await workOrder.save();
    return this.getWorkOrderById(companyId, id);
  }

  async consumeMaterial(
    companyId: string,
    userId: string,
    id: string,
    data: {
      productId?: string;
      productName: string;
      warehouseId?: string;
      warehouseName: string;
      quantity: number;
      unit: string;
      deductInventory?: boolean;
    }
  ) {
    const workOrder = await WorkOrder.findOne({ _id: id, company: companyId });
    if (!workOrder) {
      throw new Error("Work order not found");
    }

    // Real-time stock check & optional deduction
    if (data.productId && data.warehouseId && data.deductInventory) {
      const stockItem = await Inventory.findOne({
        company: companyId,
        product: data.productId,
        warehouse: data.warehouseId,
      });

      if (!stockItem || stockItem.quantity < data.quantity) {
        throw new Error(
          `Insufficient stock in ${data.warehouseName}! Available: ${stockItem ? stockItem.quantity : 0} ${data.unit}`
        );
      }

      // Deduct inventory
      stockItem.quantity -= data.quantity;
      await stockItem.save();
    }

    workOrder.consumedMaterials.push({
      product: data.productId ? new mongoose.Types.ObjectId(data.productId) : undefined,
      productName: data.productName,
      warehouse: data.warehouseId ? new mongoose.Types.ObjectId(data.warehouseId) : undefined,
      warehouseName: data.warehouseName,
      quantity: data.quantity,
      unit: data.unit,
      consumedAt: new Date(),
    });

    await workOrder.save();
    return this.getWorkOrderById(companyId, id);
  }

  async recordScrap(
    companyId: string,
    id: string,
    data: {
      materialOrProduct: string;
      quantity: number;
      reason: "DEFECTIVE_RAW_MATERIAL" | "OPERATOR_ERROR" | "MACHINE_MALFUNCTION" | "TESTING_LOSS" | "OTHER";
      stage?: string;
      notes?: string;
    }
  ) {
    const workOrder = await WorkOrder.findOne({ _id: id, company: companyId });
    if (!workOrder) {
      throw new Error("Work order not found");
    }

    workOrder.scrapLogs.push({
      materialOrProduct: data.materialOrProduct,
      quantity: data.quantity,
      reason: data.reason,
      stage: data.stage || workOrder.stage,
      notes: data.notes,
      loggedAt: new Date(),
    });

    workOrder.scrapQuantity += data.quantity;

    await workOrder.save();
    return this.getWorkOrderById(companyId, id);
  }

  async completeWorkOrder(
    companyId: string,
    id: string,
    data: {
      completedQuantity: number;
      scrapQuantity?: number;
      warehouseId?: string;
      notes?: string;
    }
  ) {
    const workOrder = await WorkOrder.findOne({ _id: id, company: companyId });
    if (!workOrder) {
      throw new Error("Work order not found");
    }

    workOrder.completedQuantity = data.completedQuantity;
    if (data.scrapQuantity !== undefined) {
      workOrder.scrapQuantity = data.scrapQuantity;
    }
    workOrder.status = "COMPLETED";
    workOrder.stage = "COMPLETED";
    workOrder.actualCompletionDate = new Date();
    if (data.notes) workOrder.notes = data.notes;

    // Handover finished goods to warehouse if warehouseId specified
    if (data.warehouseId) {
      await Inventory.findOneAndUpdate(
        {
          company: companyId,
          product: workOrder.product,
          warehouse: data.warehouseId,
        },
        {
          $inc: { quantity: data.completedQuantity },
          $set: { lastUpdated: new Date() },
        },
        { upsert: true, new: true }
      );
    }

    await workOrder.save();
    return this.getWorkOrderById(companyId, id);
  }

  async getProductionStats(companyId: string, factoryId?: string) {
    const query: any = { company: companyId };
    if (factoryId) query.factory = factoryId;

    const workOrders = await WorkOrder.find(query).lean();

    const totalOrders = workOrders.length;
    const activeOrders = workOrders.filter((w) => w.status === "IN_PROGRESS" || w.status === "PLANNED").length;
    const completedOrders = workOrders.filter((w) => w.status === "COMPLETED").length;
    const onHoldOrders = workOrders.filter((w) => w.status === "ON_HOLD").length;

    let totalTargetQty = 0;
    let totalCompletedQty = 0;
    let totalScrapQty = 0;

    const stageBreakdown: Record<string, number> = {
      PLANNED: 0,
      MATERIAL_PREP: 0,
      MACHINING: 0,
      ASSEMBLY: 0,
      QUALITY_CHECK: 0,
      PACKAGING: 0,
      COMPLETED: 0,
    };

    workOrders.forEach((w) => {
      totalTargetQty += w.targetQuantity || 0;
      totalCompletedQty += w.completedQuantity || 0;
      totalScrapQty += w.scrapQuantity || 0;
      if (stageBreakdown[w.stage] !== undefined) {
        stageBreakdown[w.stage] += 1;
      }
    });

    const yieldRate =
      totalCompletedQty + totalScrapQty > 0
        ? Math.round((totalCompletedQty / (totalCompletedQty + totalScrapQty)) * 100 * 10) / 10
        : 100;

    const oeeEfficiency =
      totalTargetQty > 0
        ? Math.round((totalCompletedQty / totalTargetQty) * 100 * 10) / 10
        : 0;

    return {
      totalOrders,
      activeOrders,
      completedOrders,
      onHoldOrders,
      totalTargetQty,
      totalCompletedQty,
      totalScrapQty,
      yieldRate,
      oeeEfficiency,
      stageBreakdown,
    };
  }
}

export const productionService = new ProductionService();
export default productionService;
