import { Router } from "express";
import {
  factoryController,
  CreateFactorySchema,
} from "../controllers/factory.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

// Apply authentication and tenant isolation globally to all factory endpoints
router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

// Create new factory endpoint (POST /api/factories)
router.post(
  "/",
  requirePermission("factories:create") as any,
  validateRequest(CreateFactorySchema),
  (req: any, res: any, next: any) => factoryController.createFactory(req, res, next)
);

export default router;
