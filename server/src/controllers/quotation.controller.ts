import { Request, Response, NextFunction } from "express";
import { salesService } from "../services/sales.service";
import {
  CreateQuotationSchema,
  UpdateQuotationStatusSchema,
  ConvertQuotationSchema,
} from "./sales.controller";

const ctx = (req: Request) => ({
  companyId: String((req as any).user?.companyId),
  userId: String((req as any).user?._id),
});

export class QuotationController {
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
}

export const quotationController = new QuotationController();
export { CreateQuotationSchema, UpdateQuotationStatusSchema, ConvertQuotationSchema };
export default quotationController;
