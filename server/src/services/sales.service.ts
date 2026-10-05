import { Types } from "mongoose";
import { Quotation, QuotationStatus } from "../models/Quotation";
import { SalesOrder, ISalesOrder, SalesOrderStatus, SalesPaymentStatus } from "../models/SalesOrder";
import { SalesInvoice, ISalesInvoice, PaymentMethod } from "../models/SalesInvoice";
import { ISalesAddress } from "../models/SalesCommon";
import { Customer } from "../models/Customer";
import { Warehouse } from "../models/Warehouse";
import { customerService } from "./customer.service";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";
import { HttpError, notFound, badRequest } from "../utils/httpError";
import { generateDocNumber, round2, escapeRegex, paginate, buildDateRange } from "../utils/docNumber";

export interface SalesLineInput {
  productId?: string;
  itemName: string;
  sku: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
  taxRate?: number;
}

export interface CreateQuotationInput {
  customerId: string;
  validUntil?: string;
  items: SalesLineInput[];
  shippingCost?: number;
  notes?: string;
  termsAndConditions?: string;
  status?: "Draft" | "Sent";
}

export interface CreateSalesOrderInput {
  customerId: string;
  quotationId?: string;
  warehouseId: string;
  expectedDeliveryDate?: string;
  customerPoNumber?: string;
  items: SalesLineInput[];
  shippingCost?: number;
  shippingAddress?: ISalesAddress;
  paymentTerms?: string;
  notes?: string;
}

export interface ApproveSalesOrderInput {
  status: "Approved" | "Rejected";
  approvalNotes?: string;
  rejectionReason?: string;
}

export interface CreateInvoiceInput {
  salesOrderId: string;
  dueDate?: string;
  notes?: string;
}

export interface RecordPaymentInput {
  amount: number;
  paymentDate?: string;
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
}

const QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  Draft: ["Sent", "Accepted", "Rejected"],
  Sent: ["Accepted", "Rejected", "Expired"],
  Accepted: ["Rejected"],
  Rejected: [],
  Expired: ["Sent"],
  Converted: [],
};

// Manual status changes; dispatch progress statuses are driven by the dispatch module
const ORDER_MANUAL_TRANSITIONS: Partial<Record<SalesOrderStatus, SalesOrderStatus[]>> = {
  "Pending Approval": ["Cancelled"],
  Approved: ["Processing", "Cancelled"],
  Processing: ["Approved", "Cancelled"],
  Dispatched: ["Delivered"],
};

// Maps onto the embedded customer.orders history used by the customer profile
const CUSTOMER_ORDER_STATUS: Record<SalesOrderStatus, string> = {
  "Pending Approval": "draft",
  Approved: "confirmed",
  Rejected: "cancelled",
  Processing: "processing",
  "Partially Dispatched": "shipped",
  Dispatched: "shipped",
  Delivered: "delivered",
  Cancelled: "cancelled",
};

const CUSTOMER_PAYMENT_STATUS: Record<SalesPaymentStatus, string> = {
  unpaid: "pending",
  partially_paid: "partially_paid",
  paid: "paid",
};

const toId = (id?: string) => (id ? new Types.ObjectId(id) : undefined);

export class SalesService {
  // ------------------------------------------
  // Shared pricing helpers
  // ------------------------------------------

  private priceLines(items: SalesLineInput[], shippingCost = 0) {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const lines = items.map((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const discountPercent = Number(item.discountPercent) || 0;
      const taxRate = Number(item.taxRate) || 0;

      const lineSubtotal = round2(quantity * unitPrice);
      const discountAmount = round2((lineSubtotal * discountPercent) / 100);
      const taxAmount = round2(((lineSubtotal - discountAmount) * taxRate) / 100);
      const lineTotal = round2(lineSubtotal - discountAmount + taxAmount);

      subtotal += lineSubtotal;
      discountTotal += discountAmount;
      taxTotal += taxAmount;

      return {
        productId: toId(item.productId),
        itemName: item.itemName.trim(),
        sku: item.sku.trim().toUpperCase(),
        quantity,
        unit: item.unit || "units",
        unitPrice,
        discountPercent,
        taxRate,
        lineSubtotal,
        discountAmount,
        taxAmount,
        lineTotal,
        quantityDispatched: 0,
      };
    });

    const shipping = round2(Number(shippingCost) || 0);
    return {
      items: lines,
      subtotal: round2(subtotal),
      discountTotal: round2(discountTotal),
      taxTotal: round2(taxTotal),
      shippingCost: shipping,
      grandTotal: round2(subtotal - discountTotal + taxTotal + shipping),
    };
  }

