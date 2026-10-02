import { Router } from "express";
import {
  procurementController,
  CreatePRSchema,
  ApprovePRSchema,
  CreatePOSchema,
  UpdatePOStatusSchema,
  CreateGRNSchema,
  CreatePurchaseReturnSchema,
} from "../controllers/procurement.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

// Apply authentication and tenant isolation globally to all procurement endpoints
router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

// ==========================================
// REPORTS & ANALYTICS
// ==========================================
router.get(
  "/reports",
  requirePermission("procurement:read") as any,
  (req: any, res: any, next: any) => procurementController.getProcurementReports(req, res, next)
);

// ==========================================
// PURCHASE REQUESTS
// ==========================================
router.get(
  "/requests",
  requirePermission("procurement:read") as any,
  (req: any, res: any, next: any) => procurementController.getPurchaseRequests(req, res, next)
);

router.post(
  "/requests",
  requirePermission("procurement:create") as any,
  validateRequest(CreatePRSchema),
  (req: any, res: any, next: any) => procurementController.createPurchaseRequest(req, res, next)
);

router.get(
  "/requests/:id",
  requirePermission("procurement:read") as any,
  (req: any, res: any, next: any) => procurementController.getPurchaseRequestById(req, res, next)
);

router.put(
  "/requests/:id/approve",
  requirePermission("procurement:update") as any,
  validateRequest(ApprovePRSchema),
  (req: any, res: any, next: any) => procurementController.approvePurchaseRequest(req, res, next)
);

// ==========================================
// PURCHASE ORDERS
// ==========================================
router.get(
  "/orders",
  requirePermission("procurement:read") as any,
  (req: any, res: any, next: any) => procurementController.getPurchaseOrders(req, res, next)
);

router.post(
  "/orders",
  requirePermission("procurement:create") as any,
  validateRequest(CreatePOSchema),
  (req: any, res: any, next: any) => procurementController.createPurchaseOrder(req, res, next)
);

// PO Tracking endpoint (must be before /orders/:id)
router.get(
  "/orders/:id/track",
  requirePermission("procurement:read") as any,
  (req: any, res: any, next: any) => procurementController.trackPurchaseOrder(req, res, next)
);

router.get(
  "/orders/:id",
  requirePermission("procurement:read") as any,
  (req: any, res: any, next: any) => procurementController.getPurchaseOrderById(req, res, next)
);

router.put(
  "/orders/:id/status",
  requirePermission("procurement:update") as any,
  validateRequest(UpdatePOStatusSchema),
  (req: any, res: any, next: any) => procurementController.updatePurchaseOrderStatus(req, res, next)
);

// ==========================================
// GOODS RECEIPT NOTE (GRN)
// ==========================================
router.post(
  "/grn",
  requirePermission("procurement:create") as any,
  validateRequest(CreateGRNSchema),
  (req: any, res: any, next: any) => procurementController.createGRN(req, res, next)
);

// ==========================================
// PURCHASE RETURNS
// ==========================================
router.post(
  "/returns",
  requirePermission("procurement:create") as any,
  validateRequest(CreatePurchaseReturnSchema),
  (req: any, res: any, next: any) => procurementController.createPurchaseReturn(req, res, next)
);

// ==========================================
// SUPPLIER PURCHASE HISTORY
// ==========================================
router.get(
  "/suppliers/:id/history",
  requirePermission("procurement:read") as any,
  (req: any, res: any, next: any) => procurementController.getSupplierPurchaseHistory(req, res, next)
);

export default router;
