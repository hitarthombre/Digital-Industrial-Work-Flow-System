import { Request, Response, NextFunction } from "express";
import { salesService } from "../services/sales.service";
import {
  CreateInvoiceSchema,
  RecordPaymentSchema,
} from "./sales.controller";

const ctx = (req: Request) => ({
  companyId: String((req as any).user?.companyId),
  userId: String((req as any).user?._id),
});

export class SalesInvoiceController {
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
}

export const salesInvoiceController = new SalesInvoiceController();
export { CreateInvoiceSchema, RecordPaymentSchema };
export default salesInvoiceController;
