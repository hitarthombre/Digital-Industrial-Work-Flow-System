import { Router } from "express";
import {
  warehouseController,
  CreateWarehouseSchema,
  UpdateWarehouseSchema,
  StockTransferSchema,
} from "../controllers/warehouse.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

// Apply authentication and tenant isolation globally to all warehouse endpoints
router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

// Warehouse list & search query endpoint (GET /api/warehouses)
router.get(
  "/",
  requirePermission("warehouses:read") as any,
  (req: any, res: any, next: any) => warehouseController.getWarehouses(req, res, next)
);

// Create new warehouse endpoint (POST /api/warehouses)
router.post(
  "/",
  requirePermission("warehouses:create") as any,
  validateRequest(CreateWarehouseSchema),
  (req: any, res: any, next: any) => warehouseController.createWarehouse(req, res, next)
);

// Stock transfer flow API endpoint (POST /api/warehouses/transfer)
// Defined BEFORE /:id route so it isn't parsed as a warehouse ID parameter
router.post(
  "/transfer",
  requirePermission("warehouses:transfer") as any,
  validateRequest(StockTransferSchema),
  (req: any, res: any, next: any) => warehouseController.transferStock(req, res, next)
);

// Warehouse details & capacity retrieval endpoint (GET /api/warehouses/:id)
router.get(
  "/:id",
  requirePermission("warehouses:read") as any,
  (req: any, res: any, next: any) => warehouseController.getWarehouseById(req, res, next)
);

// Edit warehouse details endpoint (PUT /api/warehouses/:id)
router.put(
  "/:id",
  requirePermission("warehouses:update") as any,
  validateRequest(UpdateWarehouseSchema),
  (req: any, res: any, next: any) => warehouseController.updateWarehouse(req, res, next)
);

// Deactivate / delete warehouse endpoint (DELETE /api/warehouses/:id)
router.delete(
  "/:id",
  requirePermission("warehouses:delete") as any,
  (req: any, res: any, next: any) => warehouseController.deleteWarehouse(req, res, next)
);

export default router;
