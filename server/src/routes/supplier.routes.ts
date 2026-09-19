import { Router } from "express";
import {
  supplierController,
  CreateSupplierSchema,
  UpdateSupplierSchema,
} from "../controllers/supplier.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

// Apply authentication and tenant isolation globally to all supplier endpoints
router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

// Supplier list (GET /api/suppliers)
router.get(
  "/",
  requirePermission("procurement:read") as any,
  (req: any, res: any, next: any) => supplierController.getSuppliers(req, res, next)
);

// Create new supplier (POST /api/suppliers)
router.post(
  "/",
  requirePermission("procurement:create") as any,
  validateRequest(CreateSupplierSchema),
  (req: any, res: any, next: any) => supplierController.createSupplier(req, res, next)
);

// Get purchase history timeline (GET /api/suppliers/:id/purchase-history)
// Note: Placed before /:id parameter match
router.get(
  "/:id/purchase-history",
  requirePermission("procurement:read") as any,
  (req: any, res: any, next: any) => supplierController.getPurchaseHistory(req, res, next)
);

// Upload document (POST /api/suppliers/:id/documents)
router.post(
  "/:id/documents",
  requirePermission("documents:create") as any,
  (req: any, res: any, next: any) => supplierController.uploadDocument(req, res, next)
);

// Delete document (DELETE /api/suppliers/:id/documents/:docId)
router.delete(
  "/:id/documents/:docId",
  requirePermission("documents:delete") as any,
  (req: any, res: any, next: any) => supplierController.deleteDocument(req, res, next)
);

// Supplier details (GET /api/suppliers/:id)
router.get(
  "/:id",
  requirePermission("procurement:read") as any,
  (req: any, res: any, next: any) => supplierController.getSupplierById(req, res, next)
);

// Edit supplier details (PUT /api/suppliers/:id)
router.put(
  "/:id",
  requirePermission("procurement:update") as any,
  validateRequest(UpdateSupplierSchema),
  (req: any, res: any, next: any) => supplierController.updateSupplier(req, res, next)
);

// Deactivate / delete supplier (DELETE /api/suppliers/:id)
router.delete(
  "/:id",
  requirePermission("procurement:update") as any,
  (req: any, res: any, next: any) => supplierController.deleteSupplier(req, res, next)
);

export default router;
