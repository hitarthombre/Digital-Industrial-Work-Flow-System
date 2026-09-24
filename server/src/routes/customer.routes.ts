import { Router } from "express";
import {
  customerController,
  CreateCustomerSchema,
  UpdateCustomerSchema,
} from "../controllers/customer.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

// Apply authentication and tenant isolation globally to all customer endpoints
router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

// Customer list (GET /api/customers)
router.get(
  "/",
  requirePermission("sales:read") as any,
  (req: any, res: any, next: any) => customerController.getCustomers(req, res, next)
);

// Create new customer (POST /api/customers)
router.post(
  "/",
  requirePermission("sales:create") as any,
  validateRequest(CreateCustomerSchema),
  (req: any, res: any, next: any) => customerController.createCustomer(req, res, next)
);

// Get customer order history (GET /api/customers/:id/orders)
router.get(
  "/:id/orders",
  requirePermission("sales:read") as any,
  (req: any, res: any, next: any) => customerController.getCustomerOrders(req, res, next)
);

// Upload document (POST /api/customers/:id/documents)
router.post(
  "/:id/documents",
  requirePermission("documents:create") as any,
  (req: any, res: any, next: any) => customerController.uploadDocument(req, res, next)
);

// Delete document (DELETE /api/customers/:id/documents/:docId)
router.delete(
  "/:id/documents/:docId",
  requirePermission("documents:delete") as any,
  (req: any, res: any, next: any) => customerController.deleteDocument(req, res, next)
);

// Customer details (GET /api/customers/:id)
router.get(
  "/:id",
  requirePermission("sales:read") as any,
  (req: any, res: any, next: any) => customerController.getCustomerById(req, res, next)
);

// Edit customer details (PUT /api/customers/:id)
router.put(
  "/:id",
  requirePermission("sales:update") as any,
  validateRequest(UpdateCustomerSchema),
  (req: any, res: any, next: any) => customerController.updateCustomer(req, res, next)
);

// Deactivate / delete customer (DELETE /api/customers/:id)
router.delete(
  "/:id",
  requirePermission("sales:update") as any,
  (req: any, res: any, next: any) => customerController.deleteCustomer(req, res, next)
);

export default router;
