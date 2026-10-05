import { Types } from "mongoose";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Inventory } from "../models/Inventory";
import { PurchaseOrder } from "../models/PurchaseOrder";
import { WorkOrder } from "../models/WorkOrder";
import { SalesOrder } from "../models/SalesOrder";
import { SalesInvoice } from "../models/SalesInvoice";
import { DispatchOrder } from "../models/DispatchOrder";
import { Supplier } from "../models/Supplier";
import { Customer } from "../models/Customer";
import { Company } from "../models/Company";
import { badRequest } from "../utils/httpError";
import { round2, buildDateRange } from "../utils/docNumber";

export const REPORT_TYPES = ["inventory", "purchase", "production", "sales", "dispatch", "supplier", "customer"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export type ColumnFormat = "text" | "number" | "currency" | "date" | "percent";

export interface ReportColumn {
  key: string;
  label: string;
  format?: ColumnFormat;
  width?: number;
}

export interface ReportResult {
  type: ReportType;
  title: string;
  description: string;
  generatedAt: string;
  filters: Record<string, string>;
  columns: ReportColumn[];
  rows: Array<Record<string, any>>;
  summary: Array<{ label: string; value: number | string; format?: ColumnFormat }>;
}

export interface ReportQuery {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  status?: string;
  category?: string;
}

const REPORT_META: Record<ReportType, { title: string; description: string }> = {
  inventory: { title: "Inventory Report", description: "Stock on hand, valuation and stock health by warehouse" },
  purchase: { title: "Purchase Report", description: "Purchase orders, spend and receipt progress" },
  production: { title: "Production Report", description: "Work order output, scrap and material cost" },
  sales: { title: "Sales Report", description: "Sales orders, revenue and payment collection" },
  dispatch: { title: "Dispatch Report", description: "Shipments, carriers and delivery performance" },
  supplier: { title: "Supplier Report", description: "Supplier purchase volume and order activity" },
  customer: { title: "Customer Report", description: "Customer order value, invoicing and receivables" },
};

const nameOf = (ref: any, fallback = "-") => (ref && typeof ref === "object" && ref.name ? ref.name : fallback);

export class ReportService {
  async generate(companyId: string, type: string, query: ReportQuery = {}): Promise<ReportResult> {
    if (!REPORT_TYPES.includes(type as ReportType)) {
      throw badRequest(`Unknown report type '${type}'. Available: ${REPORT_TYPES.join(", ")}`);
    }
    const reportType = type as ReportType;
    const companyObjectId = new Types.ObjectId(companyId);
    const dateRange = buildDateRange(query.startDate, query.endDate);

    const base = await this.build(reportType, companyId, companyObjectId, dateRange, query);

    const filters: Record<string, string> = {};
    if (query.startDate) filters["From"] = query.startDate;
    if (query.endDate) filters["To"] = query.endDate;
    if (query.status) filters["Status"] = query.status;
    if (query.category) filters["Category"] = query.category;

    return {
      type: reportType,
      ...REPORT_META[reportType],
      generatedAt: new Date().toISOString(),
      filters,
      ...base,
    };
  }

  private async build(
    type: ReportType,
    companyId: string,
    companyObjectId: Types.ObjectId,
    dateRange: Record<string, Date> | undefined,
    query: ReportQuery
  ): Promise<Pick<ReportResult, "columns" | "rows" | "summary">> {
    switch (type) {
      case "inventory": {
        const filter: any = { companyId };
        if (query.warehouseId) filter.warehouseId = query.warehouseId;
        if (query.status) filter.status = query.status;
        if (query.category) filter.itemCategory = query.category;
        const items = await Inventory.find(filter).populate("warehouseId", "name").sort({ itemName: 1 }).lean();
        const rows = items.map((i: any) => ({
          sku: i.sku,
          itemName: i.itemName,
          category: i.itemCategory,
          warehouse: nameOf(i.warehouseId),
          quantity: i.quantity,
          unit: i.unit,
          unitCost: i.unitCost,
          totalValue: i.totalValue,
          minThreshold: i.minThreshold,
          status: i.status,
        }));
        return {
          columns: [
            { key: "sku", label: "SKU", width: 14 },
            { key: "itemName", label: "Item", width: 26 },
            { key: "category", label: "Category", width: 14 },
            { key: "warehouse", label: "Warehouse", width: 20 },
            { key: "quantity", label: "Qty", format: "number", width: 10 },
            { key: "unit", label: "Unit", width: 8 },
            { key: "unitCost", label: "Unit Cost", format: "currency", width: 12 },
            { key: "totalValue", label: "Value", format: "currency", width: 14 },
            { key: "minThreshold", label: "Min", format: "number", width: 8 },
            { key: "status", label: "Status", width: 12 },
          ],
          rows,
          summary: [
            { label: "Stock lines", value: rows.length, format: "number" },
            { label: "Total stock value", value: round2(rows.reduce((s, r) => s + (r.totalValue || 0), 0)), format: "currency" },
            { label: "Low / out of stock", value: rows.filter((r) => r.status === "low_stock" || r.status === "out_of_stock").length, format: "number" },
          ],
        };
      }

      case "purchase": {
        const filter: any = { companyId, isDeleted: { $ne: true } };
        if (dateRange) filter.orderDate = dateRange;
        if (query.status) filter.status = query.status;
        if (query.warehouseId) filter.warehouseId = query.warehouseId;
        const orders = await PurchaseOrder.find(filter)
          .populate("supplierId", "name")
          .populate("warehouseId", "name")
          .sort({ orderDate: -1 })
          .lean();
        const rows = orders.map((po: any) => {
          const ordered = po.items.reduce((s: number, i: any) => s + i.quantityOrdered, 0);
          const received = po.items.reduce((s: number, i: any) => s + (i.quantityReceived || 0), 0);
          return {
            poNumber: po.poNumber,
            orderDate: po.orderDate,
            supplier: nameOf(po.supplierId),
            warehouse: nameOf(po.warehouseId),
            status: po.status,
            items: po.items.length,
            receivedPercent: ordered ? round2((received / ordered) * 100) : 0,
            grandTotal: po.grandTotal,
          };
        });
        const active = rows.filter((r) => r.status !== "Cancelled");
        return {
          columns: [
            { key: "poNumber", label: "PO #", width: 16 },
            { key: "orderDate", label: "Order Date", format: "date", width: 12 },
            { key: "supplier", label: "Supplier", width: 24 },
            { key: "warehouse", label: "Warehouse", width: 20 },
            { key: "status", label: "Status", width: 16 },
            { key: "items", label: "Lines", format: "number", width: 8 },
            { key: "receivedPercent", label: "Received", format: "percent", width: 10 },
            { key: "grandTotal", label: "Total", format: "currency", width: 14 },
          ],
          rows,
          summary: [
            { label: "Purchase orders", value: rows.length, format: "number" },
            { label: "Total spend", value: round2(active.reduce((s, r) => s + r.grandTotal, 0)), format: "currency" },
            { label: "Open orders", value: rows.filter((r) => !["Closed", "Cancelled", "Goods Received"].includes(r.status)).length, format: "number" },
          ],
        };
      }

      case "production": {
        const filter: any = { companyId, isDeleted: { $ne: true } };
        if (dateRange) filter.createdAt = dateRange;
        if (query.status) filter.status = query.status;
        if (query.warehouseId) filter.warehouseId = query.warehouseId;
        const workOrders = await WorkOrder.find(filter).populate("factoryId", "name").sort({ createdAt: -1 }).lean();
        const rows = workOrders.map((wo: any) => ({
          workOrderNumber: wo.workOrderNumber,
          createdAt: wo.createdAt,
          itemName: wo.itemName,
          sku: wo.sku,
          factory: nameOf(wo.factoryId),
          plannedQuantity: wo.plannedQuantity,
          producedQuantity: wo.producedQuantity,
          scrapQuantity: wo.scrapQuantity,
          completion: wo.plannedQuantity ? round2((wo.producedQuantity / wo.plannedQuantity) * 100) : 0,
          materialCost: wo.materialCost,
          status: wo.status,
        }));
        const produced = rows.reduce((s, r) => s + r.producedQuantity, 0);
        const scrap = rows.reduce((s, r) => s + r.scrapQuantity, 0);
        return {
          columns: [
            { key: "workOrderNumber", label: "WO #", width: 16 },
            { key: "createdAt", label: "Created", format: "date", width: 12 },
            { key: "itemName", label: "Product", width: 24 },
            { key: "sku", label: "SKU", width: 14 },
            { key: "factory", label: "Factory", width: 18 },
            { key: "plannedQuantity", label: "Planned", format: "number", width: 10 },
            { key: "producedQuantity", label: "Produced", format: "number", width: 10 },
            { key: "scrapQuantity", label: "Scrap", format: "number", width: 8 },
            { key: "completion", label: "Done", format: "percent", width: 8 },
            { key: "materialCost", label: "Material Cost", format: "currency", width: 14 },
            { key: "status", label: "Status", width: 12 },
          ],
          rows,
          summary: [
            { label: "Work orders", value: rows.length, format: "number" },
            { label: "Units produced", value: produced, format: "number" },
            { label: "Scrap rate", value: produced + scrap ? round2((scrap / (produced + scrap)) * 100) : 0, format: "percent" },
            { label: "Material cost", value: round2(rows.reduce((s, r) => s + r.materialCost, 0)), format: "currency" },
          ],
        };
      }

      case "sales": {
        const filter: any = { companyId, isDeleted: { $ne: true } };
        if (dateRange) filter.orderDate = dateRange;
        if (query.status) filter.status = query.status;
        if (query.warehouseId) filter.warehouseId = query.warehouseId;
        const orders = await SalesOrder.find(filter).populate("customerId", "name").sort({ orderDate: -1 }).lean();
        const rows = orders.map((so: any) => ({
          orderNumber: so.orderNumber,
          orderDate: so.orderDate,
          customer: nameOf(so.customerId),
          status: so.status,
          paymentStatus: so.paymentStatus,
          items: so.items.length,
          grandTotal: so.grandTotal,
          amountPaid: so.amountPaid,
          balance: round2(so.grandTotal - so.amountPaid),
        }));
        const active = rows.filter((r) => !["Rejected", "Cancelled"].includes(r.status));
        return {
          columns: [
            { key: "orderNumber", label: "SO #", width: 16 },
            { key: "orderDate", label: "Order Date", format: "date", width: 12 },
            { key: "customer", label: "Customer", width: 24 },
            { key: "status", label: "Status", width: 18 },
            { key: "paymentStatus", label: "Payment", width: 14 },
            { key: "items", label: "Lines", format: "number", width: 8 },
            { key: "grandTotal", label: "Total", format: "currency", width: 14 },
            { key: "amountPaid", label: "Paid", format: "currency", width: 14 },
            { key: "balance", label: "Balance", format: "currency", width: 14 },
          ],
          rows,
          summary: [
            { label: "Sales orders", value: rows.length, format: "number" },
            { label: "Order value", value: round2(active.reduce((s, r) => s + r.grandTotal, 0)), format: "currency" },
            { label: "Collected", value: round2(active.reduce((s, r) => s + r.amountPaid, 0)), format: "currency" },
            { label: "Outstanding", value: round2(active.reduce((s, r) => s + r.balance, 0)), format: "currency" },
          ],
        };
      }

      case "dispatch": {
        const filter: any = { companyId, isDeleted: { $ne: true } };
        if (dateRange) filter.createdAt = dateRange;
        if (query.status) filter.status = query.status;
        if (query.warehouseId) filter.warehouseId = query.warehouseId;
        const dispatches = await DispatchOrder.find(filter)
          .populate("customerId", "name")
          .populate("warehouseId", "name")
          .sort({ createdAt: -1 })
          .lean();
        const rows = dispatches.map((d: any) => {
          const onTime =
            d.status === "Delivered" && d.deliveredAt
              ? !d.estimatedDeliveryDate || new Date(d.deliveredAt) <= new Date(d.estimatedDeliveryDate)
                ? "Yes"
                : "No"
              : "-";
          return {
            dispatchNumber: d.dispatchNumber,
            createdAt: d.createdAt,
            customer: nameOf(d.customerId),
            warehouse: nameOf(d.warehouseId),
            carrier: d.transport?.carrierName || "-",
            mode: d.transport?.mode || "-",
            status: d.status,
            estimatedDeliveryDate: d.estimatedDeliveryDate,
            deliveredAt: d.deliveredAt,
            onTime,
            freightCost: d.transport?.freightCost || 0,
          };
        });
        const delivered = rows.filter((r) => r.status === "Delivered");
        return {
          columns: [
            { key: "dispatchNumber", label: "Dispatch #", width: 16 },
            { key: "createdAt", label: "Created", format: "date", width: 12 },
            { key: "customer", label: "Customer", width: 22 },
            { key: "warehouse", label: "Warehouse", width: 18 },
            { key: "carrier", label: "Carrier", width: 16 },
            { key: "mode", label: "Mode", width: 9 },
            { key: "status", label: "Status", width: 14 },
            { key: "estimatedDeliveryDate", label: "ETA", format: "date", width: 12 },
            { key: "deliveredAt", label: "Delivered", format: "date", width: 12 },
            { key: "onTime", label: "On Time", width: 8 },
            { key: "freightCost", label: "Freight", format: "currency", width: 12 },
          ],
          rows,
          summary: [
            { label: "Dispatches", value: rows.length, format: "number" },
            { label: "Delivered", value: delivered.length, format: "number" },
            {
              label: "On-time delivery",
              value: delivered.length ? round2((delivered.filter((r) => r.onTime === "Yes").length / delivered.length) * 100) : 0,
              format: "percent",
            },
            { label: "Freight cost", value: round2(rows.reduce((s, r) => s + r.freightCost, 0)), format: "currency" },
          ],
        };
      }

      case "supplier": {
        const poMatch: any = { companyId: companyObjectId, isDeleted: { $ne: true }, status: { $ne: "Cancelled" } };
        if (dateRange) poMatch.orderDate = dateRange;
        const [suppliers, stats] = await Promise.all([
          Supplier.find({ companyId, isDeleted: { $ne: true } }).sort({ name: 1 }).lean(),
          PurchaseOrder.aggregate([
            { $match: poMatch },
            {
              $group: {
                _id: "$supplierId",
                orders: { $sum: 1 },
                spend: { $sum: "$grandTotal" },
                open: { $sum: { $cond: [{ $in: ["$status", ["Closed", "Goods Received"]] }, 0, 1] } },
                lastOrder: { $max: "$orderDate" },
              },
            },
          ]),
        ]);
        const statMap = new Map(stats.map((s: any) => [String(s._id), s]));
        const rows = suppliers.map((s: any) => {
          const st: any = statMap.get(String(s._id)) || { orders: 0, spend: 0, open: 0 };
          return {
            code: s.code,
            name: s.name,
            category: s.category || "-",
            status: s.status || "-",
            orders: st.orders,
            openOrders: st.open,
            spend: round2(st.spend),
            averageOrder: st.orders ? round2(st.spend / st.orders) : 0,
            lastOrder: st.lastOrder,
          };
        });
        rows.sort((a, b) => b.spend - a.spend);
        return {
          columns: [
            { key: "code", label: "Code", width: 12 },
            { key: "name", label: "Supplier", width: 28 },
            { key: "category", label: "Category", width: 16 },
            { key: "status", label: "Status", width: 10 },
            { key: "orders", label: "POs", format: "number", width: 8 },
            { key: "openOrders", label: "Open", format: "number", width: 8 },
            { key: "spend", label: "Total Spend", format: "currency", width: 14 },
            { key: "averageOrder", label: "Avg PO", format: "currency", width: 12 },
            { key: "lastOrder", label: "Last Order", format: "date", width: 12 },
          ],
          rows,
          summary: [
            { label: "Suppliers", value: rows.length, format: "number" },
            { label: "Active suppliers (ordered)", value: rows.filter((r) => r.orders > 0).length, format: "number" },
            { label: "Total spend", value: round2(rows.reduce((s, r) => s + r.spend, 0)), format: "currency" },
          ],
        };
      }

      case "customer": {
        const soMatch: any = { companyId: companyObjectId, isDeleted: { $ne: true }, status: { $nin: ["Rejected", "Cancelled"] } };
        const invMatch: any = { companyId: companyObjectId, isDeleted: { $ne: true }, status: { $ne: "Cancelled" } };
        if (dateRange) {
          soMatch.orderDate = dateRange;
          invMatch.invoiceDate = dateRange;
        }
        const [customers, orderStats, invoiceStats] = await Promise.all([
          Customer.find({ companyId, isDeleted: { $ne: true } }).sort({ name: 1 }).lean(),
          SalesOrder.aggregate([
            { $match: soMatch },
            { $group: { _id: "$customerId", orders: { $sum: 1 }, value: { $sum: "$grandTotal" }, lastOrder: { $max: "$orderDate" } } },
          ]),
          SalesInvoice.aggregate([
            { $match: invMatch },
            { $group: { _id: "$customerId", invoiced: { $sum: "$grandTotal" }, paid: { $sum: "$amountPaid" }, outstanding: { $sum: "$balanceDue" } } },
          ]),
        ]);
        const orderMap = new Map(orderStats.map((s: any) => [String(s._id), s]));
        const invoiceMap = new Map(invoiceStats.map((s: any) => [String(s._id), s]));
        const rows = customers.map((c: any) => {
          const o: any = orderMap.get(String(c._id)) || { orders: 0, value: 0 };
          const inv: any = invoiceMap.get(String(c._id)) || { invoiced: 0, paid: 0, outstanding: 0 };
          return {
            code: c.code,
            name: c.name,
            type: c.customerType || "-",
            status: c.status || "-",
            orders: o.orders,
            orderValue: round2(o.value),
            invoiced: round2(inv.invoiced),
            paid: round2(inv.paid),
            outstanding: round2(inv.outstanding),
            lastOrder: o.lastOrder,
          };
        });
        rows.sort((a, b) => b.orderValue - a.orderValue);
        return {
          columns: [
            { key: "code", label: "Code", width: 12 },
            { key: "name", label: "Customer", width: 26 },
            { key: "type", label: "Type", width: 12 },
            { key: "status", label: "Status", width: 10 },
            { key: "orders", label: "Orders", format: "number", width: 8 },
            { key: "orderValue", label: "Order Value", format: "currency", width: 14 },
            { key: "invoiced", label: "Invoiced", format: "currency", width: 14 },
            { key: "paid", label: "Paid", format: "currency", width: 14 },
            { key: "outstanding", label: "Outstanding", format: "currency", width: 14 },
            { key: "lastOrder", label: "Last Order", format: "date", width: 12 },
          ],
          rows,
          summary: [
            { label: "Customers", value: rows.length, format: "number" },
            { label: "Order value", value: round2(rows.reduce((s, r) => s + r.orderValue, 0)), format: "currency" },
            { label: "Outstanding receivables", value: round2(rows.reduce((s, r) => s + r.outstanding, 0)), format: "currency" },
          ],
        };
      }
    }
  }

  // ==========================================
  // EXPORTS
  // ==========================================

  private formatValue(value: any, format?: ColumnFormat): string {
    if (value === null || value === undefined || value === "") return "-";
    switch (format) {
      case "currency":
        return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case "number":
        return Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
      case "percent":
        return `${Number(value).toFixed(1)}%`;
      case "date":
        return new Date(value).toISOString().slice(0, 10);
      default:
        return String(value).replace(/_/g, " ");
    }
  }

  async toExcel(report: ReportResult, companyName?: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "DIWS";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(report.title.slice(0, 31));
    sheet.addRow([report.title]).font = { bold: true, size: 14 };
    sheet.addRow([`${companyName ? `${companyName} - ` : ""}Generated ${new Date(report.generatedAt).toLocaleString("en-US")}`]);
    const filterText = Object.entries(report.filters).map(([k, v]) => `${k}: ${v}`).join("   ");
    if (filterText) sheet.addRow([filterText]);
    sheet.addRow([]);

    const header = sheet.addRow(report.columns.map((c) => c.label));
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    });

    report.rows.forEach((row) => {
      const excelRow = sheet.addRow(
        report.columns.map((c) => {
          const v = row[c.key];
          if (v === null || v === undefined) return "";
          if (c.format === "date") return new Date(v);
          if (c.format === "percent") return Number(v) / 100;
          return v;
        })
      );
      report.columns.forEach((c, idx) => {
        const cell = excelRow.getCell(idx + 1);
        if (c.format === "currency") cell.numFmt = "#,##0.00";
        if (c.format === "percent") cell.numFmt = "0.0%";
        if (c.format === "date") cell.numFmt = "yyyy-mm-dd";
      });
    });

    report.columns.forEach((c, idx) => {
      sheet.getColumn(idx + 1).width = c.width || 14;
    });

    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.addRow(["Metric", "Value"]).font = { bold: true };
    report.summary.forEach((s) => summarySheet.addRow([s.label, this.formatValue(s.value, s.format)]));
    summarySheet.getColumn(1).width = 32;
    summarySheet.getColumn(2).width = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  async toPdf(report: ReportResult, companyName?: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const left = doc.page.margins.left;

      doc.fontSize(16).font("Helvetica-Bold").fillColor("#0f172a").text(report.title, left);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#475569")
        .text(`${companyName ? `${companyName}  |  ` : ""}Generated ${new Date(report.generatedAt).toLocaleString("en-US")}`);
      const filterText = Object.entries(report.filters).map(([k, v]) => `${k}: ${v}`).join("   ");
      if (filterText) doc.text(filterText);
      doc.moveDown(0.5);

      // Summary strip
      doc.fontSize(9).fillColor("#0f172a");
      doc.text(report.summary.map((s) => `${s.label}: ${this.formatValue(s.value, s.format)}`).join("     "), left, doc.y, {
        width: pageWidth,
      });
      doc.moveDown(0.8);

      // Table
      const totalWeight = report.columns.reduce((s, c) => s + (c.width || 12), 0);
      const widths = report.columns.map((c) => ((c.width || 12) / totalWeight) * pageWidth);
      const rowHeight = 16;
      const bottomLimit = doc.page.height - doc.page.margins.bottom - rowHeight;

      const drawHeader = () => {
        const y = doc.y;
        doc.rect(left, y, pageWidth, rowHeight).fill("#1e293b");
        let x = left;
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#ffffff");
        report.columns.forEach((c, i) => {
          doc.text(c.label, x + 3, y + 4.5, { width: widths[i] - 6, height: rowHeight, ellipsis: true, lineBreak: false });
          x += widths[i];
        });
        doc.y = y + rowHeight;
      };

      drawHeader();
      doc.font("Helvetica").fontSize(7.5);

      if (report.rows.length === 0) {
        doc.fillColor("#64748b").text("No records match the selected filters.", left, doc.y + 6);
      }

      report.rows.forEach((row, rowIndex) => {
        if (doc.y > bottomLimit) {
          doc.addPage();
          drawHeader();
          doc.font("Helvetica").fontSize(7.5);
        }
        const y = doc.y;
        if (rowIndex % 2 === 1) doc.rect(left, y, pageWidth, rowHeight).fill("#f1f5f9");
        let x = left;
        doc.fillColor("#1e293b");
        report.columns.forEach((c, i) => {
          const numeric = c.format === "currency" || c.format === "number" || c.format === "percent";
          doc.text(this.formatValue(row[c.key], c.format), x + 3, y + 4.5, {
            width: widths[i] - 6,
            height: rowHeight,
            ellipsis: true,
            lineBreak: false,
            align: numeric ? "right" : "left",
          });
          x += widths[i];
        });
        doc.y = y + rowHeight;
      });

      doc.end();
    });
  }

  async export(companyId: string, type: string, format: string, query: ReportQuery) {
    if (format !== "pdf" && format !== "xlsx") throw badRequest("Export format must be 'pdf' or 'xlsx'");
    const report = await this.generate(companyId, type, query);
    const company = await Company.findById(companyId).select("name").lean();
    const companyName = (company as any)?.name;

    const stamp = new Date().toISOString().slice(0, 10);
    const fileName = `${report.type}-report-${stamp}.${format}`;
    const buffer = format === "pdf" ? await this.toPdf(report, companyName) : await this.toExcel(report, companyName);
    const contentType =
      format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    return { buffer, fileName, contentType };
  }
}

export const reportService = new ReportService();
export default reportService;
