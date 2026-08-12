import { Router } from "express";
import {
  userController,
  CreateUserSchema,
  UpdateUserSchema,
  UpdateUserStatusSchema,
  InviteUserSchema,
  AcceptInvitationSchema,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

// Public Invitation Endpoints (No JWT required)
router.get("/invite/verify/:token", (req: any, res: any, next: any) => userController.verifyInvitation(req, res, next));
router.post(
  "/invite/accept",
  validateRequest(AcceptInvitationSchema),
  (req: any, res: any, next: any) => userController.acceptInvitation(req, res, next)
);

// Apply authentication and tenant isolation to protected user routes
router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

router.get("/", requirePermission("users:read") as any, (req: any, res: any, next: any) => userController.getUsers(req, res, next));
router.post(
  "/invite",
  requirePermission("users:create") as any,
  validateRequest(InviteUserSchema),
  (req: any, res: any, next: any) => userController.inviteUser(req, res, next)
);
router.get("/:id", requirePermission("users:read") as any, (req: any, res: any, next: any) => userController.getUserById(req, res, next));
router.get("/:id/activity", requirePermission("users:read") as any, (req: any, res: any, next: any) => userController.getUserActivity(req, res, next));
router.post("/", requirePermission("users:create") as any, validateRequest(CreateUserSchema), (req: any, res: any, next: any) => userController.createUser(req, res, next));
router.put("/:id", requirePermission("users:update") as any, validateRequest(UpdateUserSchema), (req: any, res: any, next: any) => userController.updateUser(req, res, next));
router.patch("/:id/status", requirePermission("users:update") as any, validateRequest(UpdateUserStatusSchema), (req: any, res: any, next: any) => userController.updateUserStatus(req, res, next));
router.delete("/:id", requirePermission("users:delete") as any, (req: any, res: any, next: any) => userController.deleteUser(req, res, next));

export default router;
