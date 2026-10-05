import { Router } from "express";
import {
  salesController,
  CreateQuotationSchema,
  UpdateQuotationStatusSchema,
  ConvertQuotationSchema,
  CreateSalesOrderSchema,
  ApproveSalesOrderSchema,
  UpdateSalesOrderStatusSchema,
  CreateInvoiceSchema,
  RecordPaymentSchema,
} from "../controllers/sales.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

const canRead = requirePermission("sales:read") as any;
const canCreate = requirePermission("sales:create") as any;
const canUpdate = requirePermission("sales:update") as any;

// ==========================================
// REPORTS & HISTORY
// ==========================================
router.get("/reports", canRead, (req: any, res: any, next: any) => salesController.getReports(req, res, next));
router.get("/history", canRead, (req: any, res: any, next: any) => salesController.getSalesHistory(req, res, next));

// ==========================================
// QUOTATIONS
// ==========================================
router.get("/quotations", canRead, (req: any, res: any, next: any) => salesController.getQuotations(req, res, next));
router.post("/quotations", canCreate, validateRequest(CreateQuotationSchema), (req: any, res: any, next: any) =>
  salesController.createQuotation(req, res, next)
);
router.get("/quotations/:id", canRead, (req: any, res: any, next: any) => salesController.getQuotationById(req, res, next));
router.patch("/quotations/:id/status", canUpdate, validateRequest(UpdateQuotationStatusSchema), (req: any, res: any, next: any) =>
  salesController.updateQuotationStatus(req, res, next)
);
router.post("/quotations/:id/convert", canCreate, validateRequest(ConvertQuotationSchema), (req: any, res: any, next: any) =>
  salesController.convertQuotation(req, res, next)
);

// ==========================================
// SALES ORDERS
// ==========================================
router.get("/orders", canRead, (req: any, res: any, next: any) => salesController.getSalesOrders(req, res, next));
router.post("/orders", canCreate, validateRequest(CreateSalesOrderSchema), (req: any, res: any, next: any) =>
  salesController.createSalesOrder(req, res, next)
);
router.get("/orders/:id", canRead, (req: any, res: any, next: any) => salesController.getSalesOrderById(req, res, next));
router.patch("/orders/:id/approve", canUpdate, validateRequest(ApproveSalesOrderSchema), (req: any, res: any, next: any) =>
  salesController.approveSalesOrder(req, res, next)
);
router.patch("/orders/:id/status", canUpdate, validateRequest(UpdateSalesOrderStatusSchema), (req: any, res: any, next: any) =>
  salesController.updateSalesOrderStatus(req, res, next)
);

// ==========================================
// INVOICES & PAYMENTS
// ==========================================
router.get("/invoices", canRead, (req: any, res: any, next: any) => salesController.getInvoices(req, res, next));
router.post("/invoices", canCreate, validateRequest(CreateInvoiceSchema), (req: any, res: any, next: any) =>
  salesController.createInvoice(req, res, next)
);
router.get("/invoices/:id", canRead, (req: any, res: any, next: any) => salesController.getInvoiceById(req, res, next));
router.post("/invoices/:id/payments", canUpdate, validateRequest(RecordPaymentSchema), (req: any, res: any, next: any) =>
  salesController.recordPayment(req, res, next)
);
router.patch("/invoices/:id/cancel", canUpdate, (req: any, res: any, next: any) => salesController.cancelInvoice(req, res, next));

export default router;
