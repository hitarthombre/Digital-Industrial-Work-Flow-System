import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  RefreshCw,
  Boxes,
  AlertTriangle,
  Cpu,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Wallet,
  Truck,
  Plus,
  FileText,
  ClipboardList,
  PackagePlus,
  Upload,
  BarChart3,
  Info,
  AlertOctagon,
  Activity,
} from "lucide-react";
import { Button } from "../../components/Button";
import { Chart } from "../../components/Chart";
import { useAuth } from "../../context/AuthContext";
import { KpiCard, LoadingBox, ErrorBanner, SectionCard, BarList } from "../../components/ops/OpsUI";
import { useApiQuery } from "../../hooks/useApiQuery";
import { dashboardService } from "../../services/operationsService";
import { formatMoney, formatNumber, humanize, timeAgo } from "../../utils/format";
import "../procurement/ProcurementPages.css";

const QUICK_ACTIONS = [
  { label: "New Sales Order", to: "/app/sales/orders", icon: <TrendingUp size={18} /> },
  { label: "New Work Order", to: "/app/production", icon: <ClipboardList size={18} /> },
  { label: "Purchase Request", to: "/app/procurement/requests", icon: <ShoppingCart size={18} /> },
  { label: "Stock In / Out", to: "/app/inventory", icon: <PackagePlus size={18} /> },
  { label: "New Dispatch", to: "/app/dispatch", icon: <Truck size={18} /> },
  { label: "New Quotation", to: "/app/sales/quotations", icon: <FileText size={18} /> },
  { label: "Upload Document", to: "/app/documents", icon: <Upload size={18} /> },
  { label: "Run a Report", to: "/app/reports", icon: <BarChart3 size={18} /> },
];

const SEVERITY_STYLES = {
  critical: { box: "border-rose-200 bg-rose-50", icon: <AlertOctagon size={16} className="text-rose-600" /> },
  warning: { box: "border-amber-200 bg-amber-50", icon: <AlertTriangle size={16} className="text-amber-600" /> },
  info: { box: "border-blue-200 bg-blue-50", icon: <Info size={16} className="text-blue-600" /> },
};

const MiniStat: React.FC<{ label: string; value: React.ReactNode; tone?: string }> = ({ label, value, tone = "text-slate-900" }) => (
  <div className="bg-slate-50 rounded-lg p-2.5">
    <div className="text-[10px] font-bold uppercase text-slate-500">{label}</div>
    <div className={`text-base font-extrabold ${tone}`}>{value}</div>
  </div>
);

