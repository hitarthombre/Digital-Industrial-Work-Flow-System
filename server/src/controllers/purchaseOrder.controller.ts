import { Request, Response, NextFunction } from "express";
import { procurementService } from "../services/procurement.service";
import { CreatePOSchema, UpdatePOStatusSchema } from "./procurement.controller";

export class PurchaseOrderController {
  async createPurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      const po = await procurementService.createPurchaseOrder(companyId, userId, req.body);

      res.status(201).json({
        success: true,
        message: "Purchase order created successfully",
        data: po,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const result = await procurementService.getPurchaseOrders(companyId, req.query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;
      const po = await procurementService.getPurchaseOrderById(companyId, id);

      res.status(200).json({
        success: true,
        data: po,
      });
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  async updatePurchaseOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;
      const { id } = req.params;

      const po = await procurementService.updatePurchaseOrderStatus(companyId, userId, id, req.body);

      res.status(200).json({
        success: true,
        message: `Purchase order status updated to '${po.status}'`,
        data: po,
      });
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  async trackPurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const result = await procurementService.trackPurchaseOrder(companyId, id);

      res.status(200).json(result);
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }
}

export const purchaseOrderController = new PurchaseOrderController();
export { CreatePOSchema, UpdatePOStatusSchema };
export default purchaseOrderController;
