import { Request, Response, NextFunction } from "express";
import { dispatchService } from "../services/dispatch.service";
import {
  CreateDispatchSchema,
  UpdateTransportSchema,
  UpdateDispatchStatusSchema,
  DispatchDocumentSchema,
} from "./dispatch.controller";

const ctx = (req: Request) => ({
  companyId: String((req as any).user?.companyId),
  userId: String((req as any).user?._id),
});

export class DispatchOrderController {
  async getDispatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await dispatchService.getDispatches(ctx(req).companyId, req.query));
    } catch (error) {
      next(error);
    }
  }

  async createDispatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const dispatch = await dispatchService.createDispatch(companyId, userId, req.body);
      res.status(201).json({ success: true, message: "Dispatch order created successfully", data: dispatch });
    } catch (error) {
      next(error);
    }
  }

  async getDispatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dispatch = await dispatchService.getDispatchById(ctx(req).companyId, req.params.id);
      res.status(200).json({ success: true, data: dispatch });
    } catch (error) {
      next(error);
    }
  }

  async getTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await dispatchService.getTracking(ctx(req).companyId, req.params.id));
    } catch (error) {
      next(error);
    }
  }

  async updateTransport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const dispatch = await dispatchService.updateTransport(companyId, userId, req.params.id, req.body);
      res.status(200).json({ success: true, message: "Transport details updated", data: dispatch });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const dispatch = await dispatchService.updateStatus(companyId, userId, req.params.id, req.body);
      res.status(200).json({ success: true, message: `Shipment marked as '${dispatch.status}'`, data: dispatch });
    } catch (error) {
      next(error);
    }
  }

  async addDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const dispatch = await dispatchService.addDocument(companyId, userId, req.params.id, req.body);
      res.status(201).json({ success: true, message: "Document uploaded successfully", data: dispatch });
    } catch (error) {
      next(error);
    }
  }

  async removeDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const dispatch = await dispatchService.removeDocument(companyId, userId, req.params.id, req.params.documentId);
      res.status(200).json({ success: true, message: "Document removed successfully", data: dispatch });
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await dispatchService.getReports(ctx(req).companyId, req.query as any));
    } catch (error) {
      next(error);
    }
  }
}

export const dispatchOrderController = new DispatchOrderController();
export { CreateDispatchSchema, UpdateTransportSchema, UpdateDispatchStatusSchema, DispatchDocumentSchema };
export default dispatchOrderController;
