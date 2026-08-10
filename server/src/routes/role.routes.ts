import { Router } from "express";
import { roleController, CreateRoleSchema, UpdateRoleSchema } from "../controllers/role.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validateRequest } from "../middleware/validation";

const router = Router();

router.use(authenticate as any);

router.get("/", requirePermission("roles:read") as any, (req: any, res: any, next: any) => roleController.getRoles(req, res, next));
router.get("/:id", requirePermission("roles:read") as any, (req: any, res: any, next: any) => roleController.getRoleById(req, res, next));
router.post("/", requirePermission("roles:manage") as any, validateRequest(CreateRoleSchema), (req: any, res: any, next: any) => roleController.createRole(req, res, next));
router.put("/:id", requirePermission("roles:manage") as any, validateRequest(UpdateRoleSchema), (req: any, res: any, next: any) => roleController.updateRole(req, res, next));
router.delete("/:id", requirePermission("roles:manage") as any, (req: any, res: any, next: any) => roleController.deleteRole(req, res, next));

export default router;