  private async loadCustomer(companyId: string, customerId: string) {
    const customer = await Customer.findOne({ _id: customerId, companyId, isDeleted: { $ne: true } });
    if (!customer) throw notFound("Customer");
    return customer;
  }

  // Keep the customer profile's embedded order history in step with the sales order
  private async syncCustomerOrder(companyId: string, order: ISalesOrder, paymentDelta = 0, revenueDelta = 0) {
    const customer = await Customer.findOne({ _id: order.customerId, companyId });
    if (!customer) return;

    const entry = (customer.orders || []).find((o) => o.orderNumber === order.orderNumber);
    if (entry) {
      entry.status = CUSTOMER_ORDER_STATUS[order.status] as any;
      entry.paymentStatus = CUSTOMER_PAYMENT_STATUS[order.paymentStatus] as any;
      if (order.expectedDeliveryDate) entry.deliveryDate = order.expectedDeliveryDate;
    }

    if (revenueDelta) {
      customer.totalRevenue = Math.max(round2((customer.totalRevenue || 0) + revenueDelta), 0);
    }

    // Payments and voided orders release consumed credit
    const creditRelease = paymentDelta + (revenueDelta < 0 ? -revenueDelta : 0);
    if (creditRelease > 0 && customer.creditStanding) {
      const limit = customer.creditStanding.limit || customer.creditLimit || 0;
      const used = Math.max(round2((customer.creditStanding.usedCredit || 0) - creditRelease), 0);
      customer.creditStanding.usedCredit = used;
      customer.creditStanding.availableCredit = Math.max(round2(limit - used), 0);
      const status = customer.creditStanding.status as string;
      if (used < limit * 0.9 && (status === "warning" || status === "credit_hold")) {
        customer.creditStanding.status = "good" as any;
      }
    }

    await customer.save();
  }

  private pushTimeline(order: ISalesOrder, status: SalesOrderStatus, userId: string, comment?: string) {
    order.status = status;
    order.statusTimeline.push({ status, timestamp: new Date(), updatedBy: new Types.ObjectId(userId), comment });
  }

  private async notifyOrder(companyId: string, order: ISalesOrder, title: string, message: string) {
    await notificationService.notifyUsers(companyId, [order.createdBy], title, message, "order_status", {
      link: `/app/sales/orders/${order._id}`,
    });
  }

  // ==========================================
  // QUOTATIONS
  // ==========================================

  async createQuotation(companyId: string, userId: string, input: CreateQuotationInput) {
    await this.loadCustomer(companyId, input.customerId);
    const priced = this.priceLines(input.items, input.shippingCost);

    const quotation = await Quotation.create({
      companyId: new Types.ObjectId(companyId),
      quotationNumber: await generateDocNumber(Quotation, companyId, "QT"),
      customerId: new Types.ObjectId(input.customerId),
      quotationDate: new Date(),
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      status: input.status || "Draft",
      ...priced,
      notes: input.notes,
      termsAndConditions: input.termsAndConditions,
      createdBy: new Types.ObjectId(userId),
    });

    await auditService.log({
      companyId,
      userId,
      action: "QUOTATION_CREATED",
      module: "sales",
      referenceId: quotation._id.toString(),
      after: { quotationNumber: quotation.quotationNumber, grandTotal: quotation.grandTotal },
    });

    return quotation;
  }

