import { Request, Response, NextFunction } from "express";
import { salesService } from "../services/sales.service";
import {
  CreateSalesOrderSchema,
  ApproveSalesOrderSchema,
  UpdateSalesOrderStatusSchema,
} from "./sales.controller";

const ctx = (req: Request) => ({
  companyId: String((req as any).user?.companyId),
  userId: String((req as any).user?._id),
});

export class SalesOrderController {
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
      const order = await salesService.updateSalesOrderStatus(
        companyId,
        userId,
        req.params.id,
        req.body.status,
        req.body.comment
      );
      res.status(200).json({ success: true, message: `Sales order moved to '${order.status}'`, data: order });
    } catch (error) {
      next(error);
    }
  }
}

export const salesOrderController = new SalesOrderController();
export { CreateSalesOrderSchema, ApproveSalesOrderSchema, UpdateSalesOrderStatusSchema };
export default salesOrderController;
