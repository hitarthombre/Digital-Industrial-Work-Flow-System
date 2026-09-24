import { Router } from "express";
import {
  inventoryController,
  CreateMovementSchema,
} from "../controllers/inventory.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

// Apply authentication and tenant isolation globally to all inventory endpoints
router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

// GET /api/inventory/movements - Stock movement logs & history
router.get(
  "/movements",
  requirePermission("warehouses:read") as any,
  (req: any, res: any, next: any) => inventoryController.getMovements(req, res, next)
);

// POST /api/inventory/movements - Record stock in, stock out, adjustment
router.post(
  "/movements",
  requirePermission("warehouses:update") as any,
  validateRequest(CreateMovementSchema),
  (req: any, res: any, next: any) => inventoryController.recordMovement(req, res, next)
);

// GET /api/inventory/stock-levels - Current raw material & finished goods stock levels
router.get(
  "/stock-levels",
  requirePermission("warehouses:read") as any,
  (req: any, res: any, next: any) => inventoryController.getStockLevels(req, res, next)
);

// GET /api/inventory/reports - Inventory report summary & exports
router.get(
  "/reports",
  requirePermission("warehouses:read") as any,
  (req: any, res: any, next: any) => inventoryController.getReports(req, res, next)
);

export default router;
