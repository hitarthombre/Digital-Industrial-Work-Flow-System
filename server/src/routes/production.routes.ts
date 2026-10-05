import { Router } from "express";
import {
  productionController,
  CreatePlanSchema,
  UpdatePlanStatusSchema,
  CreateWorkOrderSchema,
  UpdateWorkOrderStatusSchema,
  UpdateStageSchema,
  CreateJobCardSchema,
  UpdateJobCardSchema,
  ConsumeMaterialSchema,
  RecordOutputSchema,
  RecordScrapSchema,
} from "../controllers/production.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

const canRead = requirePermission("production:read") as any;
const canCreate = requirePermission("production:create") as any;
const canUpdate = requirePermission("production:update") as any;

// ==========================================
// REPORTS
// ==========================================
router.get("/reports", canRead, (req: any, res: any, next: any) => productionController.getReports(req, res, next));

// ==========================================
// PRODUCTION PLANNING
// ==========================================
router.get("/plans", canRead, (req: any, res: any, next: any) => productionController.getPlans(req, res, next));
router.post("/plans", canCreate, validateRequest(CreatePlanSchema), (req: any, res: any, next: any) =>
  productionController.createPlan(req, res, next)
);
router.get("/plans/:id", canRead, (req: any, res: any, next: any) => productionController.getPlanById(req, res, next));
router.patch("/plans/:id/status", canUpdate, validateRequest(UpdatePlanStatusSchema), (req: any, res: any, next: any) =>
  productionController.updatePlanStatus(req, res, next)
);

// ==========================================
// WORK ORDERS
// ==========================================
router.get("/work-orders", canRead, (req: any, res: any, next: any) => productionController.getWorkOrders(req, res, next));
router.post("/work-orders", canCreate, validateRequest(CreateWorkOrderSchema), (req: any, res: any, next: any) =>
  productionController.createWorkOrder(req, res, next)
);
router.get("/work-orders/:id", canRead, (req: any, res: any, next: any) => productionController.getWorkOrderById(req, res, next));
router.patch("/work-orders/:id/status", canUpdate, validateRequest(UpdateWorkOrderStatusSchema), (req: any, res: any, next: any) =>
  productionController.updateWorkOrderStatus(req, res, next)
);

// Stage tracking
router.patch("/work-orders/:id/stages/:stageId", canUpdate, validateRequest(UpdateStageSchema), (req: any, res: any, next: any) =>
  productionController.updateStage(req, res, next)
);

// Job cards
router.post("/work-orders/:id/job-cards", canUpdate, validateRequest(CreateJobCardSchema), (req: any, res: any, next: any) =>
  productionController.addJobCard(req, res, next)
);
router.patch(
  "/work-orders/:id/job-cards/:jobCardId",
  canUpdate,
  validateRequest(UpdateJobCardSchema),
  (req: any, res: any, next: any) => productionController.updateJobCard(req, res, next)
);

// Material consumption, completion output and scrap
router.post("/work-orders/:id/consume", canUpdate, validateRequest(ConsumeMaterialSchema), (req: any, res: any, next: any) =>
  productionController.consumeMaterials(req, res, next)
);
router.post("/work-orders/:id/output", canUpdate, validateRequest(RecordOutputSchema), (req: any, res: any, next: any) =>
  productionController.recordOutput(req, res, next)
);
router.post("/work-orders/:id/scrap", canUpdate, validateRequest(RecordScrapSchema), (req: any, res: any, next: any) =>
  productionController.recordScrap(req, res, next)
);

export default router;