export const MainDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApiQuery(() => dashboardService.getSummary(), []);
  const d = data?.data;

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div className="proc-page-container">
      <div className="proc-header">
        <div>
          <h1 className="proc-page-title">
            <LayoutDashboard className="text-amber-600" size={28} />
            {greeting}
            {user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="proc-page-subtitle">Live overview of inventory, production, procurement, sales and dispatch.</p>
        </div>
        <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={refetch} loading={loading && !!d}>
          Refresh
        </Button>
      </div>

      <ErrorBanner message={error} onRetry={refetch} />
      {loading && !d && <LoadingBox label="Loading your workspace..." />}

      {d && (
        <>
          {/* KPI cards */}
          <div className="proc-kpi-grid">
            <KpiCard label="Inventory Value" value={formatMoney(d.kpis.inventoryValue)} sub={`${d.kpis.lowStockItems} low / out of stock`} icon={<Boxes size={22} />} />
            <KpiCard label="Revenue This Month" value={formatMoney(d.kpis.revenueThisMonth)} sub={`${d.kpis.openSalesOrders} open sales orders`} icon={<DollarSign size={22} />} tone="emerald" />
            <KpiCard label="Active Work Orders" value={d.kpis.activeWorkOrders} sub={`${formatNumber(d.production.producedThisMonth, 0)} units made this month`} icon={<Cpu size={22} />} tone="blue" />
            <KpiCard label="Receivables" value={formatMoney(d.kpis.outstandingReceivables)} sub={`${d.kpis.shipmentsInTransit} shipments in transit`} icon={<Wallet size={22} />} tone="purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Alerts */}
            <SectionCard title={`Alerts (${d.alerts.length})`} icon={<AlertTriangle size={16} className="text-amber-600" />} className="lg:col-span-1">
              {d.alerts.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">All clear — nothing needs attention.</p>
              ) : (
                <ul className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {d.alerts.map((a, i) => (
                    <li key={i}>
                      <button type="button" onClick={() => navigate(a.link)} className={`w-full text-left border rounded-lg p-2.5 flex gap-2 ${SEVERITY_STYLES[a.severity].box}`}>
                        <span className="mt-0.5">{SEVERITY_STYLES[a.severity].icon}</span>
                        <span>
                          <span className="block text-xs font-bold text-slate-900">{a.title}</span>
                          <span className="block text-[11px] text-slate-600">{a.message}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            {/* Sales trend */}
            <SectionCard
              title="Revenue Trend"
              icon={<TrendingUp size={16} className="text-amber-600" />}
              className="lg:col-span-2"
              actions={<Link to="/app/sales" className="text-xs font-bold text-amber-700">Sales</Link>}
            >
              <Chart data={d.sales.revenueTrend} type="area" height={220} color="#d97706" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                <MiniStat label="Pending approval" value={d.sales.pendingApproval} />
                <MiniStat label="Open orders" value={d.sales.openOrders} />
                <MiniStat label="Outstanding" value={formatMoney(d.sales.outstanding)} />
                <MiniStat label="Overdue" value={formatMoney(d.sales.overdue)} tone={d.sales.overdue > 0 ? "text-rose-600" : "text-slate-900"} />
              </div>
            </SectionCard>
          </div>

          {/* Quick actions */}
          <SectionCard title="Quick Actions" icon={<Plus size={16} className="text-amber-600" />}>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  type="button"
                  onClick={() => navigate(qa.to)}
                  className="flex flex-col items-center gap-1.5 border border-slate-200 rounded-lg p-3 hover:border-amber-400 hover:bg-amber-50 transition text-slate-700"
                >
                  <span className="text-amber-600">{qa.icon}</span>
                  <span className="text-[11px] font-bold text-center leading-tight">{qa.label}</span>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Module summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <SectionCard title="Inventory" icon={<Boxes size={16} className="text-amber-600" />} actions={<Link to="/app/inventory" className="text-xs font-bold text-amber-700">Open</Link>}>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <MiniStat label="SKUs" value={d.inventory.stockLines} />
                <MiniStat label="Low" value={d.inventory.lowStock} tone={d.inventory.lowStock ? "text-amber-600" : "text-slate-900"} />
                <MiniStat label="Out" value={d.inventory.outOfStock} tone={d.inventory.outOfStock ? "text-rose-600" : "text-slate-900"} />
              </div>
              <BarList rows={d.inventory.byCategory.map((c) => ({ label: humanize(c.category), value: c.value, display: formatMoney(c.value) }))} />
            </SectionCard>

            <SectionCard title="Production" icon={<Cpu size={16} className="text-amber-600" />} actions={<Link to="/app/production" className="text-xs font-bold text-amber-700">Open</Link>}>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <MiniStat label="Active" value={d.production.active} />
                <MiniStat label="Done" value={d.production.completed} />
                <MiniStat label="Overdue" value={d.production.overdue} tone={d.production.overdue ? "text-rose-600" : "text-slate-900"} />
              </div>
              <BarList
                color="#2563eb"
                rows={["Planned", "Released", "In Progress", "On Hold"].map((s) => ({ label: s, value: d.production.byStatus[s] || 0 }))}
              />
            </SectionCard>

            <SectionCard title="Procurement" icon={<ShoppingCart size={16} className="text-amber-600" />} actions={<Link to="/app/procurement" className="text-xs font-bold text-amber-700">Open</Link>}>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <MiniStat label="Open POs" value={d.procurement.openOrders} />
                <MiniStat label="PRs" value={d.procurement.pendingRequests} />
                <MiniStat label="Late" value={d.procurement.lateDeliveries} tone={d.procurement.lateDeliveries ? "text-rose-600" : "text-slate-900"} />
              </div>
              <p className="text-xs text-slate-500">
                Spend this month: <strong className="text-slate-900 font-mono">{formatMoney(d.procurement.spendThisMonth)}</strong>
              </p>
              <BarList
                color="#7c3aed"
                rows={["PO Created", "Issued", "In Transit", "Partial Delivery", "Goods Received"].map((s) => ({ label: s, value: d.procurement.byStatus[s] || 0 }))}
              />
            </SectionCard>

            <SectionCard title="Dispatch" icon={<Truck size={16} className="text-amber-600" />} actions={<Link to="/app/dispatch" className="text-xs font-bold text-amber-700">Open</Link>}>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <MiniStat label="To ship" value={d.dispatch.pending} />
                <MiniStat label="Transit" value={d.dispatch.inTransit} />
                <MiniStat label="Delayed" value={d.dispatch.delayed} tone={d.dispatch.delayed ? "text-rose-600" : "text-slate-900"} />
              </div>
              <BarList
                color="#059669"
                rows={["Pending", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered"].map((s) => ({ label: s, value: d.dispatch.byStatus[s] || 0 }))}
              />
            </SectionCard>
          </div>

          {/* Recent activity */}
          <SectionCard title="Recent Activity" icon={<Activity size={16} className="text-amber-600" />} actions={<Link to="/app/audit" className="text-xs font-bold text-amber-700">Audit trail</Link>}>
            {d.recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {d.recentActivity.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2 text-xs">
                    <span className="w-24 shrink-0 text-[10px] font-bold uppercase text-slate-400">{a.module}</span>
                    <span className="flex-1 text-slate-800">
                      <strong>{a.user}</strong> · {humanize(a.action.toLowerCase())}
                    </span>
                    <span className="text-slate-400 shrink-0">{timeAgo(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default MainDashboard;
