import { Router } from "express";
import {
  factoryController,
  CreateFactorySchema,
  UpdateFactorySchema,
  UpdateFactoryStatusSchema,
  AssignFactoryManagerSchema,
} from "../controllers/factory.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

// Apply authentication and tenant isolation globally to all factory endpoints
router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

// Factory list & search query endpoint (GET /api/factories)
router.get(
  "/",
  requirePermission("factories:read") as any,
  (req: any, res: any, next: any) => factoryController.getFactories(req, res, next)
);

// Create new factory endpoint (POST /api/factories)
router.post(
  "/",
  requirePermission("factories:create") as any,
  validateRequest(CreateFactorySchema),
  (req: any, res: any, next: any) => factoryController.createFactory(req, res, next)
);

// Factory details retrieval endpoint (GET /api/factories/:id)
router.get(
  "/:id",
  requirePermission("factories:read") as any,
  (req: any, res: any, next: any) => factoryController.getFactoryById(req, res, next)
);

// Edit factory details endpoint (PUT /api/factories/:id)
router.put(
  "/:id",
  requirePermission("factories:update") as any,
  validateRequest(UpdateFactorySchema),
  (req: any, res: any, next: any) => factoryController.updateFactory(req, res, next)
);

// Factory status management endpoint (PATCH /api/factories/:id/status)
router.patch(
  "/:id/status",
  requirePermission("factories:update") as any,
  validateRequest(UpdateFactoryStatusSchema),
  (req: any, res: any, next: any) => factoryController.updateFactoryStatus(req, res, next)
);

// Factory manager assignment endpoint (PATCH /api/factories/:id/manager)
router.patch(
  "/:id/manager",
  requirePermission("factories:update") as any,
  validateRequest(AssignFactoryManagerSchema),
  (req: any, res: any, next: any) => factoryController.assignFactoryManager(req, res, next)
);

// Factory deletion / deactivation endpoint (DELETE /api/factories/:id)
router.delete(
  "/:id",
  requirePermission("factories:delete") as any,
  (req: any, res: any, next: any) => factoryController.deleteFactory(req, res, next)
);

export default router;
