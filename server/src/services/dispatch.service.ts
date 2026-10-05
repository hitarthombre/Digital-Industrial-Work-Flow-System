import { Types } from "mongoose";
import {
  DispatchOrder,
  IDispatchOrder,
  DispatchStatus,
  ITransportDetails,
  DispatchDocType,
} from "../models/DispatchOrder";
import { SalesOrder } from "../models/SalesOrder";
import { Customer } from "../models/Customer";
import { Warehouse } from "../models/Warehouse";
import { Inventory } from "../models/Inventory";
import { ISalesAddress } from "../models/SalesCommon";
import { inventoryService } from "./inventory.service";
import { salesService } from "./sales.service";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";
import { HttpError, notFound, badRequest } from "../utils/httpError";
import { generateDocNumber, round2, escapeRegex, paginate, buildDateRange } from "../utils/docNumber";

export interface CreateDispatchInput {
  salesOrderId?: string;
  customerId?: string;
  warehouseId?: string;
  items?: Array<{ productId?: string; sku: string; itemName: string; quantity: number; unit?: string }>;
  shippingAddress?: ISalesAddress;
  contactName?: string;
  contactPhone?: string;
  transport?: ITransportDetails;
  plannedDispatchDate?: string;
  estimatedDeliveryDate?: string;
  notes?: string;
}

export interface UpdateDispatchStatusInput {
  status: DispatchStatus;
  location?: string;
  note?: string;
  receivedBy?: string;
}

export interface DispatchDocumentInput {
  title: string;
  docType?: DispatchDocType;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}

const DISPATCH_TRANSITIONS: Record<DispatchStatus, DispatchStatus[]> = {
  Pending: ["Packed", "Shipped", "Cancelled"],
  Packed: ["Pending", "Shipped", "Cancelled"],
  Shipped: ["In Transit", "Out for Delivery", "Delivered", "Returned"],
  "In Transit": ["In Transit", "Out for Delivery", "Delivered", "Returned"],
  "Out for Delivery": ["In Transit", "Delivered", "Returned"],
  Delivered: [],
  Returned: [],
  Cancelled: [],
};

// Statuses at which goods have physically left the warehouse
const SHIPPED_STATUSES: DispatchStatus[] = ["Shipped", "In Transit", "Out for Delivery", "Delivered"];

