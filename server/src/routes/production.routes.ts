import { Router } from "express";
import {
  productionController,
  CreateWorkOrderSchema,
  UpdateStageSchema,
  ConsumeMaterialSchema,
  RecordScrapSchema,
  CompleteWorkOrderSchema,
} from "../controllers/production.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

// Apply global auth & tenant isolation to all production routes
router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

// GET /api/production/work-orders - List work orders
router.get(
  "/work-orders",
  requirePermission("production:read") as any,
  (req, res, next) => productionController.getWorkOrders(req, res, next)
);

// GET /api/production/stats - Production dashboard metrics & yield charts data
router.get(
  "/stats",
  requirePermission("production:read") as any,
  (req, res, next) => productionController.getStats(req, res, next)
);

// GET /api/production/work-orders/:id - Work order details
router.get(
  "/work-orders/:id",
  requirePermission("production:read") as any,
  (req, res, next) => productionController.getWorkOrderById(req, res, next)
);

// POST /api/production/work-orders - Create new work order
router.post(
  "/work-orders",
  requirePermission("production:create") as any,
  validateRequest(CreateWorkOrderSchema),
  (req, res, next) => productionController.createWorkOrder(req, res, next)
);

// PATCH /api/production/work-orders/:id/stage - Update stage or status
router.patch(
  "/work-orders/:id/stage",
  requirePermission("production:update") as any,
  validateRequest(UpdateStageSchema),
  (req, res, next) => productionController.updateStage(req, res, next)
);

// POST /api/production/work-orders/:id/consume-material - Log material consumption
router.post(
  "/work-orders/:id/consume-material",
  requirePermission("production:update") as any,
  validateRequest(ConsumeMaterialSchema),
  (req, res, next) => productionController.consumeMaterial(req, res, next)
);

// POST /api/production/work-orders/:id/record-scrap - Record scrap/defect
router.post(
  "/work-orders/:id/record-scrap",
  requirePermission("production:update") as any,
  validateRequest(RecordScrapSchema),
  (req, res, next) => productionController.recordScrap(req, res, next)
);

// POST /api/production/work-orders/:id/complete - Handover finished goods
router.post(
  "/work-orders/:id/complete",
  requirePermission("production:update") as any,
  validateRequest(CompleteWorkOrderSchema),
  (req, res, next) => productionController.completeWorkOrder(req, res, next)
);

export default router;
