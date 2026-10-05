import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth";
import productionService from "../services/production.service";

// Zod Validation Schemas
export const CreateWorkOrderSchema = z.object({
  factoryId: z.string().min(1, "Factory ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  targetQuantity: z.number().min(1, "Target quantity must be at least 1"),
  unit: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  startDate: z.string().optional(),
  targetCompletionDate: z.string().min(1, "Target completion date is required"),
  notes: z.string().optional(),
});

export const UpdateStageSchema = z.object({
  stage: z.enum([
    "PLANNED",
    "MATERIAL_PREP",
    "MACHINING",
    "ASSEMBLY",
    "QUALITY_CHECK",
    "PACKAGING",
    "COMPLETED",
  ]),
  status: z.enum(["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
});

export const ConsumeMaterialSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, "Material name is required"),
  warehouseId: z.string().optional(),
  warehouseName: z.string().min(1, "Warehouse name is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  deductInventory: z.boolean().optional(),
});

export const RecordScrapSchema = z.object({
  materialOrProduct: z.string().min(1, "Scrap item description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  reason: z.enum([
    "DEFECTIVE_RAW_MATERIAL",
    "OPERATOR_ERROR",
    "MACHINE_MALFUNCTION",
    "TESTING_LOSS",
    "OTHER",
  ]),
  stage: z.string().optional(),
  notes: z.string().optional(),
});

export const CompleteWorkOrderSchema = z.object({
  completedQuantity: z.number().min(0, "Completed quantity cannot be negative"),
  scrapQuantity: z.number().min(0).optional(),
  warehouseId: z.string().optional(),
  notes: z.string().optional(),
});

export class ProductionController {
  async getWorkOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.companyId!;
      const { factoryId, status, stage, search, page, limit } = req.query;

      const result = await productionService.getWorkOrders(companyId, {
        factoryId: factoryId as string,
        status: status as string,
        stage: stage as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });

      res.status(200).json({
        success: true,
        data: result.workOrders,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getWorkOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.companyId!;
      const { id } = req.params;

      const workOrder = await productionService.getWorkOrderById(companyId, id);
      if (!workOrder) {
        res.status(404).json({ success: false, message: "Work order not found" });
        return;
      }

      res.status(200).json({ success: true, data: workOrder });
    } catch (error: any) {
      next(error);
    }
  }

  async createWorkOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.companyId!;
      const userId = req.user!._id.toString();

      const {
        factoryId,
        productId,
        targetQuantity,
        unit,
        priority,
        startDate,
        targetCompletionDate,
        notes,
      } = req.body;

      const workOrder = await productionService.createWorkOrder(companyId, userId, {
        factoryId,
        productId,
        targetQuantity,
        unit,
        priority,
        startDate: startDate ? new Date(startDate) : undefined,
        targetCompletionDate: new Date(targetCompletionDate),
        notes,
      });

      res.status(201).json({
        success: true,
        message: "Work order created successfully",
        data: workOrder,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateStage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.companyId!;
      const { id } = req.params;
      const { stage, status } = req.body;

      const updated = await productionService.updateWorkOrderStage(companyId, id, stage, status);

      res.status(200).json({
        success: true,
        message: `Work order stage updated to ${stage}`,
        data: updated,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async consumeMaterial(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.companyId!;
      const userId = req.user!._id.toString();
      const { id } = req.params;

      const updated = await productionService.consumeMaterial(companyId, userId, id, req.body);

      res.status(200).json({
        success: true,
        message: "Material consumption logged successfully",
        data: updated,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async recordScrap(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.companyId!;
      const { id } = req.params;

      const updated = await productionService.recordScrap(companyId, id, req.body);

      res.status(200).json({
        success: true,
        message: "Scrap defect logged successfully",
        data: updated,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async completeWorkOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.companyId!;
      const { id } = req.params;

      const updated = await productionService.completeWorkOrder(companyId, id, req.body);

      res.status(200).json({
        success: true,
        message: "Work order completed & finished goods handed over",
        data: updated,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.companyId!;
      const { factoryId } = req.query;

      const stats = await productionService.getProductionStats(companyId, factoryId as string);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const productionController = new ProductionController();
export default productionController;
