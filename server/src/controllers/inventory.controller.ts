import { Request, Response, NextFunction } from "express";
import { inventoryService } from "../services/inventory.service";
import z from "zod";

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
  // GET /api/inventory/movements
  async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { search, type, itemCategory, warehouseId, startDate, endDate, page, limit } = req.query;

      const result = await inventoryService.getMovements(companyId, {
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
      next(error);
    }
  }

  // POST /api/inventory/movements
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
      if (error.message === "Warehouse location not found" || error.message.includes("Quantity")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // GET /api/inventory/stock-levels
  async getStockLevels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;

      const result = await inventoryService.getStockLevels(companyId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/inventory/reports
  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;

      const [movementsResult, stockLevelsResult] = await Promise.all([
        inventoryService.getMovements(companyId, { limit: 100 }),
        inventoryService.getStockLevels(companyId),
      ]);

      res.status(200).json({
        success: true,
        reportDate: new Date().toISOString(),
        summary: stockLevelsResult.summary,
        movementStats: movementsResult.stats,
        topStockItems: stockLevelsResult.stockItems.slice(0, 10),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
export default inventoryController;