export const DISPATCH_PROGRESS_STEPS: DispatchStatus[] = ["Pending", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered"];

export class DispatchService {
  private async loadDispatch(companyId: string, id: string) {
    const dispatch = await DispatchOrder.findOne({ _id: id, companyId, isDeleted: { $ne: true } });
    if (!dispatch) throw notFound("Dispatch order");
    return dispatch;
  }

  private async notifyDispatch(companyId: string, dispatch: IDispatchOrder, title: string, message: string) {
    const recipients: any[] = [dispatch.createdBy];
    if (dispatch.salesOrderId) {
      const order = await SalesOrder.findById(dispatch.salesOrderId).select("createdBy");
      if (order) recipients.push(order.createdBy);
    }
    await notificationService.notifyUsers(companyId, recipients, title, message, "dispatch_update", {
      link: `/app/dispatch/${dispatch._id}`,
    });
  }

  // ==========================================
  // DISPATCH ORDER CREATION
  // ==========================================

  async createDispatch(companyId: string, userId: string, input: CreateDispatchInput) {
    let customerId = input.customerId;
    let warehouseId = input.warehouseId;
    let shippingAddress = input.shippingAddress;
    let items = input.items || [];

    if (input.salesOrderId) {
      const order = await SalesOrder.findOne({ _id: input.salesOrderId, companyId, isDeleted: { $ne: true } });
      if (!order) throw notFound("Sales order");
      if (!["Approved", "Processing", "Partially Dispatched"].includes(order.status)) {
        throw badRequest(`Cannot dispatch a sales order in '${order.status}' status`);
      }

      // Quantities already committed to other open dispatches of this order
      const openDispatches = await DispatchOrder.find({
        companyId,
        salesOrderId: order._id,
        isDeleted: { $ne: true },
        status: { $in: ["Pending", "Packed"] },
      });
      const committed: Record<string, number> = {};
      openDispatches.forEach((d) => d.items.forEach((i) => (committed[i.sku] = (committed[i.sku] || 0) + i.quantity)));

      const remainingBySku: Record<string, { quantity: number; itemName: string; unit: string; productId?: string }> = {};
      order.items.forEach((line) => {
        const entry = remainingBySku[line.sku] || { quantity: 0, itemName: line.itemName, unit: line.unit, productId: line.productId?.toString() };
        entry.quantity += line.quantity - (line.quantityDispatched || 0);
        remainingBySku[line.sku] = entry;
      });
      Object.keys(committed).forEach((sku) => {
        if (remainingBySku[sku]) remainingBySku[sku].quantity -= committed[sku];
      });

      if (items.length === 0) {
        items = Object.entries(remainingBySku)
          .filter(([, v]) => v.quantity > 0)
          .map(([sku, v]) => ({ sku, itemName: v.itemName, quantity: round2(v.quantity), unit: v.unit, productId: v.productId }));
        if (items.length === 0) throw badRequest(`All items on ${order.orderNumber} are already dispatched or scheduled`);
      } else {
        items.forEach((item) => {
          const sku = item.sku.trim().toUpperCase();
          const remaining = remainingBySku[sku];
          if (!remaining) throw badRequest(`SKU ${sku} is not on sales order ${order.orderNumber}`);
          if (item.quantity > remaining.quantity + 0.0001) {
            throw badRequest(`Only ${round2(Math.max(remaining.quantity, 0))} of ${sku} remain to be dispatched on ${order.orderNumber}`);
          }
        });
      }

      customerId = order.customerId.toString();
      warehouseId = warehouseId || order.warehouseId.toString();
      shippingAddress = shippingAddress || order.shippingAddress;

      if (order.status === "Approved") {
        await salesService.updateSalesOrderStatus(companyId, userId, order._id.toString(), "Processing", "Dispatch scheduled");
      }
    }

    if (!warehouseId) throw badRequest("A source warehouse is required");
    if (items.length === 0) throw badRequest("At least one item is required");

    const warehouse = await Warehouse.findOne({ _id: warehouseId, companyId, isDeleted: { $ne: true } });
    if (!warehouse) throw notFound("Warehouse");

    let customer = null;
    if (customerId) {
      customer = await Customer.findOne({ _id: customerId, companyId, isDeleted: { $ne: true } });
      if (!customer) throw notFound("Customer");
      shippingAddress = shippingAddress || (customer.shippingAddress as ISalesAddress) || (customer.billingAddress as ISalesAddress);
    }

    const dispatch = await DispatchOrder.create({
      companyId: new Types.ObjectId(companyId),
      dispatchNumber: await generateDocNumber(DispatchOrder, companyId, "DSP"),
      salesOrderId: input.salesOrderId ? new Types.ObjectId(input.salesOrderId) : undefined,
      customerId: customerId ? new Types.ObjectId(customerId) : undefined,
      warehouseId: new Types.ObjectId(warehouseId),
      items: items.map((item) => ({
        productId: item.productId ? new Types.ObjectId(item.productId) : undefined,
        sku: item.sku.trim().toUpperCase(),
        itemName: item.itemName.trim(),
        quantity: Number(item.quantity),
        unit: item.unit || "units",
      })),
      shippingAddress,
      contactName: input.contactName || customer?.primaryContact?.name || customer?.contactName,
      contactPhone: input.contactPhone || customer?.primaryContact?.phone || customer?.phone,
      transport: input.transport || {},
      plannedDispatchDate: input.plannedDispatchDate ? new Date(input.plannedDispatchDate) : undefined,
      estimatedDeliveryDate: input.estimatedDeliveryDate ? new Date(input.estimatedDeliveryDate) : undefined,
      status: "Pending",
      trackingEvents: [
        { status: "Pending", note: "Dispatch order created", location: warehouse.name, timestamp: new Date(), updatedBy: new Types.ObjectId(userId) },
      ],
      notes: input.notes,
      createdBy: new Types.ObjectId(userId),
    });

    await auditService.log({
      companyId,
      userId,
      action: "DISPATCH_CREATED",
      module: "dispatch",
      referenceId: dispatch._id.toString(),
      after: { dispatchNumber: dispatch.dispatchNumber, salesOrderId: input.salesOrderId, items: dispatch.items.length },
    });

    return dispatch;
  }

  // ==========================================
  // QUERIES
  // ==========================================

  async getDispatches(companyId: string, query: any) {
    const { page, limit, skip } = paginate(query);
    const filter: any = { companyId, isDeleted: { $ne: true } };
    if (query.status) filter.status = query.status;
    if (query.warehouseId) filter.warehouseId = query.warehouseId;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.salesOrderId) filter.salesOrderId = query.salesOrderId;
    if (query.mode) filter["transport.mode"] = query.mode;
    const dateRange = buildDateRange(query.startDate, query.endDate);
    if (dateRange) filter.createdAt = dateRange;
    if (query.search) {
      const rx = { $regex: escapeRegex(query.search), $options: "i" };
      filter.$or = [
        { dispatchNumber: rx },
        { "transport.trackingNumber": rx },
        { "transport.vehicleNumber": rx },
        { "transport.carrierName": rx },
        { "items.sku": rx },
        { "items.itemName": rx },
      ];
    }

    const sortField = ["createdAt", "estimatedDeliveryDate", "actualDispatchDate", "dispatchNumber"].includes(query.sortBy)
      ? query.sortBy
      : "createdAt";
    const sortDir = query.sortOrder === "asc" ? 1 : -1;

    const [dispatches, total] = await Promise.all([
      DispatchOrder.find(filter)
        .select("-trackingEvents")
        .populate("customerId", "name code")
        .populate("warehouseId", "name code")
        .populate("salesOrderId", "orderNumber status")
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit),
      DispatchOrder.countDocuments(filter),
    ]);

    return { success: true, data: dispatches, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getDispatchById(companyId: string, id: string) {
    const dispatch = await DispatchOrder.findOne({ _id: id, companyId, isDeleted: { $ne: true } })
      .populate("customerId", "name code email phone")
      .populate("warehouseId", "name code location")
      .populate("salesOrderId", "orderNumber status grandTotal")
      .populate("createdBy", "firstName lastName email")
      .populate("trackingEvents.updatedBy", "firstName lastName")
      .populate("documents.uploadedBy", "firstName lastName");
    if (!dispatch) throw notFound("Dispatch order");
    return dispatch;
  }

  // ==========================================
  // TRANSPORT DETAILS
  // ==========================================

  async updateTransport(
    companyId: string,
    userId: string,
    id: string,
    input: ITransportDetails & { estimatedDeliveryDate?: string; plannedDispatchDate?: string }
  ) {
    const dispatch = await this.loadDispatch(companyId, id);
    if (["Delivered", "Returned", "Cancelled"].includes(dispatch.status)) {
      throw badRequest(`Transport details cannot be changed on a ${dispatch.status.toLowerCase()} dispatch`);
    }

    const before = { ...(dispatch.transport as any)?.toObject?.() };
    const { estimatedDeliveryDate, plannedDispatchDate, ...transport } = input;
    dispatch.transport = { ...(before || {}), ...transport };
    if (estimatedDeliveryDate) dispatch.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
    if (plannedDispatchDate) dispatch.plannedDispatchDate = new Date(plannedDispatchDate);
    dispatch.trackingEvents.push({
      status: dispatch.status,
      note: `Transport details updated${transport.carrierName ? ` (${transport.carrierName})` : ""}`,
      timestamp: new Date(),
      updatedBy: new Types.ObjectId(userId),
    });
    await dispatch.save();

    await auditService.log({
      companyId,
      userId,
      action: "DISPATCH_TRANSPORT_UPDATED",
      module: "dispatch",
      referenceId: dispatch._id.toString(),
      before,
      after: dispatch.transport,
    });

    return dispatch;
  }

  // ==========================================
  // SHIPMENT STATUS & DELIVERY TRACKING
  // ==========================================

  async updateStatus(companyId: string, userId: string, id: string, input: UpdateDispatchStatusInput) {
    const dispatch = await this.loadDispatch(companyId, id);
    const previous = dispatch.status;

    if (!DISPATCH_TRANSITIONS[previous].includes(input.status)) {
      throw badRequest(`Cannot move dispatch from '${previous}' to '${input.status}'`);
    }

    const isShipping = SHIPPED_STATUSES.includes(input.status) && !dispatch.stockDeducted;
    if (isShipping) {
      await this.deductStock(companyId, userId, dispatch);
      dispatch.actualDispatchDate = dispatch.actualDispatchDate || new Date();
    }

    if (input.status === "Returned" && dispatch.stockDeducted) {
      await this.restoreStock(companyId, userId, dispatch);
    }

    dispatch.status = input.status;
    if (input.status === "Delivered") {
      dispatch.deliveredAt = new Date();
      if (input.receivedBy) dispatch.receivedBy = input.receivedBy;
    }
    dispatch.trackingEvents.push({
      status: input.status,
      location: input.location,
      note: input.note,
      timestamp: new Date(),
      updatedBy: new Types.ObjectId(userId),
    });
    await dispatch.save();

    // Reflect fulfilment on the linked sales order
    if (dispatch.salesOrderId) {
      const shippedLines = dispatch.items.map((i) => ({ sku: i.sku, quantity: i.quantity }));
      if (isShipping) {
        await salesService.applyDispatchProgress(companyId, userId, dispatch.salesOrderId.toString(), shippedLines, false);
      }
      if (input.status === "Returned") {
        await salesService.applyDispatchProgress(
          companyId,
          userId,
          dispatch.salesOrderId.toString(),
          shippedLines.map((l) => ({ ...l, quantity: -l.quantity })),
          false
        );
      }
      if (input.status === "Delivered") {
        const undelivered = await DispatchOrder.exists({
          companyId,
          salesOrderId: dispatch.salesOrderId,
          isDeleted: { $ne: true },
          status: { $nin: ["Delivered", "Cancelled", "Returned"] },
        });
        await salesService.applyDispatchProgress(companyId, userId, dispatch.salesOrderId.toString(), [], !undelivered);
      }
    }

    await auditService.log({
      companyId,
      userId,
      action: "DISPATCH_STATUS_UPDATED",
      module: "dispatch",
      referenceId: dispatch._id.toString(),
      before: { status: previous },
      after: { status: input.status, location: input.location, note: input.note },
    });

    await this.notifyDispatch(
      companyId,
      dispatch,
      `Shipment ${dispatch.dispatchNumber}: ${input.status}`,
      `Shipment ${dispatch.dispatchNumber} moved from ${previous} to ${input.status}${input.location ? ` at ${input.location}` : ""}.`
    );

    return dispatch;
  }

  // All-or-nothing availability check before issuing any stock
  private async deductStock(companyId: string, userId: string, dispatch: IDispatchOrder) {
    const required: Record<string, number> = {};
    dispatch.items.forEach((i) => (required[i.sku] = (required[i.sku] || 0) + i.quantity));

    const stock = await Inventory.find({ companyId, warehouseId: dispatch.warehouseId, sku: { $in: Object.keys(required) } });
    const shortages = Object.entries(required)
      .map(([sku, qty]) => {
        const available = stock.find((s) => s.sku === sku)?.quantity || 0;
        return available < qty ? `${sku} (need ${qty}, available ${available})` : null;
      })
      .filter(Boolean);
    if (shortages.length > 0) {
      throw new HttpError(400, `Insufficient stock to ship: ${shortages.join(", ")}`);
    }

    for (const item of dispatch.items) {
      await inventoryService.stockOut(companyId, userId, {
        warehouseId: dispatch.warehouseId.toString(),
        sku: item.sku,
        quantity: item.quantity,
        referenceNumber: dispatch.dispatchNumber,
        reason: `Dispatched on ${dispatch.dispatchNumber}`,
      });
    }
    dispatch.stockDeducted = true;
  }

  private async restoreStock(companyId: string, userId: string, dispatch: IDispatchOrder) {
    for (const item of dispatch.items) {
      await inventoryService.stockIn(companyId, userId, {
        warehouseId: dispatch.warehouseId.toString(),
        sku: item.sku,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        referenceNumber: dispatch.dispatchNumber,
        reason: `Returned shipment ${dispatch.dispatchNumber}`,
      });
    }
    dispatch.stockDeducted = false;
  }

  async getTracking(companyId: string, id: string) {
    const dispatch = await this.getDispatchById(companyId, id);
    const currentIndex = DISPATCH_PROGRESS_STEPS.indexOf(dispatch.status);
    const isClosedOut = ["Returned", "Cancelled"].includes(dispatch.status);

    const steps = DISPATCH_PROGRESS_STEPS.map((step, index) => {
      const event = [...dispatch.trackingEvents].reverse().find((e) => e.status === step);
      return {
        status: step,
        state: isClosedOut ? (event ? "completed" : "skipped") : index < currentIndex ? "completed" : index === currentIndex ? "current" : "upcoming",
        timestamp: event?.timestamp,
        location: event?.location,
      };
    });

    const isDelayed =
      !!dispatch.estimatedDeliveryDate &&
      !["Delivered", "Returned", "Cancelled"].includes(dispatch.status) &&
      dispatch.estimatedDeliveryDate < new Date();

    return {
      success: true,
      data: {
        dispatchNumber: dispatch.dispatchNumber,
        status: dispatch.status,
        progressPercent: isClosedOut ? 100 : Math.round((Math.max(currentIndex, 0) / (DISPATCH_PROGRESS_STEPS.length - 1)) * 100),
        steps,
        events: [...dispatch.trackingEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        transport: dispatch.transport,
        estimatedDeliveryDate: dispatch.estimatedDeliveryDate,
        actualDispatchDate: dispatch.actualDispatchDate,
        deliveredAt: dispatch.deliveredAt,
        isDelayed,
      },
    };
  }

  // ==========================================
  // DISPATCH DOCUMENTS
  // ==========================================

  async addDocument(companyId: string, userId: string, id: string, input: DispatchDocumentInput) {
    const dispatch = await this.loadDispatch(companyId, id);
    dispatch.documents.push({
      title: input.title.trim(),
      docType: input.docType || "other",
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      fileType: input.fileType,
      fileSize: Number(input.fileSize) || 0,
      uploadedBy: new Types.ObjectId(userId),
      uploadedAt: new Date(),
    });
    await dispatch.save();

    await auditService.log({
      companyId,
      userId,
      action: "DISPATCH_DOCUMENT_UPLOADED",
      module: "dispatch",
      referenceId: dispatch._id.toString(),
      after: { title: input.title, docType: input.docType, fileName: input.fileName },
    });

    return dispatch;
  }

  async removeDocument(companyId: string, userId: string, id: string, documentId: string) {
    const dispatch = await this.loadDispatch(companyId, id);
    const doc = dispatch.documents.id(documentId);
    if (!doc) throw notFound("Dispatch document");
    const title = doc.title;
    doc.deleteOne();
    await dispatch.save();

    await auditService.log({
      companyId,
      userId,
      action: "DISPATCH_DOCUMENT_REMOVED",
      module: "dispatch",
      referenceId: dispatch._id.toString(),
      before: { documentId, title },
    });

    return dispatch;
  }

  // ==========================================
  // DISPATCH REPORTS
  // ==========================================

  async getReports(companyId: string, query: { startDate?: string; endDate?: string } = {}) {
    const companyObjectId = new Types.ObjectId(companyId);
    const match: any = { companyId: companyObjectId, isDeleted: { $ne: true } };
    const dateRange = buildDateRange(query.startDate, query.endDate);
    if (dateRange) match.createdAt = dateRange;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [statusAgg, deliveredAgg, modeAgg, monthly, delayed] = await Promise.all([
      DispatchOrder.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      DispatchOrder.aggregate([
        { $match: { ...match, status: "Delivered", deliveredAt: { $exists: true } } },
        {
          $group: {
            _id: null,
            delivered: { $sum: 1 },
            onTime: {
              $sum: {
                $cond: [
                  { $or: [{ $not: ["$estimatedDeliveryDate"] }, { $lte: ["$deliveredAt", "$estimatedDeliveryDate"] }] },
                  1,
                  0,
                ],
              },
            },
            transitMs: { $avg: { $subtract: ["$deliveredAt", { $ifNull: ["$actualDispatchDate", "$createdAt"] }] } },
          },
        },
      ]),
      DispatchOrder.aggregate([
        { $match: match },
        { $group: { _id: { $ifNull: ["$transport.mode", "unassigned"] }, count: { $sum: 1 }, freight: { $sum: { $ifNull: ["$transport.freightCost", 0] } } } },
        { $sort: { count: -1 } },
      ]),
      DispatchOrder.aggregate([
        { $match: { companyId: companyObjectId, isDeleted: { $ne: true }, actualDispatchDate: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: "$actualDispatchDate" }, month: { $month: "$actualDispatchDate" } }, count: { $sum: 1 } } },
      ]),
      DispatchOrder.countDocuments({
        companyId,
        isDeleted: { $ne: true },
        status: { $nin: ["Delivered", "Returned", "Cancelled"] },
        estimatedDeliveryDate: { $lt: new Date() },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    statusAgg.forEach((s: any) => (byStatus[s._id] = s.count));
    const delivered = deliveredAgg[0] || { delivered: 0, onTime: 0, transitMs: 0 };

    const monthlyShipments: Array<{ label: string; value: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const found = monthly.find((m: any) => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1);
      monthlyShipments.push({ label: d.toLocaleString("en-US", { month: "short" }), value: found ? found.count : 0 });
    }

    return {
      success: true,
      data: {
        totalDispatches: Object.values(byStatus).reduce((a, b) => a + b, 0),
        byStatus,
        pending: (byStatus["Pending"] || 0) + (byStatus["Packed"] || 0),
        inTransit: (byStatus["Shipped"] || 0) + (byStatus["In Transit"] || 0) + (byStatus["Out for Delivery"] || 0),
        delivered: byStatus["Delivered"] || 0,
        returned: byStatus["Returned"] || 0,
        delayed,
        onTimeDeliveryRate: delivered.delivered ? round2((delivered.onTime / delivered.delivered) * 100) : 0,
        averageTransitDays: delivered.transitMs ? round2(delivered.transitMs / 86400000) : 0,
        totalFreightCost: round2(modeAgg.reduce((sum: number, m: any) => sum + m.freight, 0)),
        byTransportMode: modeAgg.map((m: any) => ({ mode: m._id, count: m.count, freight: round2(m.freight) })),
        monthlyShipments,
      },
    };
  }
}

export const dispatchService = new DispatchService();
export default dispatchService;
