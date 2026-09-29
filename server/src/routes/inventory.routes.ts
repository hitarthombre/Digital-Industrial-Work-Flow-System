import { Router } from "express";
import {
  inventoryController,
  StockInSchema,
  StockOutSchema,
  StockTransferSchema,
  StockAdjustmentSchema,
  CreateMovementSchema,
} from "../controllers/inventory.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

// Apply authentication and multi-tenant workspace isolation globally to all inventory endpoints
router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

// POST /api/inventory/stock-in - Record stock receiving / stock in
router.post(
  "/stock-in",
  requirePermission("warehouses:update") as any,
  validateRequest(StockInSchema),
  (req: any, res: any, next: any) => inventoryController.stockIn(req, res, next)
);

// POST /api/inventory/stock-out - Record stock issuing / stock out
router.post(
  "/stock-out",
  requirePermission("warehouses:update") as any,
  validateRequest(StockOutSchema),
  (req: any, res: any, next: any) => inventoryController.stockOut(req, res, next)
);

// POST /api/inventory/transfer - Transfer stock between warehouses / factories
router.post(
  "/transfer",
  requirePermission("warehouses:update") as any,
  validateRequest(StockTransferSchema),
  (req: any, res: any, next: any) => inventoryController.transfer(req, res, next)
);

// POST /api/inventory/adjust - Record stock adjustment / inventory count correction
router.post(
  "/adjust",
  requirePermission("warehouses:update") as any,
  validateRequest(StockAdjustmentSchema),
  (req: any, res: any, next: any) => inventoryController.adjust(req, res, next)
);

// GET /api/inventory/history - Stock movement history & audit logs
router.get(
  "/history",
  requirePermission("warehouses:read") as any,
  (req: any, res: any, next: any) => inventoryController.getHistory(req, res, next)
);

// GET /api/inventory/raw-materials - Raw material stock levels
router.get(
  "/raw-materials",
  requirePermission("warehouses:read") as any,
  (req: any, res: any, next: any) => inventoryController.getRawMaterials(req, res, next)
);

// GET /api/inventory/finished-goods - Finished goods stock levels
router.get(
  "/finished-goods",
  requirePermission("warehouses:read") as any,
  (req: any, res: any, next: any) => inventoryController.getFinishedGoods(req, res, next)
);

// GET /api/inventory/alerts/low-stock - Low stock alert check service & notification list
router.get(
  "/alerts/low-stock",
  requirePermission("warehouses:read") as any,
  (req: any, res: any, next: any) => inventoryController.getLowStockAlerts(req, res, next)
);

// GET /api/inventory/reports - Consolidated inventory metrics & valuation report
router.get(
  "/reports",
  requirePermission("warehouses:read") as any,
  (req: any, res: any, next: any) => inventoryController.getReports(req, res, next)
);

// --- Legacy / Backward Compatibility Routes ---

// GET /api/inventory/movements
router.get(
  "/movements",
  requirePermission("warehouses:read") as any,
  (req: any, res: any, next: any) => inventoryController.getMovements(req, res, next)
);

// POST /api/inventory/movements
router.post(
  "/movements",
  requirePermission("warehouses:update") as any,
  validateRequest(CreateMovementSchema),
  (req: any, res: any, next: any) => inventoryController.recordMovement(req, res, next)
);

// GET /api/inventory/stock-levels
router.get(
  "/stock-levels",
  requirePermission("warehouses:read") as any,
  (req: any, res: any, next: any) => inventoryController.getStockLevels(req, res, next)
);

export default router;
