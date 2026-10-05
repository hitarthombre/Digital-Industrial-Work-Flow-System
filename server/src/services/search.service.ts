import { Model } from "mongoose";
import { Product } from "../models/Product";
import { Customer } from "../models/Customer";
import { Supplier } from "../models/Supplier";
import { Warehouse } from "../models/Warehouse";
import { Factory } from "../models/Factory";
import { Inventory } from "../models/Inventory";
import { PurchaseOrder } from "../models/PurchaseOrder";
import { PurchaseRequest } from "../models/PurchaseRequest";
import { WorkOrder } from "../models/WorkOrder";
import { SalesOrder } from "../models/SalesOrder";
import { Quotation } from "../models/Quotation";
import { SalesInvoice } from "../models/SalesInvoice";
import { DispatchOrder } from "../models/DispatchOrder";
import { DocumentModel } from "../models/Document";
import { escapeRegex } from "../utils/docNumber";

export interface SearchHit {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  link: string;
}

interface SearchSource {
  type: string;
  label: string;
  permission: string;
  model: Model<any>;
  fields: string[];
  select: string;
  softDelete: boolean;
  toHit: (doc: any) => SearchHit;
}

const SOURCES: SearchSource[] = [
  {
    type: "product",
    label: "Products",
    permission: "products:read",
    model: Product,
    fields: ["name", "sku", "barcode", "categoryName"],
    select: "name sku status categoryName",
    softDelete: true,
    toHit: (d) => ({ type: "product", id: String(d._id), title: d.name, subtitle: d.sku, status: d.status, link: `/app/products/${d._id}` }),
  },
  {
    type: "inventory",
    label: "Stock Items",
    permission: "inventory:read",
    model: Inventory,
    fields: ["itemName", "sku"],
    select: "itemName sku quantity unit status",
    softDelete: false,
    toHit: (d) => ({ type: "inventory", id: String(d._id), title: d.itemName, subtitle: `${d.sku} - ${d.quantity} ${d.unit}`, status: d.status, link: "/app/inventory" }),
  },
  {
    type: "customer",
    label: "Customers",
    permission: "sales:read",
    model: Customer,
    fields: ["name", "code", "email", "companyName"],
    select: "name code email status",
    softDelete: true,
    toHit: (d) => ({ type: "customer", id: String(d._id), title: d.name, subtitle: d.code, status: d.status, link: `/app/customers/${d._id}` }),
  },
  {
    type: "supplier",
    label: "Suppliers",
    permission: "procurement:read",
    model: Supplier,
    fields: ["name", "code", "email", "contactPerson"],
    select: "name code status",
    softDelete: true,
    toHit: (d) => ({ type: "supplier", id: String(d._id), title: d.name, subtitle: d.code, status: d.status, link: `/app/suppliers/${d._id}` }),
  },
  {
    type: "warehouse",
    label: "Warehouses",
    permission: "warehouses:read",
    model: Warehouse,
    fields: ["name", "code", "location.city"],
    select: "name code status",
    softDelete: true,
    toHit: (d) => ({ type: "warehouse", id: String(d._id), title: d.name, subtitle: d.code, status: d.status, link: `/app/warehouses/${d._id}` }),
  },
  {
    type: "factory",
    label: "Factories",
    permission: "factories:read",
    model: Factory,
    fields: ["name", "code", "location.city"],
    select: "name code status",
    softDelete: true,
    toHit: (d) => ({ type: "factory", id: String(d._id), title: d.name, subtitle: d.code, status: d.status, link: `/app/factories/${d._id}` }),
  },
  {
    type: "purchase_order",
    label: "Purchase Orders",
    permission: "procurement:read",
    model: PurchaseOrder,
    fields: ["poNumber", "items.itemName", "items.sku"],
    select: "poNumber status grandTotal",
    softDelete: true,
    toHit: (d) => ({ type: "purchase_order", id: String(d._id), title: d.poNumber, subtitle: `Total ${d.grandTotal}`, status: d.status, link: `/app/procurement/orders/${d._id}` }),
  },
  {
    type: "purchase_request",
    label: "Purchase Requests",
    permission: "procurement:read",
    model: PurchaseRequest,
    fields: ["requestNumber", "department", "items.itemName"],
    select: "requestNumber status department",
    softDelete: true,
    toHit: (d) => ({ type: "purchase_request", id: String(d._id), title: d.requestNumber, subtitle: d.department, status: d.status, link: "/app/procurement/requests" }),
  },
  {
    type: "work_order",
    label: "Work Orders",
    permission: "production:read",
    model: WorkOrder,
    fields: ["workOrderNumber", "itemName", "sku"],
    select: "workOrderNumber itemName status",
    softDelete: true,
    toHit: (d) => ({ type: "work_order", id: String(d._id), title: d.workOrderNumber, subtitle: d.itemName, status: d.status, link: `/app/production/work-orders/${d._id}` }),
  },
  {
    type: "quotation",
    label: "Quotations",
    permission: "sales:read",
    model: Quotation,
    fields: ["quotationNumber", "items.itemName"],
    select: "quotationNumber status grandTotal",
    softDelete: true,
    toHit: (d) => ({ type: "quotation", id: String(d._id), title: d.quotationNumber, subtitle: `Total ${d.grandTotal}`, status: d.status, link: "/app/sales/quotations" }),
  },
  {
    type: "sales_order",
    label: "Sales Orders",
    permission: "sales:read",
    model: SalesOrder,
    fields: ["orderNumber", "customerPoNumber", "items.itemName", "items.sku"],
    select: "orderNumber status grandTotal",
    softDelete: true,
    toHit: (d) => ({ type: "sales_order", id: String(d._id), title: d.orderNumber, subtitle: `Total ${d.grandTotal}`, status: d.status, link: `/app/sales/orders/${d._id}` }),
  },
  {
    type: "invoice",
    label: "Invoices",
    permission: "sales:read",
    model: SalesInvoice,
    fields: ["invoiceNumber"],
    select: "invoiceNumber status balanceDue",
    softDelete: true,
    toHit: (d) => ({ type: "invoice", id: String(d._id), title: d.invoiceNumber, subtitle: `Balance ${d.balanceDue}`, status: d.status, link: "/app/sales/invoices" }),
  },
  {
    type: "dispatch",
    label: "Dispatches",
    permission: "dispatch:read",
    model: DispatchOrder,
    fields: ["dispatchNumber", "transport.trackingNumber", "transport.vehicleNumber"],
    select: "dispatchNumber status transport.trackingNumber",
    softDelete: true,
    toHit: (d) => ({ type: "dispatch", id: String(d._id), title: d.dispatchNumber, subtitle: d.transport?.trackingNumber, status: d.status, link: `/app/dispatch/${d._id}` }),
  },
  {
    type: "document",
    label: "Documents",
    permission: "documents:read",
    model: DocumentModel,
    fields: ["title", "fileName", "tags", "documentNumber"],
    select: "title fileName category",
    softDelete: true,
    toHit: (d) => ({ type: "document", id: String(d._id), title: d.title, subtitle: d.fileName, status: d.category, link: `/app/documents?open=${d._id}` }),
  },
];

export class SearchService {
  /**
   * Company-scoped search across every module the caller is allowed to read.
   */
  async globalSearch(companyId: string, term: string, opts: { permissions: string[]; isAdmin: boolean; limit?: number; types?: string[] }) {
    const q = term.trim();
    if (q.length < 2) return { query: q, total: 0, groups: [] };

    const perGroup = Math.min(Math.max(opts.limit || 5, 1), 20);
    const rx = { $regex: escapeRegex(q), $options: "i" };

    const sources = SOURCES.filter(
      (s) => (opts.isAdmin || opts.permissions.includes(s.permission)) && (!opts.types || opts.types.includes(s.type))
    );

    const results = await Promise.all(
      sources.map(async (source) => {
        const filter: any = { companyId, $or: source.fields.map((f) => ({ [f]: rx })) };
        if (source.softDelete) filter.isDeleted = { $ne: true };
        const docs = await source.model.find(filter).select(source.select).limit(perGroup).lean();
        return { type: source.type, label: source.label, items: docs.map(source.toHit) };
      })
    );

    const groups = results.filter((g) => g.items.length > 0);
    return { query: q, total: groups.reduce((s, g) => s + g.items.length, 0), groups };
  }
}

export const searchService = new SearchService();
export default searchService;
