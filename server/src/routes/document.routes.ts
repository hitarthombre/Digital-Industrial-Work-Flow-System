import { Router } from "express";
import { documentController, CreateDocumentSchema, UpdateDocumentSchema } from "../controllers/document.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

const canRead = requirePermission("documents:read") as any;
const canCreate = requirePermission("documents:create") as any;
const canDelete = requirePermission("documents:delete") as any;

router.get("/stats", canRead, (req: any, res: any, next: any) => documentController.getStats(req, res, next));
router.get("/", canRead, (req: any, res: any, next: any) => documentController.getDocuments(req, res, next));
router.post("/", canCreate, validateRequest(CreateDocumentSchema), (req: any, res: any, next: any) =>
  documentController.createDocument(req, res, next)
);
router.get("/:id", canRead, (req: any, res: any, next: any) => documentController.getDocumentById(req, res, next));
router.put("/:id", canCreate, validateRequest(UpdateDocumentSchema), (req: any, res: any, next: any) =>
  documentController.updateDocument(req, res, next)
);
router.delete("/:id", canDelete, (req: any, res: any, next: any) => documentController.deleteDocument(req, res, next));

export default router;
