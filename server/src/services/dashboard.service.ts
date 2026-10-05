import { Types } from "mongoose";
import { Inventory } from "../models/Inventory";
import { LowStockAlert } from "../models/LowStockAlert";
import { PurchaseOrder } from "../models/PurchaseOrder";
import { PurchaseRequest } from "../models/PurchaseRequest";
import { WorkOrder } from "../models/WorkOrder";
import { SalesOrder } from "../models/SalesOrder";
import { SalesInvoice } from "../models/SalesInvoice";
import { DispatchOrder } from "../models/DispatchOrder";
import { AuditLog } from "../models/AuditLog";
import { salesService } from "./sales.service";
import { round2 } from "../utils/docNumber";

const countBy = (rows: Array<{ _id: string; count: number }>) => {
  const out: Record<string, number> = {};
  rows.forEach((r) => (out[r._id] = r.count));
  return out;
};

export class DashboardService {
  async getSummary(companyId: string) {
    await salesService.markOverdueInvoices(companyId);

    const cid = new Types.ObjectId(companyId);
    const live = { companyId: cid, isDeleted: { $ne: true } };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      inventoryAgg,
      inventoryByCategory,
      lowStockAlerts,
      woStatus,
      producedThisMonth,
      poStatus,
      spendThisMonth,
      pendingPRs,
      soStatus,
      revenueThisMonth,
      receivables,
      monthlyRevenue,
      dispatchStatus,
      overdueWorkOrders,
      delayedDispatches,
      overduePOs,
      recentActivity,
    ] = await Promise.all([
      Inventory.aggregate([
        { $match: { companyId: cid } },
        {
          $group: {
            _id: null,
            value: { $sum: "$totalValue" },
            lines: { $sum: 1 },
            lowStock: { $sum: { $cond: [{ $eq: ["$status", "low_stock"] }, 1, 0] } },
            outOfStock: { $sum: { $cond: [{ $eq: ["$status", "out_of_stock"] }, 1, 0] } },
          },
        },
      ]),
      Inventory.aggregate([
        { $match: { companyId: cid } },
        { $group: { _id: "$itemCategory", value: { $sum: "$totalValue" }, quantity: { $sum: "$quantity" } } },
        { $sort: { value: -1 } },
      ]),
      LowStockAlert.find({ companyId, status: "active" })
        .populate("warehouseId", "name")
        .sort({ severity: 1, triggeredAt: -1 })
        .limit(5)
        .lean(),
      WorkOrder.aggregate([{ $match: live }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      WorkOrder.aggregate([
        { $match: live },
        { $unwind: "$outputLog" },
        { $match: { "outputLog.recordedAt": { $gte: monthStart } } },
        { $group: { _id: null, quantity: { $sum: "$outputLog.quantity" } } },
      ]),
      PurchaseOrder.aggregate([{ $match: live }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      PurchaseOrder.aggregate([
        { $match: { ...live, status: { $ne: "Cancelled" }, orderDate: { $gte: monthStart } } },
        { $group: { _id: null, spend: { $sum: "$grandTotal" } } },
      ]),
      PurchaseRequest.countDocuments({ companyId, isDeleted: { $ne: true }, status: "Submitted" }),
      SalesOrder.aggregate([{ $match: live }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      SalesInvoice.aggregate([
        { $match: { ...live, status: { $ne: "Cancelled" }, invoiceDate: { $gte: monthStart } } },
        { $group: { _id: null, revenue: { $sum: "$grandTotal" } } },
      ]),
      SalesInvoice.aggregate([
        { $match: { ...live, status: { $in: ["Unpaid", "Partially Paid", "Overdue"] } } },
        {
          $group: {
            _id: null,
            outstanding: { $sum: "$balanceDue" },
            overdue: { $sum: { $cond: [{ $eq: ["$status", "Overdue"] }, "$balanceDue", 0] } },
            overdueCount: { $sum: { $cond: [{ $eq: ["$status", "Overdue"] }, 1, 0] } },
          },
        },
      ]),
      SalesInvoice.aggregate([
        { $match: { ...live, status: { $ne: "Cancelled" }, invoiceDate: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: "$invoiceDate" }, month: { $month: "$invoiceDate" } }, revenue: { $sum: "$grandTotal" } } },
      ]),
      DispatchOrder.aggregate([{ $match: live }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      WorkOrder.find({ ...live, status: { $nin: ["Completed", "Cancelled"] }, plannedEndDate: { $lt: now } })
        .select("workOrderNumber itemName plannedEndDate status")
        .sort({ plannedEndDate: 1 })
        .limit(5)
        .lean(),
      DispatchOrder.find({ ...live, status: { $nin: ["Delivered", "Returned", "Cancelled"] }, estimatedDeliveryDate: { $lt: now } })
        .select("dispatchNumber estimatedDeliveryDate status")
        .sort({ estimatedDeliveryDate: 1 })
        .limit(5)
        .lean(),
      PurchaseOrder.find({
        ...live,
        status: { $in: ["PO Created", "Issued", "In Transit", "Partial Delivery"] },
        expectedDeliveryDate: { $lt: now },
      })
        .select("poNumber expectedDeliveryDate status")
        .sort({ expectedDeliveryDate: 1 })
        .limit(5)
        .lean(),
      AuditLog.find({ companyId })
        .sort({ createdAt: -1 })
        .limit(12)
        .populate("userId", "firstName lastName email")
        .lean(),
    ]);

    const inv = inventoryAgg[0] || { value: 0, lines: 0, lowStock: 0, outOfStock: 0 };
    const wo = countBy(woStatus);
    const po = countBy(poStatus);
    const so = countBy(soStatus);
    const dsp = countBy(dispatchStatus);
    const rec = receivables[0] || { outstanding: 0, overdue: 0, overdueCount: 0 };

    const revenueTrend: Array<{ label: string; value: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const found = monthlyRevenue.find((m: any) => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1);
      revenueTrend.push({ label: d.toLocaleString("en-US", { month: "short" }), value: found ? round2(found.revenue) : 0 });
    }

    const openPOs = ["PO Created", "Issued", "In Transit", "Partial Delivery"].reduce((s, k) => s + (po[k] || 0), 0);
    const activeWOs = ["Released", "In Progress", "On Hold"].reduce((s, k) => s + (wo[k] || 0), 0);
    const openSOs = ["Approved", "Processing", "Partially Dispatched"].reduce((s, k) => s + (so[k] || 0), 0);
    const inTransit = ["Shipped", "In Transit", "Out for Delivery"].reduce((s, k) => s + (dsp[k] || 0), 0);

    const alerts: Array<{ severity: "critical" | "warning" | "info"; title: string; message: string; link: string }> = [];
    lowStockAlerts.forEach((a: any) =>
      alerts.push({
        severity: a.severity === "critical" ? "critical" : "warning",
        title: `Low stock: ${a.itemName}`,
        message: `${a.currentQuantity} left (min ${a.minThreshold}) at ${a.warehouseId?.name || "warehouse"}`,
        link: "/app/inventory",
      })
    );
    if (rec.overdueCount > 0) {
      alerts.push({
        severity: "critical",
        title: `${rec.overdueCount} overdue invoice${rec.overdueCount > 1 ? "s" : ""}`,
        message: `${round2(rec.overdue).toLocaleString("en-US")} past due`,
        link: "/app/sales/invoices",
      });
    }
    overdueWorkOrders.forEach((w: any) =>
      alerts.push({
        severity: "warning",
        title: `Work order ${w.workOrderNumber} overdue`,
        message: `${w.itemName} was due ${new Date(w.plannedEndDate).toISOString().slice(0, 10)}`,
        link: `/app/production/work-orders/${w._id}`,
      })
    );
    delayedDispatches.forEach((d: any) =>
      alerts.push({
        severity: "warning",
        title: `Shipment ${d.dispatchNumber} delayed`,
        message: `Expected ${new Date(d.estimatedDeliveryDate).toISOString().slice(0, 10)}, still ${d.status}`,
        link: `/app/dispatch/${d._id}`,
      })
    );
    overduePOs.forEach((p: any) =>
      alerts.push({
        severity: "info",
        title: `PO ${p.poNumber} late from supplier`,
        message: `Expected ${new Date(p.expectedDeliveryDate).toISOString().slice(0, 10)}`,
        link: `/app/procurement/orders/${p._id}`,
      })
    );
    if ((so["Pending Approval"] || 0) > 0) {
      alerts.push({
        severity: "info",
        title: `${so["Pending Approval"]} sales order${so["Pending Approval"] > 1 ? "s" : ""} awaiting approval`,
        message: "Review and approve to start fulfilment",
        link: "/app/sales/orders",
      });
    }
    if (pendingPRs > 0) {
      alerts.push({
        severity: "info",
        title: `${pendingPRs} purchase request${pendingPRs > 1 ? "s" : ""} awaiting approval`,
        message: "Pending procurement review",
        link: "/app/procurement/requests",
      });
    }

    return {
      success: true,
      data: {
        kpis: {
          inventoryValue: round2(inv.value),
          lowStockItems: inv.lowStock + inv.outOfStock,
          activeWorkOrders: activeWOs,
          openPurchaseOrders: openPOs,
          openSalesOrders: openSOs,
          revenueThisMonth: round2(revenueThisMonth[0]?.revenue || 0),
          outstandingReceivables: round2(rec.outstanding),
          shipmentsInTransit: inTransit,
        },
        inventory: {
          totalValue: round2(inv.value),
          stockLines: inv.lines,
          lowStock: inv.lowStock,
          outOfStock: inv.outOfStock,
          byCategory: inventoryByCategory.map((c: any) => ({ category: c._id, value: round2(c.value), quantity: c.quantity })),
        },
        production: {
          byStatus: wo,
          active: activeWOs,
          completed: wo["Completed"] || 0,
          overdue: overdueWorkOrders.length,
          producedThisMonth: producedThisMonth[0]?.quantity || 0,
        },
        procurement: {
          byStatus: po,
          openOrders: openPOs,
          pendingRequests: pendingPRs,
          spendThisMonth: round2(spendThisMonth[0]?.spend || 0),
          lateDeliveries: overduePOs.length,
        },
        sales: {
          byStatus: so,
          pendingApproval: so["Pending Approval"] || 0,
          openOrders: openSOs,
          revenueThisMonth: round2(revenueThisMonth[0]?.revenue || 0),
          outstanding: round2(rec.outstanding),
          overdue: round2(rec.overdue),
          revenueTrend,
        },
        dispatch: {
          byStatus: dsp,
          pending: (dsp["Pending"] || 0) + (dsp["Packed"] || 0),
          inTransit,
          delivered: dsp["Delivered"] || 0,
          delayed: delayedDispatches.length,
        },
        alerts,
        recentActivity: recentActivity.map((log: any) => ({
          id: log._id,
          action: log.action,
          module: log.module,
          referenceId: log.referenceId,
          user: log.userId ? `${log.userId.firstName || ""} ${log.userId.lastName || ""}`.trim() || log.userId.email : "System",
          createdAt: log.createdAt,
        })),
      },
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
