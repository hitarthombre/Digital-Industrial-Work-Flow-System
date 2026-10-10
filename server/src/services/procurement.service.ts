import { Types } from "mongoose";
import { PurchaseRequest, IPurchaseRequest, PRStatusType, PRPriorityType } from "../models/PurchaseRequest";
import { PurchaseOrder, IPurchaseOrder, POStatusType } from "../models/PurchaseOrder";
import { GoodsReceiptNote, IGoodsReceiptNote } from "../models/GoodsReceiptNote";
import { PurchaseReturn, IPurchaseReturn, PurchaseReturnReasonType } from "../models/PurchaseReturn";
import { Supplier } from "../models/Supplier";
import { Warehouse } from "../models/Warehouse";
import { inventoryService } from "./inventory.service";
import { auditService } from "./audit.service";
import { logger } from "../config/logger";

export interface CreatePRInput {
  warehouseId: string;
  factoryId?: string;
  department?: string;
  priority?: PRPriorityType;
  requiredByDate?: string;
  justification?: string;
  items: Array<{
    productId?: string;
    inventoryId?: string;
    itemName: string;
    sku?: string;
    itemCategory?: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
    quantity: number;
    unit?: string;
    estimatedUnitPrice?: number;
    notes?: string;
  }>;
  status?: "Draft" | "Submitted";
}

export interface ApprovePRInput {
  status: "Approved" | "Rejected";
  approvalNotes?: string;
  rejectionReason?: string;
}

export interface CreatePOInput {
  purchaseRequestId?: string;
  supplierId: string;
  warehouseId: string;
  factoryId?: string;
  paymentTerms?: string;
  expectedDeliveryDate?: string;
  shippingCost?: number;
  notes?: string;
  termsAndConditions?: string;
  items: Array<{
    productId?: string;
    inventoryId?: string;
    itemName: string;
    sku: string;
    itemCategory?: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
    quantityOrdered: number;
    unit?: string;
    unitPrice: number;
    taxRate?: number;
    remarks?: string;
  }>;
}

export interface UpdatePOStatusInput {
  status: POStatusType;
  comment?: string;
}

export interface CreateGRNInput {
  purchaseOrderId: string;
  deliveryChallanNumber?: string;
  invoiceNumber?: string;
  notes?: string;
  items: Array<{
    poItemId?: string;
    productId?: string;
    inventoryId?: string;
    itemName: string;
    sku: string;
    itemCategory?: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
    quantityOrdered: number;
    quantityReceived: number;
    quantityAccepted: number;
    quantityRejected?: number;
    unit?: string;
    unitCost?: number;
    remarks?: string;
    rejectionReason?: string;
  }>;
}

export interface CreatePurchaseReturnInput {
  purchaseOrderId: string;
  grnId?: string;
  supplierId: string;
  warehouseId: string;
  reason: PurchaseReturnReasonType;
  reasonDetails?: string;
  notes?: string;
  items: Array<{
    productId?: string;
    inventoryId?: string;
    itemName: string;
    sku: string;
    itemCategory?: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
    quantityReturned: number;
    unit?: string;
    unitCost?: number;
    condition?: string;
  }>;
}

export class ProcurementService {
  /**
   * Helper sequence generators for clean readable document IDs
   */
  private async generateDocNumber(
    companyId: string,
    prefix: string,
    model: any,
    field: string
  ): Promise<string> {
    const year = new Date().getFullYear();
    const count = await model.countDocuments({ companyId });
    const seq = String(count + 1).padStart(4, "0");
    return `${prefix}-${year}-${seq}`;
  }

  // ==========================================
  // PURCHASE REQUEST WORKFLOWS
  // ==========================================

  async createPurchaseRequest(companyId: string, userId: string, input: CreatePRInput) {
    const warehouse = await Warehouse.findOne({ _id: input.warehouseId, companyId, isDeleted: { $ne: true } });
    if (!warehouse) {
      throw new Error("Target warehouse not found");
    }

    if (!input.items || input.items.length === 0) {
      throw new Error("Purchase request must contain at least one line item");
    }

    const docNumber = await this.generateDocNumber(companyId, "PR", PurchaseRequest, "requestNumber");

    let totalEstimatedCost = 0;
    const processedItems = input.items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.estimatedUnitPrice) || 0;
      const totalPrice = Number((qty * unitPrice).toFixed(2));
      totalEstimatedCost += totalPrice;

