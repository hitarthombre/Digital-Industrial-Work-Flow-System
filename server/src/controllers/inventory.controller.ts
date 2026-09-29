import { Request, Response, NextFunction } from "express";
import { inventoryService } from "../services/inventory.service";
import { logger } from "../config/logger";
import z from "zod";

// Zod Validation Schemas
export const StockInSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse ID is required"),
  productId: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  itemName: z.string().min(1, "Item name is required"),
  itemCategory: z.enum(["raw_material", "finished_goods", "packaging", "components", "other"]).optional(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().optional(),
  unitCost: z.number().min(0, "Unit cost cannot be negative").optional(),
  minThreshold: z.number().min(0).optional(),
  maxThreshold: z.number().min(0).optional(),
  reorderPoint: z.number().min(0).optional(),
  reorderQuantity: z.number().min(0).optional(),
  locationInWarehouse: z.string().optional(),
  referenceNumber: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const StockOutSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse ID is required"),
  productId: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  itemName: z.string().optional(),
  itemCategory: z.enum(["raw_material", "finished_goods", "packaging", "components", "other"]).optional(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().optional(),
  referenceNumber: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const StockTransferSchema = z.object({
  sourceWarehouseId: z.string().min(1, "Source warehouse ID is required"),
  destinationWarehouseId: z.string().min(1, "Destination warehouse ID is required"),
  items: z
    .array(
      z.object({
        sku: z.string().min(1, "SKU is required"),
        itemName: z.string().min(1, "Item name is required"),
        quantity: z.number().positive("Transfer quantity must be greater than 0"),
        unit: z.string().optional(),
      })
    )
    .min(1, "At least one item is required for transfer"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const StockAdjustmentSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse ID is required"),
  sku: z.string().min(1, "SKU is required"),
  itemName: z.string().min(1, "Item name is required"),
  newQuantity: z.number().min(0, "New quantity cannot be negative"),
  unitCost: z.number().min(0).optional(),
  reason: z.string().min(1, "Adjustment reason is required"),
  notes: z.string().optional(),
});

export const CreateMovementSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse ID is required"),
  productId: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  itemName: z.string().min(1, "Item name is required"),
  type: z.enum(["stock_in", "stock_out", "adjustment", "transfer"]),
  itemCategory: z.enum(["raw_material", "finished_goods", "packaging", "components", "other"]).optional(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().optional(),
  unitCost: z.number().min(0).optional(),
  referenceNumber: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export class InventoryController {
  // POST /api/inventory/stock-in
  async stockIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      logger.info(`[API POST /api/inventory/stock-in] Request by User ${userId} for SKU ${req.body.sku}`);
      const result = await inventoryService.stockIn(companyId, userId, req.body);

      res.status(201).json(result);
    } catch (error: any) {
      logger.error(`[API POST /api/inventory/stock-in Error] ${error.message}`);
      if (error.message.includes("Warehouse location not found") || error.message.includes("Quantity")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // POST /api/inventory/stock-out
  async stockOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      logger.info(`[API POST /api/inventory/stock-out] Request by User ${userId} for SKU ${req.body.sku}`);
      const result = await inventoryService.stockOut(companyId, userId, req.body);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error(`[API POST /api/inventory/stock-out Error] ${error.message}`);
      if (
        error.message.includes("Insufficient stock") ||
        error.message.includes("Warehouse location not found") ||
        error.message.includes("does not exist") ||
        error.message.includes("Quantity")
      ) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // POST /api/inventory/transfer
  async transfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      logger.info(`[API POST /api/inventory/transfer] Request by User ${userId}`);
      const result = await inventoryService.transfer(companyId, userId, req.body);

      res.status(201).json(result);
    } catch (error: any) {
      logger.error(`[API POST /api/inventory/transfer Error] ${error.message}`);
      if (
        error.message.includes("same") ||
        error.message.includes("not found") ||
        error.message.includes("Insufficient stock") ||
        error.message.includes("quantity")
      ) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // POST /api/inventory/adjust
  async adjust(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      logger.info(`[API POST /api/inventory/adjust] Request by User ${userId} for SKU ${req.body.sku}`);
      const result = await inventoryService.adjust(companyId, userId, req.body);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error(`[API POST /api/inventory/adjust Error] ${error.message}`);
      if (error.message.includes("Warehouse location not found") || error.message.includes("negative")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // GET /api/inventory/history
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { search, type, itemCategory, warehouseId, startDate, endDate, page, limit } = req.query;

      const result = await inventoryService.getHistory(companyId, {
        search: search as string,
        type: type as string,
        itemCategory: itemCategory as string,
        warehouseId: warehouseId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 15,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error(`[API GET /api/inventory/history Error]`, error);
      next(error);
    }
  }

  // GET /api/inventory/raw-materials
  async getRawMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { search, warehouseId, status, page, limit } = req.query;

      const result = await inventoryService.getRawMaterials(companyId, {
        search: search as string,
        warehouseId: warehouseId as string,
        status: status as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 15,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error(`[API GET /api/inventory/raw-materials Error]`, error);
      next(error);
    }
  }

  // GET /api/inventory/finished-goods
  async getFinishedGoods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { search, warehouseId, status, page, limit } = req.query;

      const result = await inventoryService.getFinishedGoods(companyId, {
        search: search as string,
        warehouseId: warehouseId as string,
        status: status as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 15,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error(`[API GET /api/inventory/finished-goods Error]`, error);
      next(error);
    }
  }

  // GET /api/inventory/alerts/low-stock
  async getLowStockAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { status } = req.query;

      const result = await inventoryService.getLowStockAlerts(companyId, {
        status: status as string,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error(`[API GET /api/inventory/alerts/low-stock Error]`, error);
      next(error);
    }
  }

  // GET /api/inventory/reports
  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;

      const result = await inventoryService.getReports(companyId);

      res.status(200).json(result);
    } catch (error) {
      logger.error(`[API GET /api/inventory/reports Error]`, error);
      next(error);
    }
  }

  // GET /api/inventory/movements (Legacy)
  async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.getHistory(req, res, next);
  }

  // POST /api/inventory/movements (Legacy)
  async recordMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      const movement = await inventoryService.recordMovement(companyId, userId, req.body);

      res.status(201).json({
        success: true,
        message: "Stock movement recorded successfully",
        data: movement,
      });
    } catch (error: any) {
      if (error.message.includes("Warehouse location not found") || error.message.includes("Quantity")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // GET /api/inventory/stock-levels (Legacy)
  async getStockLevels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;

      const result = await inventoryService.getStockLevels(companyId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
export default inventoryController;
