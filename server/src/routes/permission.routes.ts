import { Router } from "express";
import { roleController } from "../controllers/role.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";

const router = Router();

router.use(authenticate as any);

router.get("/", requirePermission("roles:read") as any, (req: any, res: any, next: any) => roleController.getPermissions(req, res, next));

export default router;