      return {
        productId: item.productId ? new Types.ObjectId(item.productId) : undefined,
        inventoryId: item.inventoryId ? new Types.ObjectId(item.inventoryId) : undefined,
        itemName: item.itemName.trim(),
        sku: item.sku ? item.sku.trim().toUpperCase() : undefined,
        itemCategory: item.itemCategory || "raw_material",
        quantity: qty,
        unit: item.unit || "units",
        estimatedUnitPrice: unitPrice,
        estimatedTotalPrice: totalPrice,
        notes: item.notes,
      };
    });

    const status: PRStatusType = input.status === "Draft" ? "Draft" : "Submitted";

    const pr = await PurchaseRequest.create({
      companyId: new Types.ObjectId(companyId),
      requestNumber: docNumber,
      requesterId: new Types.ObjectId(userId),
      department: input.department,
      warehouseId: new Types.ObjectId(input.warehouseId),
      factoryId: input.factoryId ? new Types.ObjectId(input.factoryId) : undefined,
      priority: input.priority || "medium",
      status,
      items: processedItems,
      totalEstimatedCost: Number(totalEstimatedCost.toFixed(2)),
      requiredByDate: input.requiredByDate ? new Date(input.requiredByDate) : undefined,
      justification: input.justification,
    });

    await auditService.log({
      companyId,
      userId,
      action: "PURCHASE_REQUEST_CREATED",
      module: "procurement",
      referenceId: pr._id.toString(),
      after: { requestNumber: pr.requestNumber, status: pr.status, totalCost: pr.totalEstimatedCost },
    });

    return pr;
  }

  async approvePurchaseRequest(companyId: string, userId: string, prId: string, input: ApprovePRInput) {
    const pr = await PurchaseRequest.findOne({ _id: prId, companyId, isDeleted: { $ne: true } });
    if (!pr) {
      throw new Error("Purchase request not found");
    }

    if (pr.status !== "Submitted" && pr.status !== "Draft") {
      throw new Error(`Cannot review purchase request in '${pr.status}' status. Only 'Submitted' or 'Draft' PRs can be reviewed.`);
    }

    const previousStatus = pr.status;
    pr.status = input.status;
    pr.approvedBy = new Types.ObjectId(userId);
    pr.approvedAt = new Date();
    if (input.status === "Rejected") {
      pr.rejectionReason = input.rejectionReason || "Purchase request rejected by manager";
    }
    if (input.approvalNotes) {
      pr.approvalNotes = input.approvalNotes;
    }

    await pr.save();

    await auditService.log({
      companyId,
      userId,
      action: input.status === "Approved" ? "PURCHASE_REQUEST_APPROVED" : "PURCHASE_REQUEST_REJECTED",
      module: "procurement",
      referenceId: pr._id.toString(),
      before: { status: previousStatus },
      after: { status: pr.status, approvedBy: userId, approvedAt: pr.approvedAt },
    });

    return pr;
  }

  async getPurchaseRequests(companyId: string, queryParams: any) {
    const { search, status, priority, warehouseId, page = 1, limit = 10 } = queryParams;
    const filter: any = { companyId, isDeleted: { $ne: true } };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (warehouseId) filter.warehouseId = warehouseId;

    if (search) {
      filter.$or = [
        { requestNumber: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { justification: { $regex: search, $options: "i" } },
        { "items.itemName": { $regex: search, $options: "i" } },
        { "items.sku": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [requests, total] = await Promise.all([
      PurchaseRequest.find(filter)
        .populate("requesterId", "name email role")
        .populate("warehouseId", "name location code")
        .populate("factoryId", "name code")
        .populate("approvedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PurchaseRequest.countDocuments(filter),
    ]);

    return {
      success: true,
      data: requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getPurchaseRequestById(companyId: string, prId: string) {
    const pr = await PurchaseRequest.findOne({ _id: prId, companyId, isDeleted: { $ne: true } })
      .populate("requesterId", "name email role")
      .populate("warehouseId", "name location code")
      .populate("factoryId", "name code")
      .populate("approvedBy", "name email")
      .populate("purchaseOrderId", "poNumber status grandTotal");

    if (!pr) {
      throw new Error("Purchase request not found");
    }

    return pr;
  }

  // ==========================================
  // PURCHASE ORDER WORKFLOWS
  // ==========================================

  async createPurchaseOrder(companyId: string, userId: string, input: CreatePOInput) {
    const supplier = await Supplier.findOne({ _id: input.supplierId, companyId, isDeleted: { $ne: true } });
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    const warehouse = await Warehouse.findOne({ _id: input.warehouseId, companyId, isDeleted: { $ne: true } });
    if (!warehouse) {
      throw new Error("Warehouse location not found");
    }

    let purchaseRequest: IPurchaseRequest | null = null;
    if (input.purchaseRequestId) {
      purchaseRequest = await PurchaseRequest.findOne({
        _id: input.purchaseRequestId,
        companyId,
        isDeleted: { $ne: true },
      });
      if (!purchaseRequest) {
        throw new Error("Referenced purchase request not found");
      }
      if (purchaseRequest.status !== "Approved" && purchaseRequest.status !== "Submitted") {
        throw new Error(`Cannot create purchase order from PR in '${purchaseRequest.status}' status. PR must be 'Approved'.`);
      }
    }

    if (!input.items || input.items.length === 0) {
      throw new Error("Purchase order must contain at least one line item");
    }

    const poNumber = await this.generateDocNumber(companyId, "PO", PurchaseOrder, "poNumber");

    let subtotal = 0;
    let taxTotal = 0;

    const processedItems = input.items.map((item) => {
      const qty = Number(item.quantityOrdered) || 1;
      const price = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxRate) || 0;

      const itemSubtotal = Number((qty * price).toFixed(2));
      const itemTax = Number(((itemSubtotal * taxRate) / 100).toFixed(2));

      subtotal += itemSubtotal;
      taxTotal += itemTax;

      return {
        productId: item.productId ? new Types.ObjectId(item.productId) : undefined,
        inventoryId: item.inventoryId ? new Types.ObjectId(item.inventoryId) : undefined,
        itemName: item.itemName.trim(),
        sku: item.sku.trim().toUpperCase(),
        itemCategory: item.itemCategory || "raw_material",
        quantityOrdered: qty,
        quantityReceived: 0,
        unit: item.unit || "units",
        unitPrice: price,
        totalPrice: itemSubtotal,
        taxRate,
        taxAmount: itemTax,
        remarks: item.remarks,
      };
    });

    const shippingCost = Number(input.shippingCost) || 0;
    const grandTotal = Number((subtotal + taxTotal + shippingCost).toFixed(2));

    const po = await PurchaseOrder.create({
      companyId: new Types.ObjectId(companyId),
      poNumber,
      purchaseRequestId: purchaseRequest ? purchaseRequest._id : undefined,
      supplierId: new Types.ObjectId(input.supplierId),
      warehouseId: new Types.ObjectId(input.warehouseId),
      factoryId: input.factoryId ? new Types.ObjectId(input.factoryId) : undefined,
      issuerId: new Types.ObjectId(userId),
      status: "PO Created",
      paymentTerms: input.paymentTerms || supplier.paymentTerms || "Net 30",
      orderDate: new Date(),
      expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : undefined,
      items: processedItems,
      subtotal: Number(subtotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      shippingCost,
      grandTotal,
      notes: input.notes,
      termsAndConditions: input.termsAndConditions,
      statusTimeline: [
        {
          status: "PO Created",
          timestamp: new Date(),
          updatedBy: new Types.ObjectId(userId),
          comment: "Purchase Order created and issued to supplier",
        },
      ],
    });

    // Update PR state transition if linked
    if (purchaseRequest) {
      purchaseRequest.status = "PO Created";
      purchaseRequest.purchaseOrderId = po._id as Types.ObjectId;
      await purchaseRequest.save();
    }

    // Update supplier total orders count
    supplier.totalOrders = (supplier.totalOrders || 0) + 1;
    await supplier.save();

    await auditService.log({
      companyId,
      userId,
      action: "PURCHASE_ORDER_CREATED",
      module: "procurement",
      referenceId: po._id.toString(),
      after: { poNumber: po.poNumber, grandTotal: po.grandTotal, supplierId: input.supplierId },
    });

    return po;
  }

  async getPurchaseOrders(companyId: string, queryParams: any) {
    const { search, status, supplierId, warehouseId, page = 1, limit = 10 } = queryParams;
    const filter: any = { companyId, isDeleted: { $ne: true } };

    if (status) filter.status = status;
    if (supplierId) filter.supplierId = supplierId;
    if (warehouseId) filter.warehouseId = warehouseId;

    if (search) {
      filter.$or = [
        { poNumber: { $regex: search, $options: "i" } },
        { "items.itemName": { $regex: search, $options: "i" } },
        { "items.sku": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .populate("supplierId", "name code contactPerson email phone rating")
        .populate("warehouseId", "name location code")
        .populate("factoryId", "name code")
        .populate("issuerId", "name email")
        .populate("purchaseRequestId", "requestNumber priority")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PurchaseOrder.countDocuments(filter),
    ]);

    return {
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getPurchaseOrderById(companyId: string, poId: string) {
    const po = await PurchaseOrder.findOne({ _id: poId, companyId, isDeleted: { $ne: true } })
      .populate("supplierId", "name code contactPerson email phone address taxId paymentTerms rating complianceStatus")
      .populate("warehouseId", "name location code manager")
      .populate("factoryId", "name code")
      .populate("issuerId", "name email role")
      .populate("purchaseRequestId", "requestNumber priority justification requesterId")
      .populate({
        path: "statusTimeline.updatedBy",
        select: "name email",
      });

    if (!po) {
      throw new Error("Purchase order not found");
    }

    return po;
  }

  async updatePurchaseOrderStatus(companyId: string, userId: string, poId: string, input: UpdatePOStatusInput) {
    const po = await PurchaseOrder.findOne({ _id: poId, companyId, isDeleted: { $ne: true } });
    if (!po) {
      throw new Error("Purchase order not found");
    }

    const previousStatus = po.status;
    po.status = input.status;
    po.statusTimeline.push({
      status: input.status,
      timestamp: new Date(),
      updatedBy: new Types.ObjectId(userId),
      comment: input.comment || `Status updated from ${previousStatus} to ${input.status}`,
    });

    await po.save();

    await auditService.log({
      companyId,
      userId,
      action: "PURCHASE_ORDER_STATUS_CHANGED",
      module: "procurement",
      referenceId: po._id.toString(),
      before: { status: previousStatus },
      after: { status: po.status, comment: input.comment },
    });

    return po;
  }

  async trackPurchaseOrder(companyId: string, poId: string) {
    const po = await this.getPurchaseOrderById(companyId, poId);

    // Fetch related GRNs & Returns
    const [grns, returns] = await Promise.all([
      GoodsReceiptNote.find({ companyId, purchaseOrderId: po._id, isDeleted: { $ne: true } })
        .populate("receivedBy", "name email")
        .sort({ receivedDate: 1 }),
      PurchaseReturn.find({ companyId, purchaseOrderId: po._id, isDeleted: { $ne: true } })
        .populate("returnedBy", "name email")
        .sort({ returnDate: 1 }),
    ]);

    let totalOrderedQty = 0;
    let totalReceivedQty = 0;

    const itemsTracking = po.items.map((item) => {
      totalOrderedQty += item.quantityOrdered;
      totalReceivedQty += item.quantityReceived;

      const remainingQty = Math.max(0, item.quantityOrdered - item.quantityReceived);
      const isFulfilled = item.quantityReceived >= item.quantityOrdered;

      return {
        _id: item._id,
        sku: item.sku,
        itemName: item.itemName,
        quantityOrdered: item.quantityOrdered,
        quantityReceived: item.quantityReceived,
        quantityRemaining: remainingQty,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        isFulfilled,
      };
    });

    const completionPercentage = totalOrderedQty > 0
      ? Math.min(100, Math.round((totalReceivedQty / totalOrderedQty) * 100))
      : 0;

    // Build consolidated tracking event stream
    const combinedTimeline: Array<{ title: string; date: Date; type: string; details: string }> = [];

    // PO Status Events
    for (const st of po.statusTimeline) {
      combinedTimeline.push({
        title: `PO Status: ${st.status}`,
        date: st.timestamp,
        type: "status_change",
        details: st.comment || `Purchase Order state transitioned to ${st.status}`,
      });
    }

    // GRN Receipt Events
    for (const grn of grns) {
      const acceptedSum = grn.items.reduce((sum, i) => sum + i.quantityAccepted, 0);
      combinedTimeline.push({
        title: `GRN Received (${grn.grnNumber})`,
        date: grn.receivedDate,
        type: "goods_receipt",
        details: `Received & inspected ${acceptedSum} items. Accepted total cost: $${grn.totalAcceptedCost.toFixed(2)}`,
      });
    }

    // Return Events
    for (const ret of returns) {
      const returnedSum = ret.items.reduce((sum, i) => sum + i.quantityReturned, 0);
      combinedTimeline.push({
        title: `Purchase Return (${ret.returnNumber})`,
        date: ret.returnDate,
        type: "purchase_return",
        details: `Returned ${returnedSum} items due to '${ret.reason}'. Total refund value: $${ret.totalReturnAmount.toFixed(2)}`,
      });
    }

    // Sort timeline chronologically
    combinedTimeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      success: true,
      purchaseOrder: {
        _id: po._id,
        poNumber: po.poNumber,
        status: po.status,
        orderDate: po.orderDate,
        expectedDeliveryDate: po.expectedDeliveryDate,
        paymentTerms: po.paymentTerms,
        grandTotal: po.grandTotal,
        supplier: po.supplierId,
        warehouse: po.warehouseId,
        purchaseRequest: po.purchaseRequestId,
      },
      summary: {
        totalOrderedQty,
        totalReceivedQty,
        totalRemainingQty: Math.max(0, totalOrderedQty - totalReceivedQty),
        completionPercentage,
        grnCount: grns.length,
        returnCount: returns.length,
      },
      items: itemsTracking,
      grns,
      returns,
      timeline: combinedTimeline,
    };
  }

  // ==========================================
  // GOODS RECEIPT NOTE (GRN) WORKFLOWS
  // ==========================================

  async createGRN(companyId: string, userId: string, input: CreateGRNInput) {
    const po = await PurchaseOrder.findOne({ _id: input.purchaseOrderId, companyId, isDeleted: { $ne: true } });
    if (!po) {
      throw new Error("Purchase order not found");
    }

    if (po.status === "Closed" || po.status === "Cancelled") {
      throw new Error(`Cannot process GRN for PO in '${po.status}' status`);
    }

    if (!input.items || input.items.length === 0) {
      throw new Error("Goods receipt note must include at least one item");
    }

    const grnNumber = await this.generateDocNumber(companyId, "GRN", GoodsReceiptNote, "grnNumber");

    let totalAcceptedCost = 0;
    const grnItems = [];

    for (const item of input.items) {
      const qtyReceived = Number(item.quantityReceived) || 0;
      const qtyAccepted = Number(item.quantityAccepted) || 0;
      const qtyRejected = Number(item.quantityRejected) || 0;
      const unitCost = Number(item.unitCost) || 0;
      const totalCost = Number((qtyAccepted * unitCost).toFixed(2));
      totalAcceptedCost += totalCost;

      grnItems.push({
        poItemId: item.poItemId,
        productId: item.productId ? new Types.ObjectId(item.productId) : undefined,
        inventoryId: item.inventoryId ? new Types.ObjectId(item.inventoryId) : undefined,
        itemName: item.itemName.trim(),
        sku: item.sku.trim().toUpperCase(),
        itemCategory: item.itemCategory || "raw_material",
        quantityOrdered: Number(item.quantityOrdered) || 0,
        quantityReceived: qtyReceived,
        quantityAccepted: qtyAccepted,
        quantityRejected: qtyRejected,
        unit: item.unit || "units",
        unitCost,
        totalCost,
        remarks: item.remarks,
        rejectionReason: item.rejectionReason,
      });

      // Update quantityReceived on matching line item in PO
      const poItem = po.items.find(
        (pi) => pi.sku.toUpperCase() === item.sku.trim().toUpperCase() || (item.poItemId && pi._id?.toString() === item.poItemId)
      );

      if (poItem) {
        poItem.quantityReceived = (poItem.quantityReceived || 0) + qtyAccepted;
      }
    }

    const grn = await GoodsReceiptNote.create({
      companyId: new Types.ObjectId(companyId),
      grnNumber,
      purchaseOrderId: po._id,
      supplierId: po.supplierId,
      warehouseId: po.warehouseId,
      receivedBy: new Types.ObjectId(userId),
      receivedDate: new Date(),
      deliveryChallanNumber: input.deliveryChallanNumber,
      invoiceNumber: input.invoiceNumber,
      items: grnItems,
      totalAcceptedCost: Number(totalAcceptedCost.toFixed(2)),
      status: "Stock Updated",
      notes: input.notes,
    });

    // ====================================================
    // AUTOMATIC STOCK UPDATE INTEGRATION UPON GRN CREATION
    // ====================================================
    for (const item of grnItems) {
      if (item.quantityAccepted > 0) {
        try {
          await inventoryService.stockIn(companyId, userId, {
            warehouseId: po.warehouseId.toString(),
            productId: item.productId ? item.productId.toString() : undefined,
            sku: item.sku,
            itemName: item.itemName,
            itemCategory: item.itemCategory,
            quantity: item.quantityAccepted,
            unit: item.unit,
            unitCost: item.unitCost,
            referenceNumber: grnNumber,
            reason: `GRN Receipt (${grnNumber}) for PO ${po.poNumber}`,
            notes: `Accepted ${item.quantityAccepted} units via Goods Receipt Note`,
          });
        } catch (stockErr: any) {
          logger.error(`[GRN Stock Update Error] Failed to auto stock-in SKU ${item.sku}: ${stockErr.message}`);
        }
      }
    }

    // Determine PO fulfillment state machine transition:
    const totalOrderedAll = po.items.reduce((sum, i) => sum + i.quantityOrdered, 0);
    const totalReceivedAll = po.items.reduce((sum, i) => sum + i.quantityReceived, 0);

    let newPOStatus: POStatusType = po.status;
    if (totalReceivedAll >= totalOrderedAll && totalOrderedAll > 0) {
      newPOStatus = "Goods Received";
    } else if (totalReceivedAll > 0) {
      newPOStatus = "Partial Delivery";
    }

    po.status = newPOStatus;
    po.statusTimeline.push({
      status: newPOStatus,
      timestamp: new Date(),
      updatedBy: new Types.ObjectId(userId),
      comment: `GRN ${grnNumber} processed. Received total ${totalReceivedAll}/${totalOrderedAll} items.`,
    });

    await po.save();

    // If PR exists and PO is fully received, update PR state machine to Goods Received / Closed
    if (po.purchaseRequestId && ((newPOStatus as string) === "Goods Received" || (newPOStatus as string) === "Closed")) {
      const pr = await PurchaseRequest.findOne({ _id: po.purchaseRequestId, companyId });
      if (pr) {
        pr.status = "Goods Received";
        await pr.save();
      }
    }

    // Update Supplier purchaseHistory record & spend
    const supplier = await Supplier.findOne({ _id: po.supplierId, companyId });
    if (supplier) {
      supplier.totalSpend = (supplier.totalSpend || 0) + totalAcceptedCost;
      supplier.purchaseHistory = supplier.purchaseHistory || [];
      supplier.purchaseHistory.push({
        poNumber: po.poNumber,
        date: new Date(),
        itemSummary: grnItems.map((i) => `${i.itemName} (x${i.quantityAccepted})`).join(", ").slice(0, 200),
        itemsCount: grnItems.length,
        totalAmount: totalAcceptedCost,
        currency: "USD",
        status: newPOStatus === "Goods Received" ? "delivered" : "processing",
        deliveryRating: 5,
        notes: `GRN ${grnNumber} processed`,
      } as any);

      await supplier.save();
    }

    await auditService.log({
      companyId,
      userId,
      action: "GRN_CREATED",
      module: "procurement",
      referenceId: grn._id.toString(),
      after: {
        grnNumber: grn.grnNumber,
        poNumber: po.poNumber,
        acceptedCost: totalAcceptedCost,
        warehouseId: po.warehouseId,
      },
    });

    return grn;
  }

  // ==========================================
  // PURCHASE RETURN WORKFLOWS
  // ==========================================

  async createPurchaseReturn(companyId: string, userId: string, input: CreatePurchaseReturnInput) {
    const po = await PurchaseOrder.findOne({ _id: input.purchaseOrderId, companyId, isDeleted: { $ne: true } });
    if (!po) {
      throw new Error("Purchase order not found");
    }

    const supplier = await Supplier.findOne({ _id: input.supplierId, companyId, isDeleted: { $ne: true } });
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    const warehouse = await Warehouse.findOne({ _id: input.warehouseId, companyId, isDeleted: { $ne: true } });
    if (!warehouse) {
      throw new Error("Warehouse not found");
    }

    if (!input.items || input.items.length === 0) {
      throw new Error("Purchase return must include at least one item to return");
    }

    const returnNumber = await this.generateDocNumber(companyId, "PRN", PurchaseReturn, "returnNumber");

    let totalReturnAmount = 0;
    const processedItems = input.items.map((item) => {
      const qty = Number(item.quantityReturned) || 1;
      const unitCost = Number(item.unitCost) || 0;
      const totalRefund = Number((qty * unitCost).toFixed(2));
      totalReturnAmount += totalRefund;

      return {
        productId: item.productId ? new Types.ObjectId(item.productId) : undefined,
        inventoryId: item.inventoryId ? new Types.ObjectId(item.inventoryId) : undefined,
        itemName: item.itemName.trim(),
        sku: item.sku.trim().toUpperCase(),
        itemCategory: item.itemCategory || "raw_material",
        quantityReturned: qty,
        unit: item.unit || "units",
        unitCost,
        totalRefundAmount: totalRefund,
        condition: item.condition,
      };
    });

    const purchaseReturn = await PurchaseReturn.create({
      companyId: new Types.ObjectId(companyId),
      returnNumber,
      purchaseOrderId: po._id,
      grnId: input.grnId ? new Types.ObjectId(input.grnId) : undefined,
      supplierId: new Types.ObjectId(input.supplierId),
      warehouseId: new Types.ObjectId(input.warehouseId),
      returnedBy: new Types.ObjectId(userId),
      returnDate: new Date(),
      reason: input.reason,
      reasonDetails: input.reasonDetails,
      items: processedItems,
      totalReturnAmount: Number(totalReturnAmount.toFixed(2)),
      status: "Completed",
      refundStatus: "Pending",
      notes: input.notes,
    });

    // Update Supplier credit / total spend adjustment and history log
    supplier.totalSpend = Math.max(0, Number(((supplier.totalSpend || 0) - totalReturnAmount).toFixed(2)));
    supplier.purchaseHistory = supplier.purchaseHistory || [];
    supplier.purchaseHistory.push({
      poNumber: po.poNumber,
      date: new Date(),
      itemSummary: `[RETURN - ${input.reason}] ${processedItems.map((i) => `${i.itemName} (x${i.quantityReturned})`).join(", ")}`.slice(0, 200),
      itemsCount: processedItems.length,
      totalAmount: totalReturnAmount,
      currency: "USD",
      status: "processing",
      notes: `Purchase Return ${returnNumber} processed (${input.reason})`,
    } as any);
    await supplier.save();

    // =======================================================
    // AUTOMATIC STOCK DEDUCTION (STOCK OUT) ON PURCHASE RETURN
    // =======================================================
    for (const item of processedItems) {
      if (item.quantityReturned > 0) {
        try {
          await inventoryService.stockOut(companyId, userId, {
            warehouseId: input.warehouseId,
            productId: item.productId ? item.productId.toString() : undefined,
            sku: item.sku,
            itemName: item.itemName,
            itemCategory: item.itemCategory,
            quantity: item.quantityReturned,
            unit: item.unit,
            referenceNumber: returnNumber,
            reason: `Purchase Return (${returnNumber}): ${input.reason}`,
            notes: `Returned ${item.quantityReturned} units to supplier ${supplier.name}`,
          });
        } catch (stockErr: any) {
          logger.error(`[Purchase Return Stock Out Error] Failed to deduct SKU ${item.sku}: ${stockErr.message}`);
        }
      }
    }

    await auditService.log({
      companyId,
      userId,
      action: "PURCHASE_RETURN_CREATED",
      module: "procurement",
      referenceId: purchaseReturn._id.toString(),
      after: {
        returnNumber: purchaseReturn.returnNumber,
        supplierId: input.supplierId,
        totalReturnAmount,
        reason: input.reason,
      },
    });

    return purchaseReturn;
  }

  // ==========================================
  // SUPPLIER PURCHASE HISTORY RETRIEVAL
  // ==========================================

  async getSupplierPurchaseHistory(companyId: string, supplierId: string) {
    const supplier = await Supplier.findOne({ _id: supplierId, companyId, isDeleted: { $ne: true } });
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    const [orders, grns, returns] = await Promise.all([
      PurchaseOrder.find({ companyId, supplierId: supplier._id, isDeleted: { $ne: true } })
        .populate("warehouseId", "name location")
        .populate("issuerId", "name email")
        .sort({ orderDate: -1 }),
      GoodsReceiptNote.find({ companyId, supplierId: supplier._id, isDeleted: { $ne: true } })
        .populate("receivedBy", "name email")
        .sort({ receivedDate: -1 }),
      PurchaseReturn.find({ companyId, supplierId: supplier._id, isDeleted: { $ne: true } })
        .populate("returnedBy", "name email")
        .sort({ returnDate: -1 }),
    ]);

    const totalOrdersCount = orders.length;
    const totalSpend = orders.reduce((sum, po) => sum + (po.grandTotal || 0), 0);
    const totalReturnsCount = returns.length;
    const totalReturnedAmount = returns.reduce((sum, ret) => sum + (ret.totalReturnAmount || 0), 0);

    const metrics = supplier.getPerformanceMetrics ? supplier.getPerformanceMetrics() : null;

    return {
      success: true,
      supplier: {
        _id: supplier._id,
        name: supplier.name,
        code: supplier.code,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        category: supplier.category,
        rating: supplier.rating,
        complianceStatus: supplier.complianceStatus,
      },
      summary: {
        totalOrdersCount,
        totalSpend: Number(totalSpend.toFixed(2)),
        totalGrnsCount: grns.length,
        totalReturnsCount,
        totalReturnedAmount: Number(totalReturnedAmount.toFixed(2)),
        performance: metrics,
      },
      orders,
      grns,
      returns,
    };
  }

  // ==========================================
  // PROCUREMENT ANALYTICS & SUMMARY REPORTS
  // ==========================================

  async getProcurementReports(companyId: string) {
    const compObjectId = new Types.ObjectId(companyId);

    const [prStats, poStats, grnStats, returnStats, topSuppliers, categorySpend, recentPRs, recentPOs] =
      await Promise.all([
        // PR Status Aggregation
        PurchaseRequest.aggregate([
          { $match: { companyId: compObjectId, isDeleted: { $ne: true } } },
          { $group: { _id: "$status", count: { $sum: 1 }, totalEstimatedCost: { $sum: "$totalEstimatedCost" } } },
        ]),
        // PO Status Aggregation
        PurchaseOrder.aggregate([
          { $match: { companyId: compObjectId, isDeleted: { $ne: true } } },
          { $group: { _id: "$status", count: { $sum: 1 }, grandTotal: { $sum: "$grandTotal" } } },
        ]),
        // GRN Aggregation
        GoodsReceiptNote.aggregate([
          { $match: { companyId: compObjectId, isDeleted: { $ne: true } } },
          { $group: { _id: null, totalGRNs: { $sum: 1 }, totalAcceptedCost: { $sum: "$totalAcceptedCost" } } },
        ]),
        // Return Aggregation
        PurchaseReturn.aggregate([
          { $match: { companyId: compObjectId, isDeleted: { $ne: true } } },
          { $group: { _id: null, totalReturns: { $sum: 1 }, totalReturnedAmount: { $sum: "$totalReturnAmount" } } },
        ]),
        // Top 5 Suppliers by Spend
        PurchaseOrder.aggregate([
          { $match: { companyId: compObjectId, isDeleted: { $ne: true } } },
          { $group: { _id: "$supplierId", totalSpend: { $sum: "$grandTotal" }, orderCount: { $sum: 1 } } },
          { $sort: { totalSpend: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "suppliers",
              localField: "_id",
              foreignField: "_id",
              as: "supplier",
            },
          },
          { $unwind: "$supplier" },
          {
            $project: {
              _id: 1,
              name: "$supplier.name",
              code: "$supplier.code",
              rating: "$supplier.rating",
              totalSpend: 1,
              orderCount: 1,
            },
          },
        ]),
        // Spend Breakdown by Category
        PurchaseOrder.aggregate([
          { $match: { companyId: compObjectId, isDeleted: { $ne: true } } },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.itemCategory",
              totalCategorySpend: { $sum: "$items.totalPrice" },
              totalQuantity: { $sum: "$items.quantityOrdered" },
            },
          },
        ]),
        // Recent 5 Purchase Requests
        PurchaseRequest.find({ companyId, isDeleted: { $ne: true } })
          .populate("requesterId", "name")
          .populate("warehouseId", "name")
          .sort({ createdAt: -1 })
          .limit(5),
        // Recent 5 Purchase Orders
        PurchaseOrder.find({ companyId, isDeleted: { $ne: true } })
          .populate("supplierId", "name code")
          .populate("warehouseId", "name")
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

    // Transform PR stats into object dictionary
    const requestsByStatus: Record<string, number> = {
      Draft: 0,
      Submitted: 0,
      Approved: 0,
      Rejected: 0,
      "PO Created": 0,
      "Goods Received": 0,
      Closed: 0,
      Cancelled: 0,
    };
    let totalPRCount = 0;
    let totalPREstimatedValue = 0;

    for (const stat of prStats) {
      requestsByStatus[stat._id] = stat.count;
      totalPRCount += stat.count;
      totalPREstimatedValue += stat.totalEstimatedCost || 0;
    }

    // Transform PO stats into object dictionary
    const ordersByStatus: Record<string, number> = {
      Draft: 0,
      Submitted: 0,
      Approved: 0,
      "PO Created": 0,
      Issued: 0,
      "In Transit": 0,
      "Partial Delivery": 0,
      "Goods Received": 0,
      Closed: 0,
      Cancelled: 0,
    };
    let totalPOCount = 0;
    let totalPOSpend = 0;

    for (const stat of poStats) {
      ordersByStatus[stat._id] = stat.count;
      totalPOCount += stat.count;
      totalPOSpend += stat.grandTotal || 0;
    }

    const grnSummary = grnStats[0] || { totalGRNs: 0, totalAcceptedCost: 0 };
    const returnsSummary = returnStats[0] || { totalReturns: 0, totalReturnedAmount: 0 };

    return {
      success: true,
      data: {
        overview: {
          totalPurchaseRequests: totalPRCount,
          totalPREstimatedValue: Number(totalPREstimatedValue.toFixed(2)),
          totalPurchaseOrders: totalPOCount,
          totalPOSpend: Number(totalPOSpend.toFixed(2)),
          totalGRNs: grnSummary.totalGRNs,
          totalGRNValue: Number((grnSummary.totalAcceptedCost || 0).toFixed(2)),
          totalReturns: returnsSummary.totalReturns,
          totalReturnedValue: Number((returnsSummary.totalReturnedAmount || 0).toFixed(2)),
        },
        requestsByStatus,
        ordersByStatus,
        topSuppliersBySpend: topSuppliers,
        spendByCategory: categorySpend.map((c) => ({
          category: c._id || "other",
          totalSpend: Number((c.totalCategorySpend || 0).toFixed(2)),
          totalQuantity: c.totalQuantity || 0,
        })),
        recentActivity: {
          purchaseRequests: recentPRs,
          purchaseOrders: recentPOs,
        },
      },
    };
  }
}

export const procurementService = new ProcurementService();
export default procurementService;
