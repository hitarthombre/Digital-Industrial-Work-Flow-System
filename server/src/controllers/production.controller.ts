import { Request, Response, NextFunction } from "express";
import z from "zod";
import { productionService } from "../services/production.service";

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);

export const CreatePlanSchema = z.object({
  title: z.string().min(1, "Plan title is required"),
  factoryId: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  priority: priorityEnum.optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        itemName: z.string().min(1, "Item name is required"),
        sku: z.string().min(1, "SKU is required"),
        plannedQuantity: z.number().min(1, "Planned quantity must be at least 1"),
        unit: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .min(1, "At least one product line is required"),
});

export const UpdatePlanStatusSchema = z.object({
  status: z.enum(["Draft", "Approved", "In Progress", "Completed", "Cancelled"]),
});

export const CreateWorkOrderSchema = z.object({
  planId: z.string().optional(),
  factoryId: z.string().optional(),
  warehouseId: z.string().min(1, "Material warehouse is required"),
  outputWarehouseId: z.string().optional(),
  productId: z.string().optional(),
  itemName: z.string().min(1, "Item name is required"),
  sku: z.string().min(1, "SKU is required"),
  unit: z.string().optional(),
  plannedQuantity: z.number().min(1, "Planned quantity must be at least 1"),
  priority: priorityEnum.optional(),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  stages: z.array(z.string().min(1)).optional(),
  materials: z
    .array(
      z.object({
        sku: z.string().min(1, "Material SKU is required"),
        itemName: z.string().min(1, "Material name is required"),
        requiredQuantity: z.number().min(0),
        unit: z.string().optional(),
      })
    )
    .optional(),
});

export const UpdateWorkOrderStatusSchema = z.object({
  status: z.enum(["Planned", "Released", "In Progress", "On Hold", "Completed", "Cancelled"]),
  comment: z.string().optional(),
});

export const UpdateStageSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "skipped"]),
  notes: z.string().optional(),
});

export const CreateJobCardSchema = z.object({
  title: z.string().min(1, "Job card title is required"),
  stageName: z.string().optional(),
  assignedTo: z.string().optional(),
  plannedHours: z.number().min(0).optional(),
  instructions: z.string().optional(),
});

export const UpdateJobCardSchema = z.object({
  status: z.enum(["open", "in_progress", "completed"]).optional(),
  actualHours: z.number().min(0).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

export const ConsumeMaterialSchema = z.object({
  warehouseId: z.string().optional(),
  items: z
    .array(
      z.object({
        sku: z.string().min(1, "SKU is required"),
        quantity: z.number().positive("Quantity must be greater than zero"),
        notes: z.string().optional(),
      })
    )
    .min(1, "At least one material line is required"),
});

export const RecordOutputSchema = z.object({
  quantity: z.number().min(0),
  scrapQuantity: z.number().min(0).optional(),
  scrapReason: z.string().optional(),
  warehouseId: z.string().optional(),
  unitCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  markComplete: z.boolean().optional(),
});

export const RecordScrapSchema = z.object({
  quantity: z.number().positive("Scrap quantity must be greater than zero"),
  reason: z.string().min(1, "Scrap reason is required"),
  stageName: z.string().optional(),
  notes: z.string().optional(),
});

// ==========================================
// CONTROLLER CLASS
// ==========================================

const ctx = (req: Request) => ({
  companyId: String((req as any).user?.companyId),
  userId: String((req as any).user?._id),
});

export class ProductionController {
  // ------------------------------------------
  // Production Plans
  // ------------------------------------------

  // GET /api/production/plans
  async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await productionService.getPlans(ctx(req).companyId, req.query));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/production/plans
  async createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const plan = await productionService.createPlan(companyId, userId, req.body);
      res.status(201).json({ success: true, message: "Production plan created successfully", data: plan });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/production/plans/:id
  async getPlanById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productionService.getPlanById(ctx(req).companyId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/production/plans/:id/status
  async updatePlanStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const plan = await productionService.updatePlanStatus(companyId, userId, req.params.id, req.body.status);
      res.status(200).json({ success: true, message: `Production plan moved to '${plan.status}'`, data: plan });
    } catch (error) {
      next(error);
    }
  }

  // ------------------------------------------
  // Work Orders
  // ------------------------------------------

  // GET /api/production/work-orders
  async getWorkOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await productionService.getWorkOrders(ctx(req).companyId, req.query));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/production/work-orders
  async createWorkOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const workOrder = await productionService.createWorkOrder(companyId, userId, req.body);
      res.status(201).json({ success: true, message: "Work order created successfully", data: workOrder });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/production/work-orders/:id
  async getWorkOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workOrder = await productionService.getWorkOrderById(ctx(req).companyId, req.params.id);
      res.status(200).json({ success: true, data: workOrder });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/production/work-orders/:id/status
  async updateWorkOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const workOrder = await productionService.updateWorkOrderStatus(
        companyId,
        userId,
        req.params.id,
        req.body.status,
        req.body.comment
      );
      res.status(200).json({ success: true, message: `Work order moved to '${workOrder.status}'`, data: workOrder });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/production/work-orders/:id/stages/:stageId
  async updateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const workOrder = await productionService.updateStage(companyId, userId, req.params.id, req.params.stageId, req.body);
      res.status(200).json({ success: true, message: "Production stage updated", data: workOrder });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/production/work-orders/:id/job-cards
  async addJobCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const workOrder = await productionService.addJobCard(companyId, userId, req.params.id, req.body);
      res.status(201).json({ success: true, message: "Job card created", data: workOrder });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/production/work-orders/:id/job-cards/:jobCardId
  async updateJobCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const workOrder = await productionService.updateJobCard(companyId, userId, req.params.id, req.params.jobCardId, req.body);
      res.status(200).json({ success: true, message: "Job card updated", data: workOrder });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/production/work-orders/:id/consume
  async consumeMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const workOrder = await productionService.consumeMaterials(companyId, userId, req.params.id, req.body);
      res.status(200).json({ success: true, message: "Material consumption recorded and stock issued", data: workOrder });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/production/work-orders/:id/output
  async recordOutput(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const workOrder = await productionService.recordOutput(companyId, userId, req.params.id, req.body);
      res.status(200).json({
        success: true,
        message:
          workOrder.status === "Completed"
            ? "Production completed and finished goods received into stock"
            : "Production output recorded",
        data: workOrder,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/production/work-orders/:id/scrap
  async recordScrap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const workOrder = await productionService.recordScrap(companyId, userId, req.params.id, req.body);
      res.status(201).json({ success: true, message: "Scrap recorded", data: workOrder });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/production/reports
  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await productionService.getReports(ctx(req).companyId, req.query as any));
    } catch (error) {
      next(error);
    }
  }
}

export const productionController = new ProductionController();
export default productionController;
