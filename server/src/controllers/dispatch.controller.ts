import { Request, Response, NextFunction } from "express";
import z from "zod";
import { dispatchService } from "../services/dispatch.service";

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

const transportSchema = z.object({
  mode: z.enum(["road", "rail", "air", "sea", "courier"]).optional(),
  carrierName: z.string().optional(),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  trackingNumber: z.string().optional(),
  waybillNumber: z.string().optional(),
  freightCost: z.number().min(0).optional(),
});

export const CreateDispatchSchema = z
  .object({
    salesOrderId: z.string().optional(),
    customerId: z.string().optional(),
    warehouseId: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.string().optional(),
          sku: z.string().min(1, "SKU is required"),
          itemName: z.string().min(1, "Item name is required"),
          quantity: z.number().positive("Quantity must be greater than zero"),
          unit: z.string().optional(),
        })
      )
      .optional(),
    shippingAddress: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
      })
      .optional(),
    contactName: z.string().optional(),
    contactPhone: z.string().optional(),
    transport: transportSchema.optional(),
    plannedDispatchDate: z.string().optional(),
    estimatedDeliveryDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.salesOrderId || (data.warehouseId && data.items && data.items.length > 0), {
    message: "Provide a sales order, or a warehouse with at least one item",
  });

export const UpdateTransportSchema = transportSchema.extend({
  estimatedDeliveryDate: z.string().optional(),
  plannedDispatchDate: z.string().optional(),
});

export const UpdateDispatchStatusSchema = z.object({
  status: z.enum(["Pending", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered", "Returned", "Cancelled"]),
  location: z.string().optional(),
  note: z.string().optional(),
  receivedBy: z.string().optional(),
});

export const DispatchDocumentSchema = z.object({
  title: z.string().min(1, "Document title is required"),
  docType: z.enum(["invoice", "packing_list", "eway_bill", "lr_copy", "proof_of_delivery", "other"]).optional(),
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().url("A valid file URL is required"),
  fileType: z.string().optional(),
  fileSize: z.number().min(0).optional(),
});

// ==========================================
// CONTROLLER CLASS
// ==========================================

const ctx = (req: Request) => ({
  companyId: String((req as any).user?.companyId),
  userId: String((req as any).user?._id),
});

export class DispatchController {
  // GET /api/dispatch
  async getDispatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await dispatchService.getDispatches(ctx(req).companyId, req.query));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/dispatch
  async createDispatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const dispatch = await dispatchService.createDispatch(companyId, userId, req.body);
      res.status(201).json({ success: true, message: `Dispatch order ${dispatch.dispatchNumber} created`, data: dispatch });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dispatch/:id
  async getDispatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dispatch = await dispatchService.getDispatchById(ctx(req).companyId, req.params.id);
      res.status(200).json({ success: true, data: dispatch });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dispatch/:id/track
  async getTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await dispatchService.getTracking(ctx(req).companyId, req.params.id));
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/dispatch/:id/transport
  async updateTransport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const dispatch = await dispatchService.updateTransport(companyId, userId, req.params.id, req.body);
      res.status(200).json({ success: true, message: "Transport details saved", data: dispatch });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/dispatch/:id/status
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const dispatch = await dispatchService.updateStatus(companyId, userId, req.params.id, req.body);
      res.status(200).json({ success: true, message: `Shipment status updated to '${dispatch.status}'`, data: dispatch });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/dispatch/:id/documents
  async addDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const dispatch = await dispatchService.addDocument(companyId, userId, req.params.id, req.body);
      res.status(201).json({ success: true, message: "Dispatch document attached", data: dispatch });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/dispatch/:id/documents/:documentId
  async removeDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, userId } = ctx(req);
      const dispatch = await dispatchService.removeDocument(companyId, userId, req.params.id, req.params.documentId);
      res.status(200).json({ success: true, message: "Dispatch document removed", data: dispatch });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dispatch/reports
  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await dispatchService.getReports(ctx(req).companyId, req.query as any));
    } catch (error) {
      next(error);
    }
  }
}

export const dispatchController = new DispatchController();
export default dispatchController;
