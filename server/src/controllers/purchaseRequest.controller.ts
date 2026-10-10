import { Request, Response, NextFunction } from "express";
import { procurementService } from "../services/procurement.service";
import { CreatePRSchema, ApprovePRSchema } from "./procurement.controller";

export class PurchaseRequestController {
  async createPurchaseRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      const pr = await procurementService.createPurchaseRequest(companyId, userId, req.body);

      res.status(201).json({
        success: true,
        message: "Purchase request created successfully",
        data: pr,
      });
    } catch (error) {
      next(error);
    }
  }

  async approvePurchaseRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;
      const { id } = req.params;

      const pr = await procurementService.approvePurchaseRequest(companyId, userId, id, req.body);

      res.status(200).json({
        success: true,
        message: `Purchase request ${pr.status.toLowerCase()} successfully`,
        data: pr,
      });
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  async getPurchaseRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const result = await procurementService.getPurchaseRequests(companyId, req.query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseRequestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;
      const pr = await procurementService.getPurchaseRequestById(companyId, id);

      res.status(200).json({
        success: true,
        data: pr,
      });
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }
}

export const purchaseRequestController = new PurchaseRequestController();
export { CreatePRSchema, ApprovePRSchema };
export default purchaseRequestController;