  async getQuotations(companyId: string, query: any) {
    const { page, limit, skip } = paginate(query);
    const filter: any = { companyId, isDeleted: { $ne: true } };
    if (query.status) filter.status = query.status;
    if (query.customerId) filter.customerId = query.customerId;
    const dateRange = buildDateRange(query.startDate, query.endDate);
    if (dateRange) filter.quotationDate = dateRange;
    if (query.search) {
      const rx = { $regex: escapeRegex(query.search), $options: "i" };
      filter.$or = [{ quotationNumber: rx }, { "items.itemName": rx }, { "items.sku": rx }];
    }

    // Lazily expire stale quotations so lists always reflect validity
    await Quotation.updateMany(
      { companyId, status: { $in: ["Draft", "Sent"] }, validUntil: { $lt: new Date() } },
      { status: "Expired" }
    );

    const [quotations, total] = await Promise.all([
      Quotation.find(filter)
        .populate("customerId", "name code email")
        .populate("salesOrderId", "orderNumber status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Quotation.countDocuments(filter),
    ]);

    return { success: true, data: quotations, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getQuotationById(companyId: string, id: string) {
    const quotation = await Quotation.findOne({ _id: id, companyId, isDeleted: { $ne: true } })
      .populate("customerId", "name code email phone billingAddress shippingAddress")
      .populate("salesOrderId", "orderNumber status")
      .populate("createdBy", "firstName lastName email");
    if (!quotation) throw notFound("Quotation");
    return quotation;
  }

  async updateQuotationStatus(companyId: string, userId: string, id: string, status: QuotationStatus) {
    const quotation = await Quotation.findOne({ _id: id, companyId, isDeleted: { $ne: true } });
    if (!quotation) throw notFound("Quotation");
    if (!QUOTATION_TRANSITIONS[quotation.status].includes(status)) {
      throw badRequest(`Cannot move quotation from '${quotation.status}' to '${status}'`);
    }

    const previous = quotation.status;
    quotation.status = status;
    await quotation.save();

    await auditService.log({
      companyId,
      userId,
      action: "QUOTATION_STATUS_UPDATED",
      module: "sales",
      referenceId: quotation._id.toString(),
      before: { status: previous },
      after: { status },
    });

    return quotation;
  }

  async convertQuotation(
    companyId: string,
    userId: string,
    id: string,
    input: { warehouseId: string; expectedDeliveryDate?: string; customerPoNumber?: string }
  ) {
    const quotation = await Quotation.findOne({ _id: id, companyId, isDeleted: { $ne: true } });
    if (!quotation) throw notFound("Quotation");
    if (!["Draft", "Sent", "Accepted"].includes(quotation.status)) {
      throw badRequest(`A ${quotation.status.toLowerCase()} quotation cannot be converted to a sales order`);
    }

    const order = await this.createSalesOrder(companyId, userId, {
      customerId: quotation.customerId.toString(),
      quotationId: quotation._id.toString(),
      warehouseId: input.warehouseId,
      expectedDeliveryDate: input.expectedDeliveryDate,
      customerPoNumber: input.customerPoNumber,
      shippingCost: quotation.shippingCost,
      notes: quotation.notes,
      items: quotation.items.map((item) => ({
        productId: item.productId?.toString(),
        itemName: item.itemName,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        taxRate: item.taxRate,
      })),
    });

    quotation.status = "Converted";
    quotation.salesOrderId = order._id as Types.ObjectId;
    await quotation.save();

    return { quotation, order };
  }

  // ==========================================
  // SALES ORDERS
  // ==========================================

  async createSalesOrder(companyId: string, userId: string, input: CreateSalesOrderInput) {
    const customer = await this.loadCustomer(companyId, input.customerId);
    const warehouse = await Warehouse.findOne({ _id: input.warehouseId, companyId, isDeleted: { $ne: true } });
    if (!warehouse) throw notFound("Warehouse");

    const priced = this.priceLines(input.items, input.shippingCost);
    const orderNumber = await generateDocNumber(SalesOrder, companyId, "SO");
    const shippingAddress = input.shippingAddress || (customer.shippingAddress as ISalesAddress) || (customer.billingAddress as ISalesAddress);

    const order = await SalesOrder.create({
      companyId: new Types.ObjectId(companyId),
      orderNumber,
      customerId: customer._id,
      quotationId: toId(input.quotationId),
      warehouseId: new Types.ObjectId(input.warehouseId),
      orderDate: new Date(),
      expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : undefined,
      customerPoNumber: input.customerPoNumber,
      status: "Pending Approval",
      ...priced,
      shippingAddress,
      paymentTerms: input.paymentTerms || customer.creditStanding?.paymentTerms || "Net 30",
      paymentStatus: "unpaid",
      notes: input.notes,
      statusTimeline: [
        { status: "Pending Approval", timestamp: new Date(), updatedBy: new Types.ObjectId(userId), comment: "Sales order created" },
      ],
      createdBy: new Types.ObjectId(userId),
    });

    await customerService.addCustomerOrder(companyId, customer._id.toString(), {
      orderNumber,
      totalAmount: order.grandTotal,
      status: "draft",
      paymentStatus: "pending",
      itemsCount: order.items.length,
      itemsSummary: order.items.map((i) => `${i.quantity} x ${i.itemName}`).join(", ").slice(0, 200),
      deliveryDate: input.expectedDeliveryDate,
    } as any);

    await auditService.log({
      companyId,
      userId,
      action: "SALES_ORDER_CREATED",
      module: "sales",
      referenceId: order._id.toString(),
      after: { orderNumber, customer: customer.name, grandTotal: order.grandTotal },
    });

    return order;
  }

  async getSalesOrders(companyId: string, query: any) {
    const { page, limit, skip } = paginate(query);
    const filter: any = { companyId, isDeleted: { $ne: true } };
    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.warehouseId) filter.warehouseId = query.warehouseId;
    const dateRange = buildDateRange(query.startDate, query.endDate);
    if (dateRange) filter.orderDate = dateRange;
    if (query.search) {
      const rx = { $regex: escapeRegex(query.search), $options: "i" };
      filter.$or = [{ orderNumber: rx }, { customerPoNumber: rx }, { "items.itemName": rx }, { "items.sku": rx }];
    }

    const sortField = ["orderDate", "grandTotal", "orderNumber", "expectedDeliveryDate"].includes(query.sortBy)
      ? query.sortBy
      : "orderDate";
    const sortDir = query.sortOrder === "asc" ? 1 : -1;

    const [orders, total] = await Promise.all([
      SalesOrder.find(filter)
        .select("-statusTimeline")
        .populate("customerId", "name code email")
        .populate("warehouseId", "name code")
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit),
      SalesOrder.countDocuments(filter),
    ]);

    return { success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getSalesOrderById(companyId: string, id: string) {
    const order = await SalesOrder.findOne({ _id: id, companyId, isDeleted: { $ne: true } })
      .populate("customerId", "name code email phone billingAddress shippingAddress creditStanding")
      .populate("warehouseId", "name code")
      .populate("quotationId", "quotationNumber")
      .populate("approvedBy", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("statusTimeline.updatedBy", "firstName lastName");
    if (!order) throw notFound("Sales order");

    const invoices = await SalesInvoice.find({ companyId, salesOrderId: order._id, isDeleted: { $ne: true } })
      .select("invoiceNumber invoiceDate dueDate grandTotal amountPaid balanceDue status")
      .sort({ createdAt: -1 });

    return { order, invoices };
  }

  async approveSalesOrder(companyId: string, userId: string, id: string, input: ApproveSalesOrderInput) {
    const order = await SalesOrder.findOne({ _id: id, companyId, isDeleted: { $ne: true } });
    if (!order) throw notFound("Sales order");
    if (order.status !== "Pending Approval") {
      throw badRequest(`Only orders pending approval can be reviewed (current status: '${order.status}')`);
    }

    order.approvedBy = new Types.ObjectId(userId);
    order.approvedAt = new Date();
    order.approvalNotes = input.approvalNotes;
    if (input.status === "Rejected") {
      order.rejectionReason = input.rejectionReason || "Rejected during order review";
    }
    this.pushTimeline(order, input.status, userId, input.status === "Rejected" ? order.rejectionReason : input.approvalNotes);
    await order.save();

    await this.syncCustomerOrder(companyId, order, 0, input.status === "Rejected" ? -order.grandTotal : 0);

    await auditService.log({
      companyId,
      userId,
      action: input.status === "Approved" ? "SALES_ORDER_APPROVED" : "SALES_ORDER_REJECTED",
      module: "sales",
      referenceId: order._id.toString(),
      before: { status: "Pending Approval" },
      after: { status: order.status, notes: input.approvalNotes, rejectionReason: order.rejectionReason },
    });

    await this.notifyOrder(
      companyId,
      order,
      `Sales order ${order.orderNumber} ${input.status.toLowerCase()}`,
      input.status === "Approved"
        ? `Sales order ${order.orderNumber} (${order.grandTotal.toFixed(2)}) was approved and can be fulfilled.`
        : `Sales order ${order.orderNumber} was rejected: ${order.rejectionReason}`
    );

    return order;
  }

  async updateSalesOrderStatus(companyId: string, userId: string, id: string, status: SalesOrderStatus, comment?: string) {
    const order = await SalesOrder.findOne({ _id: id, companyId, isDeleted: { $ne: true } });
    if (!order) throw notFound("Sales order");

    const allowed = ORDER_MANUAL_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      throw badRequest(`Cannot move sales order from '${order.status}' to '${status}'`);
    }
    if (status === "Cancelled" && order.amountInvoiced > 0) {
      const openInvoice = await SalesInvoice.exists({ companyId, salesOrderId: order._id, status: { $ne: "Cancelled" } });
      if (openInvoice) throw badRequest("Cancel the order's invoice before cancelling the order");
    }

    const previous = order.status;
    this.pushTimeline(order, status, userId, comment);
    await order.save();
    await this.syncCustomerOrder(companyId, order, 0, status === "Cancelled" ? -order.grandTotal : 0);

    await auditService.log({
      companyId,
      userId,
      action: "SALES_ORDER_STATUS_UPDATED",
      module: "sales",
      referenceId: order._id.toString(),
      before: { status: previous },
      after: { status, comment },
    });

    await this.notifyOrder(
      companyId,
      order,
      `Sales order ${order.orderNumber}: ${status}`,
      `Sales order ${order.orderNumber} moved from ${previous} to ${status}.${comment ? ` Note: ${comment}` : ""}`
    );

    return order;
  }

  /**
   * Called by the dispatch module after goods for an order are shipped, delivered or returned.
   * Positive quantities ship goods, negative quantities (returns) take them back off the order.
   * Recomputes dispatched quantities and moves the order through its fulfilment statuses.
   */
  async applyDispatchProgress(
    companyId: string,
    userId: string,
    salesOrderId: string,
    shipped: Array<{ sku: string; quantity: number }>,
    allDelivered: boolean
  ) {
    const order = await SalesOrder.findOne({ _id: salesOrderId, companyId, isDeleted: { $ne: true } });
    if (!order) return null;
    if (order.status === "Cancelled" || order.status === "Rejected") return order;

    shipped.forEach(({ sku, quantity }) => {
      let remaining = Math.abs(quantity);
      const lines = order.items.filter((item) => item.sku === sku.toUpperCase());
      lines.forEach((item) => {
        if (remaining <= 0) return;
        const dispatched = item.quantityDispatched || 0;
        const applied = quantity > 0 ? Math.min(item.quantity - dispatched, remaining) : Math.min(dispatched, remaining);
        item.quantityDispatched = round2(dispatched + (quantity > 0 ? applied : -applied));
        remaining -= applied;
      });
    });

    const fullyDispatched = order.items.every((item) => (item.quantityDispatched || 0) >= item.quantity);
    const anyDispatched = order.items.some((item) => (item.quantityDispatched || 0) > 0);

    let nextStatus: SalesOrderStatus = order.status;
    if (fullyDispatched && allDelivered) nextStatus = "Delivered";
    else if (fullyDispatched) nextStatus = "Dispatched";
    else if (anyDispatched) nextStatus = "Partially Dispatched";
    else if (["Partially Dispatched", "Dispatched", "Delivered"].includes(order.status)) nextStatus = "Processing";

    if (nextStatus !== order.status) {
      const previous = order.status;
      this.pushTimeline(order, nextStatus, userId, "Updated from dispatch");
      await order.save();
      await this.syncCustomerOrder(companyId, order);
      await this.notifyOrder(
        companyId,
        order,
        `Sales order ${order.orderNumber}: ${nextStatus}`,
        `Sales order ${order.orderNumber} moved from ${previous} to ${nextStatus}.`
      );
    } else {
      await order.save();
    }

    return order;
  }

  // ==========================================
  // INVOICES & PAYMENTS
  // ==========================================

  private invoiceStatusFor(invoice: ISalesInvoice) {
    if (invoice.status === "Cancelled") return "Cancelled";
    if (invoice.balanceDue <= 0) return "Paid";
    if (invoice.dueDate < new Date()) return "Overdue";
    return invoice.amountPaid > 0 ? "Partially Paid" : "Unpaid";
  }

  async markOverdueInvoices(companyId?: string) {
    const filter: any = {
      status: { $in: ["Unpaid", "Partially Paid"] },
      dueDate: { $lt: new Date() },
      balanceDue: { $gt: 0 },
      isDeleted: { $ne: true },
    };
    if (companyId) filter.companyId = companyId;
    const result = await SalesInvoice.updateMany(filter, { status: "Overdue" });
    return result.modifiedCount;
  }

  async createInvoice(companyId: string, userId: string, input: CreateInvoiceInput) {
    const order = await SalesOrder.findOne({ _id: input.salesOrderId, companyId, isDeleted: { $ne: true } });
    if (!order) throw notFound("Sales order");
    if (["Pending Approval", "Rejected", "Cancelled"].includes(order.status)) {
      throw badRequest(`Cannot invoice a sales order in '${order.status}' status`);
    }

    const existing = await SalesInvoice.findOne({ companyId, salesOrderId: order._id, status: { $ne: "Cancelled" }, isDeleted: { $ne: true } });
    if (existing) {
      throw new HttpError(409, `Sales order ${order.orderNumber} is already invoiced (${existing.invoiceNumber})`);
    }

    // Default due date follows "Net N" payment terms
    let dueDate = input.dueDate ? new Date(input.dueDate) : undefined;
    if (!dueDate) {
      const days = Number((order.paymentTerms || "").match(/\d+/)?.[0] || 30);
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);
    }

    const invoice = await SalesInvoice.create({
      companyId: new Types.ObjectId(companyId),
      invoiceNumber: await generateDocNumber(SalesInvoice, companyId, "INV"),
      salesOrderId: order._id,
      customerId: order.customerId,
      invoiceDate: new Date(),
      dueDate,
      items: order.items.map((item) => item.toObject()),
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      taxTotal: order.taxTotal,
      shippingCost: order.shippingCost,
      grandTotal: order.grandTotal,
      amountPaid: 0,
      balanceDue: order.grandTotal,
      status: "Unpaid",
      notes: input.notes,
      createdBy: new Types.ObjectId(userId),
    });

    order.amountInvoiced = order.grandTotal;
    await order.save();

    await auditService.log({
      companyId,
      userId,
      action: "SALES_INVOICE_CREATED",
      module: "sales",
      referenceId: invoice._id.toString(),
      after: { invoiceNumber: invoice.invoiceNumber, orderNumber: order.orderNumber, grandTotal: invoice.grandTotal },
    });

    return invoice;
  }

  async getInvoices(companyId: string, query: any) {
    await this.markOverdueInvoices(companyId);

    const { page, limit, skip } = paginate(query);
    const filter: any = { companyId, isDeleted: { $ne: true } };
    if (query.status) filter.status = query.status;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.salesOrderId) filter.salesOrderId = query.salesOrderId;
    const dateRange = buildDateRange(query.startDate, query.endDate);
    if (dateRange) filter.invoiceDate = dateRange;
    if (query.search) {
      filter.invoiceNumber = { $regex: escapeRegex(query.search), $options: "i" };
    }

    const [invoices, total] = await Promise.all([
      SalesInvoice.find(filter)
        .select("-items")
        .populate("customerId", "name code email")
        .populate("salesOrderId", "orderNumber status")
        .sort({ invoiceDate: -1 })
        .skip(skip)
        .limit(limit),
      SalesInvoice.countDocuments(filter),
    ]);

    return { success: true, data: invoices, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getInvoiceById(companyId: string, id: string) {
    const invoice = await SalesInvoice.findOne({ _id: id, companyId, isDeleted: { $ne: true } })
      .populate("customerId", "name code email phone billingAddress")
      .populate("salesOrderId", "orderNumber status paymentTerms")
      .populate("payments.recordedBy", "firstName lastName");
    if (!invoice) throw notFound("Invoice");
    return invoice;
  }

  async recordPayment(companyId: string, userId: string, invoiceId: string, input: RecordPaymentInput) {
    const invoice = await SalesInvoice.findOne({ _id: invoiceId, companyId, isDeleted: { $ne: true } });
    if (!invoice) throw notFound("Invoice");
    if (invoice.status === "Cancelled") throw badRequest("Cannot record a payment against a cancelled invoice");

    const amount = round2(input.amount);
    if (amount > invoice.balanceDue + 0.001) {
      throw badRequest(`Payment of ${amount.toFixed(2)} exceeds the balance due of ${invoice.balanceDue.toFixed(2)}`);
    }

    invoice.payments.push({
      amount,
      paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
      method: input.method || "bank_transfer",
      reference: input.reference,
      notes: input.notes,
      recordedBy: new Types.ObjectId(userId),
    });
    invoice.amountPaid = round2(invoice.amountPaid + amount);
    invoice.balanceDue = round2(Math.max(invoice.grandTotal - invoice.amountPaid, 0));
    invoice.status = this.invoiceStatusFor(invoice);
    await invoice.save();

    const order = await SalesOrder.findOne({ _id: invoice.salesOrderId, companyId });
    if (order) {
      order.amountPaid = round2(order.amountPaid + amount);
      order.paymentStatus = order.amountPaid >= order.grandTotal ? "paid" : "partially_paid";
      await order.save();
      await this.syncCustomerOrder(companyId, order, amount);
      await this.notifyOrder(
        companyId,
        order,
        `Payment received for ${invoice.invoiceNumber}`,
        `${amount.toFixed(2)} received against invoice ${invoice.invoiceNumber}. Balance due: ${invoice.balanceDue.toFixed(2)}.`
      );
    }

    await auditService.log({
      companyId,
      userId,
      action: "SALES_PAYMENT_RECORDED",
      module: "sales",
      referenceId: invoice._id.toString(),
      after: { invoiceNumber: invoice.invoiceNumber, amount, method: input.method, balanceDue: invoice.balanceDue },
    });

    return invoice;
  }

  async cancelInvoice(companyId: string, userId: string, invoiceId: string) {
    const invoice = await SalesInvoice.findOne({ _id: invoiceId, companyId, isDeleted: { $ne: true } });
    if (!invoice) throw notFound("Invoice");
    if (invoice.amountPaid > 0) throw badRequest("Invoices with recorded payments cannot be cancelled");
    if (invoice.status === "Cancelled") return invoice;

    invoice.status = "Cancelled";
    await invoice.save();
    await SalesOrder.updateOne({ _id: invoice.salesOrderId, companyId }, { $set: { amountInvoiced: 0 } });

    await auditService.log({
      companyId,
      userId,
      action: "SALES_INVOICE_CANCELLED",
      module: "sales",
      referenceId: invoice._id.toString(),
      after: { invoiceNumber: invoice.invoiceNumber },
    });

    return invoice;
  }

  // ==========================================
  // SALES HISTORY
  // ==========================================

  async getSalesHistory(companyId: string, query: { customerId?: string; startDate?: string; endDate?: string; limit?: any }) {
    const limit = Math.min(Number(query.limit) || 100, 500);
    const base: any = { companyId, isDeleted: { $ne: true } };
    if (query.customerId) base.customerId = query.customerId;
    const dateRange = buildDateRange(query.startDate, query.endDate);

    const [quotations, orders, invoices] = await Promise.all([
      Quotation.find({ ...base, ...(dateRange ? { quotationDate: dateRange } : {}) })
        .select("quotationNumber quotationDate grandTotal status customerId")
        .populate("customerId", "name code")
        .sort({ quotationDate: -1 })
        .limit(limit),
      SalesOrder.find({ ...base, ...(dateRange ? { orderDate: dateRange } : {}) })
        .select("orderNumber orderDate grandTotal status paymentStatus customerId")
        .populate("customerId", "name code")
        .sort({ orderDate: -1 })
        .limit(limit),
      SalesInvoice.find({ ...base, ...(dateRange ? { invoiceDate: dateRange } : {}) })
        .select("invoiceNumber invoiceDate grandTotal status customerId payments")
        .populate("customerId", "name code")
        .sort({ invoiceDate: -1 })
        .limit(limit),
    ]);

    const customerName = (c: any) => (c && typeof c === "object" ? c.name : undefined);
    const events: any[] = [];

    quotations.forEach((q) =>
      events.push({ type: "quotation", id: q._id, number: q.quotationNumber, date: q.quotationDate, amount: q.grandTotal, status: q.status, customer: customerName(q.customerId), link: "/app/sales/quotations" })
    );
    orders.forEach((o) =>
      events.push({ type: "order", id: o._id, number: o.orderNumber, date: o.orderDate, amount: o.grandTotal, status: o.status, customer: customerName(o.customerId), link: `/app/sales/orders/${o._id}` })
    );
    invoices.forEach((inv) => {
      events.push({ type: "invoice", id: inv._id, number: inv.invoiceNumber, date: inv.invoiceDate, amount: inv.grandTotal, status: inv.status, customer: customerName(inv.customerId), link: "/app/sales/invoices" });
      inv.payments.forEach((p) =>
        events.push({ type: "payment", id: p._id, number: inv.invoiceNumber, date: p.paymentDate, amount: p.amount, status: p.method, customer: customerName(inv.customerId), link: "/app/sales/invoices" })
      );
    });

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { success: true, data: events.slice(0, limit) };
  }

  // ==========================================
  // SALES REPORTS
  // ==========================================

  async getReports(companyId: string, query: { startDate?: string; endDate?: string } = {}) {
    await this.markOverdueInvoices(companyId);

    const companyObjectId = new Types.ObjectId(companyId);
    const orderMatch: any = { companyId: companyObjectId, isDeleted: { $ne: true } };
    const invoiceMatch: any = { companyId: companyObjectId, isDeleted: { $ne: true }, status: { $ne: "Cancelled" } };
    const dateRange = buildDateRange(query.startDate, query.endDate);
    if (dateRange) {
      orderMatch.orderDate = dateRange;
      invoiceMatch.invoiceDate = dateRange;
    }
    const activeOrderMatch = { ...orderMatch, status: { $nin: ["Rejected", "Cancelled"] } };

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [statusAgg, orderTotals, invoiceTotals, monthly, topCustomers, topProducts, quotationAgg] = await Promise.all([
      SalesOrder.aggregate([{ $match: orderMatch }, { $group: { _id: "$status", count: { $sum: 1 }, value: { $sum: "$grandTotal" } } }]),
      SalesOrder.aggregate([
        { $match: activeOrderMatch },
        { $group: { _id: null, count: { $sum: 1 }, value: { $sum: "$grandTotal" } } },
      ]),
      SalesInvoice.aggregate([
        { $match: invoiceMatch },
        {
          $group: {
            _id: null,
            invoiced: { $sum: "$grandTotal" },
            collected: { $sum: "$amountPaid" },
            outstanding: { $sum: "$balanceDue" },
            overdue: { $sum: { $cond: [{ $eq: ["$status", "Overdue"] }, "$balanceDue", 0] } },
            overdueCount: { $sum: { $cond: [{ $eq: ["$status", "Overdue"] }, 1, 0] } },
          },
        },
      ]),
      SalesInvoice.aggregate([
        { $match: { companyId: companyObjectId, isDeleted: { $ne: true }, status: { $ne: "Cancelled" }, invoiceDate: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: "$invoiceDate" }, month: { $month: "$invoiceDate" } },
            revenue: { $sum: "$grandTotal" },
            collected: { $sum: "$amountPaid" },
          },
        },
      ]),
      SalesOrder.aggregate([
        { $match: activeOrderMatch },
        { $group: { _id: "$customerId", orders: { $sum: 1 }, value: { $sum: "$grandTotal" } } },
        { $sort: { value: -1 } },
        { $limit: 5 },
        { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        { $project: { orders: 1, value: 1, name: "$customer.name", code: "$customer.code" } },
      ]),
      SalesOrder.aggregate([
        { $match: activeOrderMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.sku",
            itemName: { $first: "$items.itemName" },
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.lineTotal" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      Quotation.aggregate([
        { $match: { companyId: companyObjectId, isDeleted: { $ne: true } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const byStatus: Record<string, number> = {};
    statusAgg.forEach((s: any) => (byStatus[s._id] = s.count));
    const orders = orderTotals[0] || { count: 0, value: 0 };
    const inv = invoiceTotals[0] || { invoiced: 0, collected: 0, outstanding: 0, overdue: 0, overdueCount: 0 };

    const quotationsByStatus: Record<string, number> = {};
    quotationAgg.forEach((q: any) => (quotationsByStatus[q._id] = q.count));
    const totalQuotes = Object.values(quotationsByStatus).reduce((a, b) => a + b, 0);

    const monthlyRevenue: Array<{ label: string; value: number; collected: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const found = monthly.find((m: any) => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1);
      monthlyRevenue.push({
        label: d.toLocaleString("en-US", { month: "short" }),
        value: found ? round2(found.revenue) : 0,
        collected: found ? round2(found.collected) : 0,
      });
    }

    return {
      success: true,
      data: {
        totalOrders: orders.count,
        totalOrderValue: round2(orders.value),
        averageOrderValue: orders.count ? round2(orders.value / orders.count) : 0,
        byStatus,
        pendingApproval: byStatus["Pending Approval"] || 0,
        totalInvoiced: round2(inv.invoiced),
        totalCollected: round2(inv.collected),
        outstandingReceivables: round2(inv.outstanding),
        overdueAmount: round2(inv.overdue),
        overdueInvoices: inv.overdueCount,
        quotationsByStatus,
        quotationConversionRate: totalQuotes ? round2(((quotationsByStatus["Converted"] || 0) / totalQuotes) * 100) : 0,
        monthlyRevenue,
        topCustomers: topCustomers.map((c: any) => ({ customerId: c._id, name: c.name || "Unknown", code: c.code, orders: c.orders, value: round2(c.value) })),
        topProducts: topProducts.map((p: any) => ({ sku: p._id, itemName: p.itemName, quantity: p.quantity, revenue: round2(p.revenue) })),
      },
    };
  }
}

export const salesService = new SalesService();
export default salesService;
