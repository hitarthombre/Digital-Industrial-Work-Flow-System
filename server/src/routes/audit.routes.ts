import { Router } from "express";
import { auditController } from "../controllers/audit.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";

const router = Router();

router.use(authenticate as any);

router.get("/logs", requirePermission("company:read") as any, (req: any, res, next) => auditController.getAuditLogs(req, res, next));
router.get("/activities", requirePermission("company:read") as any, (req: any, res, next) => auditController.getAuditLogs(req, res, next));
router.get("/activities/:id", requirePermission("company:read") as any, (req: any, res, next) => auditController.getLogById(req, res, next));

export default router;
