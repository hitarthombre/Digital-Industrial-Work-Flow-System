import { Request, Response, NextFunction } from "express";
import { procurementService } from "../services/procurement.service";
import z from "zod";

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

export const CreatePRSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse ID is required"),
  factoryId: z.string().optional(),
  department: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  requiredByDate: z.string().optional(),
  justification: z.string().optional(),
  status: z.enum(["Draft", "Submitted"]).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        inventoryId: z.string().optional(),
        itemName: z.string().min(1, "Item name is required"),
        sku: z.string().optional(),
        itemCategory: z
          .enum(["raw_material", "finished_goods", "packaging", "components", "other"])
          .optional(),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unit: z.string().optional(),
        estimatedUnitPrice: z.number().min(0).optional(),
        notes: z.string().optional(),
      })
    )
    .min(1, "At least one item is required"),
});

export const ApprovePRSchema = z.object({
  status: z.enum(["Approved", "Rejected"]),
  approvalNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export const CreatePOSchema = z.object({
  purchaseRequestId: z.string().optional(),
  supplierId: z.string().min(1, "Supplier ID is required"),
  warehouseId: z.string().min(1, "Warehouse ID is required"),
  factoryId: z.string().optional(),
  paymentTerms: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  shippingCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        inventoryId: z.string().optional(),
        itemName: z.string().min(1, "Item name is required"),
        sku: z.string().min(1, "SKU is required"),
        itemCategory: z
          .enum(["raw_material", "finished_goods", "packaging", "components", "other"])
          .optional(),
        quantityOrdered: z.number().min(1, "Quantity ordered must be at least 1"),
        unit: z.string().optional(),
        unitPrice: z.number().min(0, "Unit price cannot be negative"),
        taxRate: z.number().min(0).optional(),
        remarks: z.string().optional(),
      })
    )
    .min(1, "At least one order item is required"),
});

export const UpdatePOStatusSchema = z.object({
  status: z.enum([
    "Draft",
    "Submitted",
    "Approved",
    "PO Created",
    "Issued",
    "In Transit",
    "Partial Delivery",
    "Goods Received",
    "Closed",
    "Cancelled",
  ]),
  comment: z.string().optional(),
});

export const CreateGRNSchema = z.object({
  purchaseOrderId: z.string().min(1, "Purchase Order ID is required"),
  deliveryChallanNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        poItemId: z.string().optional(),
        productId: z.string().optional(),
        inventoryId: z.string().optional(),
        itemName: z.string().min(1, "Item name is required"),
        sku: z.string().min(1, "SKU is required"),
        itemCategory: z
          .enum(["raw_material", "finished_goods", "packaging", "components", "other"])
          .optional(),
        quantityOrdered: z.number().min(0).optional().default(0),
        quantityReceived: z.number().min(0, "Quantity received cannot be negative"),
        quantityAccepted: z.number().min(0, "Quantity accepted cannot be negative"),
        quantityRejected: z.number().min(0).optional().default(0),
        unit: z.string().optional(),
        unitCost: z.number().min(0).optional().default(0),
        remarks: z.string().optional(),
        rejectionReason: z.string().optional(),
      })
    )
    .min(1, "At least one GRN item is required"),
});

export const CreatePurchaseReturnSchema = z.object({
  purchaseOrderId: z.string().min(1, "Purchase Order ID is required"),
  grnId: z.string().optional(),
  supplierId: z.string().min(1, "Supplier ID is required"),
  warehouseId: z.string().min(1, "Warehouse ID is required"),
  reason: z.enum([
    "defective",
    "damaged_in_transit",
    "incorrect_specification",
    "excess_quantity",
    "expired",
    "other",
  ]),
  reasonDetails: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        inventoryId: z.string().optional(),
        itemName: z.string().min(1, "Item name is required"),
        sku: z.string().min(1, "SKU is required"),
        itemCategory: z
          .enum(["raw_material", "finished_goods", "packaging", "components", "other"])
          .optional(),
        quantityReturned: z.number().min(1, "Quantity returned must be at least 1"),
        unit: z.string().optional(),
        unitCost: z.number().min(0).optional().default(0),
        condition: z.string().optional(),
      })
    )
    .min(1, "At least one return item is required"),
});

// ==========================================
// CONTROLLER CLASS
// ==========================================

export class ProcurementController {
  // ------------------------------------------
  // Purchase Requests
  // ------------------------------------------

  // POST /api/procurement/requests
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

  // PUT /api/procurement/requests/:id/approve
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

  // GET /api/procurement/requests
  async getPurchaseRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const result = await procurementService.getPurchaseRequests(companyId, req.query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/procurement/requests/:id
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

  // ------------------------------------------
  // Purchase Orders
  // ------------------------------------------

  // POST /api/procurement/orders
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

  // GET /api/procurement/orders
  async getPurchaseOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const result = await procurementService.getPurchaseOrders(companyId, req.query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/procurement/orders/:id
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

  // PUT /api/procurement/orders/:id/status
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

  // GET /api/procurement/orders/:id/track
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

  // ------------------------------------------
  // Goods Receipt Note (GRN)
  // ------------------------------------------

  // POST /api/procurement/grn
  async createGRN(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      const grn = await procurementService.createGRN(companyId, userId, req.body);

      res.status(201).json({
        success: true,
        message: "Goods receipt note processed and inventory stock updated successfully",
        data: grn,
      });
    } catch (error) {
      next(error);
    }
  }

  // ------------------------------------------
  // Purchase Returns
  // ------------------------------------------

  // POST /api/procurement/returns
  async createPurchaseReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      const purchaseReturn = await procurementService.createPurchaseReturn(companyId, userId, req.body);

      res.status(201).json({
        success: true,
        message: "Purchase return created and stock deducted successfully",
        data: purchaseReturn,
      });
    } catch (error) {
      next(error);
    }
  }

  // ------------------------------------------
  // Supplier Purchase History
  // ------------------------------------------

  // GET /api/procurement/suppliers/:id/history
  async getSupplierPurchaseHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const result = await procurementService.getSupplierPurchaseHistory(companyId, id);

      res.status(200).json(result);
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // ------------------------------------------
  // Procurement Analytics & Summary Reports
  // ------------------------------------------

  // GET /api/procurement/reports
  async getProcurementReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;

      const result = await procurementService.getProcurementReports(companyId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const procurementController = new ProcurementController();
export default procurementController;
