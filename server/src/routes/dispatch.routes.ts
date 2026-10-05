import { Router } from "express";
import {
  dispatchController,
  CreateDispatchSchema,
  UpdateTransportSchema,
  UpdateDispatchStatusSchema,
  DispatchDocumentSchema,
} from "../controllers/dispatch.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

const canRead = requirePermission("dispatch:read") as any;
const canCreate = requirePermission("dispatch:create") as any;
const canUpdate = requirePermission("dispatch:update") as any;

// Reports (must be registered before /:id)
router.get("/reports", canRead, (req: any, res: any, next: any) => dispatchController.getReports(req, res, next));

router.get("/", canRead, (req: any, res: any, next: any) => dispatchController.getDispatches(req, res, next));
router.post("/", canCreate, validateRequest(CreateDispatchSchema), (req: any, res: any, next: any) =>
  dispatchController.createDispatch(req, res, next)
);
router.get("/:id", canRead, (req: any, res: any, next: any) => dispatchController.getDispatchById(req, res, next));
router.get("/:id/track", canRead, (req: any, res: any, next: any) => dispatchController.getTracking(req, res, next));

router.put("/:id/transport", canUpdate, validateRequest(UpdateTransportSchema), (req: any, res: any, next: any) =>
  dispatchController.updateTransport(req, res, next)
);
router.patch("/:id/status", canUpdate, validateRequest(UpdateDispatchStatusSchema), (req: any, res: any, next: any) =>
  dispatchController.updateStatus(req, res, next)
);

router.post("/:id/documents", canUpdate, validateRequest(DispatchDocumentSchema), (req: any, res: any, next: any) =>
  dispatchController.addDocument(req, res, next)
);
router.delete("/:id/documents/:documentId", canUpdate, (req: any, res: any, next: any) =>
  dispatchController.removeDocument(req, res, next)
);

export default router;
