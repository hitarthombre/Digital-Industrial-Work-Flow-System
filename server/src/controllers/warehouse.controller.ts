import { Response, NextFunction } from "express";
import { z } from "zod";
import { warehouseService } from "../services/warehouse.service";
import { AuthenticatedRequest } from "../middleware/auth";

export const CreateWarehouseSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Warehouse name is required"),
    code: z.string().min(1, "Warehouse code is required"),
    type: z.enum(["raw_material", "finished_goods", "distribution", "cold_storage", "general"]).optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    location: z
      .object({
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
      .optional(),
    capacity: z.number().min(0, "Capacity must be a non-negative number").optional(),
    currentUsage: z.number().min(0, "Current usage must be a non-negative number").optional(),
    managerId: z.string().optional(),
    contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    contactPhone: z.string().optional(),
    status: z.enum(["active", "inactive", "maintenance", "full", "closed"]).optional(),
  }),
});

export const UpdateWarehouseSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Warehouse ID is required"),
  }),
  body: z.object({
    name: z.string().optional(),
    code: z.string().optional(),
    type: z.enum(["raw_material", "finished_goods", "distribution", "cold_storage", "general"]).optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    location: z
      .object({
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
      .optional(),
    capacity: z.number().min(0, "Capacity must be a non-negative number").optional(),
    currentUsage: z.number().min(0, "Current usage must be a non-negative number").optional(),
    managerId: z.string().nullable().optional(),
    contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    contactPhone: z.string().optional(),
    status: z.enum(["active", "inactive", "maintenance", "full", "closed"]).optional(),
  }),
});

export const StockTransferSchema = z.object({
  body: z.object({
    sourceWarehouseId: z.string().min(1, "Source warehouse ID is required"),
    destinationWarehouseId: z.string().min(1, "Destination warehouse ID is required"),
    items: z
      .array(
        z.object({
          itemCode: z.string().min(1, "Item code is required"),
          itemName: z.string().min(1, "Item name is required"),
          quantity: z.number().min(1, "Quantity must be at least 1"),
          unit: z.string().optional(),
        })
      )
      .min(1, "At least one item is required for stock transfer"),
    notes: z.string().optional(),
  }),
});

export class WarehouseController {
  async createWarehouse(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouse = await warehouseService.createWarehouse(
        req.companyId!,
        req.user!._id.toString(),
        req.body
      );

      res.status(201).json({
        success: true,
        message: "Warehouse created successfully",
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWarehouse(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouse = await warehouseService.updateWarehouse(
        req.params.id,
        req.companyId!,
        req.user!._id.toString(),
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Warehouse updated successfully",
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWarehouses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const type = req.query.type as string;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as "asc" | "desc";

      const result = await warehouseService.getWarehouses(req.companyId!, {
        page,
        limit,
        search,
        status,
        type,
        sortBy,
        sortOrder,
      });

      res.status(200).json({
        success: true,
        message: "Warehouses retrieved successfully",
        data: result.warehouses,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getWarehouseById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouse = await warehouseService.getWarehouseById(req.params.id, req.companyId!);

      if (!warehouse) {
        res.status(404).json({
          success: false,
          message: "Warehouse not found or access denied",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Warehouse details retrieved successfully",
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteWarehouse(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await warehouseService.deleteWarehouse(
        req.params.id,
        req.companyId!,
        req.user!._id.toString()
      );

      res.status(200).json({
        success: true,
        message: "Warehouse deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async transferStock(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const transfer = await warehouseService.transferStock(
        req.companyId!,
        req.user!._id.toString(),
        req.body
      );

      res.status(201).json({
        success: true,
        message: "Stock transfer completed successfully",
        data: transfer,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const warehouseController = new WarehouseController();
export default warehouseController;
