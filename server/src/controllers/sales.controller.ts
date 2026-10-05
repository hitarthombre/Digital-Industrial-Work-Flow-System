import { Request, Response, NextFunction } from "express";
import z from "zod";
import { salesService } from "../services/sales.service";

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

const lineItemSchema = z.object({
  productId: z.string().optional(),
  itemName: z.string().min(1, "Item name is required"),
  sku: z.string().min(1, "SKU is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unit: z.string().optional(),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  discountPercent: z.number().min(0).max(100).optional(),
  taxRate: z.number().min(0).optional(),
});

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

export const CreateQuotationSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  validUntil: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "At least one line item is required"),
  shippingCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  status: z.enum(["Draft", "Sent"]).optional(),
});

export const UpdateQuotationStatusSchema = z.object({
  status: z.enum(["Draft", "Sent", "Accepted", "Rejected", "Expired"]),
});

export const ConvertQuotationSchema = z.object({
  warehouseId: z.string().min(1, "Fulfilment warehouse is required"),
  expectedDeliveryDate: z.string().optional(),
  customerPoNumber: z.string().optional(),
});

export const CreateSalesOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  quotationId: z.string().optional(),
  warehouseId: z.string().min(1, "Fulfilment warehouse is required"),
  expectedDeliveryDate: z.string().optional(),
  customerPoNumber: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "At least one line item is required"),
  shippingCost: z.number().min(0).optional(),
  shippingAddress: addressSchema.optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export const ApproveSalesOrderSchema = z.object({
  status: z.enum(["Approved", "Rejected"]),
  approvalNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export const UpdateSalesOrderStatusSchema = z.object({
  status: z.enum(["Approved", "Processing", "Delivered", "Cancelled"]),
  comment: z.string().optional(),
});

export const CreateInvoiceSchema = z.object({
  salesOrderId: z.string().min(1, "Sales order is required"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export const RecordPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be greater than zero"),
  paymentDate: z.string().optional(),
  method: z.enum(["cash", "bank_transfer", "cheque", "card", "upi", "other"]).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// ==========================================
// CONTROLLER CLASS
// ==========================================

const ctx = (req: Request) => ({
  companyId: String((req as any).user?.companyId),
  userId: String((req as any).user?._id),
});

export class SalesController {
  // ------------------------------------------
  // Quotations
  // ------------------------------------------

  async getQuotations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await salesService.getQuotations(ctx(req).companyId, req.query));
    } catch (error) {
      next(error);
    }
  }

  async createQuotation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const quotation = await salesService.createQuotation(companyId, userId, req.body);
      res.status(201).json({ success: true, message: "Quotation created successfully", data: quotation });
    } catch (error) {
      next(error);
    }
  }

  async getQuotationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const quotation = await salesService.getQuotationById(ctx(req).companyId, req.params.id);
      res.status(200).json({ success: true, data: quotation });
    } catch (error) {
      next(error);
    }
  }

  async updateQuotationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const quotation = await salesService.updateQuotationStatus(companyId, userId, req.params.id, req.body.status);
      res.status(200).json({ success: true, message: `Quotation marked as '${quotation.status}'`, data: quotation });
    } catch (error) {
      next(error);
    }
  }

  async convertQuotation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const result = await salesService.convertQuotation(companyId, userId, req.params.id, req.body);
      res.status(201).json({
        success: true,
        message: `Quotation converted to sales order ${result.order.orderNumber}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ------------------------------------------
  // Sales Orders
  // ------------------------------------------

  async getSalesOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await salesService.getSalesOrders(ctx(req).companyId, req.query));
    } catch (error) {
      next(error);
    }
  }

  async createSalesOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const order = await salesService.createSalesOrder(companyId, userId, req.body);
      res.status(201).json({ success: true, message: "Sales order created and sent for approval", data: order });
    } catch (error) {
      next(error);
    }
  }

  async getSalesOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await salesService.getSalesOrderById(ctx(req).companyId, req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async approveSalesOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const order = await salesService.approveSalesOrder(companyId, userId, req.params.id, req.body);
      res.status(200).json({ success: true, message: `Sales order ${order.status.toLowerCase()}`, data: order });
    } catch (error) {
      next(error);
    }
  }

  async updateSalesOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const order = await salesService.updateSalesOrderStatus(companyId, userId, req.params.id, req.body.status, req.body.comment);
      res.status(200).json({ success: true, message: `Sales order moved to '${order.status}'`, data: order });
    } catch (error) {
      next(error);
    }
  }

  // ------------------------------------------
  // Invoices & Payments
  // ------------------------------------------

  async getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await salesService.getInvoices(ctx(req).companyId, req.query));
    } catch (error) {
      next(error);
    }
  }

  async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const invoice = await salesService.createInvoice(companyId, userId, req.body);
      res.status(201).json({ success: true, message: `Invoice ${invoice.invoiceNumber} created`, data: invoice });
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await salesService.getInvoiceById(ctx(req).companyId, req.params.id);
      res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }

  async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const invoice = await salesService.recordPayment(companyId, userId, req.params.id, req.body);
      res.status(201).json({ success: true, message: "Payment recorded", data: invoice });
    } catch (error) {
      next(error);
    }
  }

  async cancelInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const invoice = await salesService.cancelInvoice(companyId, userId, req.params.id);
      res.status(200).json({ success: true, message: "Invoice cancelled", data: invoice });
    } catch (error) {
      next(error);
    }
  }

  // ------------------------------------------
  // History & Reports
  // ------------------------------------------

  async getSalesHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await salesService.getSalesHistory(ctx(req).companyId, req.query as any));
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await salesService.getReports(ctx(req).companyId, req.query as any));
    } catch (error) {
      next(error);
    }
  }
}

export const salesController = new SalesController();
export default salesController;
