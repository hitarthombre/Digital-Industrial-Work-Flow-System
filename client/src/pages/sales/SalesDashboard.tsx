import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { TrendingUp, Plus, RefreshCw, DollarSign, Clock, AlertTriangle, ShoppingBag, FileText, Receipt, Wallet } from "lucide-react";
import { Button } from "../../components/Button";
import { Chart } from "../../components/Chart";
import { PageHeader, KpiCard, LoadingBox, ErrorBanner, SectionCard, BarList, StatusBadge } from "../../components/ops/OpsUI";
import { SalesNav } from "../../components/sales/SalesNav";
import { SalesOrderModal, QuotationModal } from "../../components/sales/SalesModals";
import { useApiQuery } from "../../hooks/useApiQuery";
import { salesService } from "../../services/operationsService";
import { formatMoney, formatDate } from "../../utils/format";
import "../procurement/ProcurementPages.css";

const ORDER_STATUSES = ["Pending Approval", "Approved", "Processing", "Partially Dispatched", "Dispatched", "Delivered", "Rejected", "Cancelled"];

const HISTORY_ICONS = {
  quotation: <FileText size={14} className="text-slate-500" />,
  order: <ShoppingBag size={14} className="text-amber-600" />,
  invoice: <Receipt size={14} className="text-blue-600" />,
  payment: <Wallet size={14} className="text-emerald-600" />,
};

export const SalesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<{ startDate?: string; endDate?: string }>({});
  const [modal, setModal] = useState<"order" | "quotation" | null>(null);

  const reports = useApiQuery(() => salesService.getReports(range), [range]);
  const history = useApiQuery(() => salesService.getHistory({ ...range, limit: 25 }), [range]);
  const r = reports.data?.data;

  return (
    <div className="proc-page-container">
      <PageHeader
        icon={<TrendingUp className="text-amber-600" size={28} />}
        title="Sales"
        subtitle="Quotations, order approvals, invoicing and payment collection."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={() => {
                reports.refetch();
                history.refetch();
              }}
            >
              Refresh
            </Button>
            <Button variant="outline" size="sm" icon={<FileText size={14} />} onClick={() => setModal("quotation")}>
              New Quotation
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => setModal("order")}>
              New Sales Order
            </Button>
          </>
        }
      />
      <SalesNav />

      <div className="proc-filter-bar">
        <span className="text-xs font-bold text-slate-500 uppercase">Period</span>
        <div className="flex items-center gap-2">
          <input type="date" className="proc-select-filter" value={range.startDate || ""} onChange={(e) => setRange({ ...range, startDate: e.target.value || undefined })} aria-label="From" />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" className="proc-select-filter" value={range.endDate || ""} onChange={(e) => setRange({ ...range, endDate: e.target.value || undefined })} aria-label="To" />
          {(range.startDate || range.endDate) && (
            <button type="button" className="text-xs font-bold text-slate-500" onClick={() => setRange({})}>
              All time
            </button>
          )}
        </div>
      </div>

      <ErrorBanner message={reports.error} onRetry={reports.refetch} />

      <div className="proc-kpi-grid">
        <KpiCard label="Order Value" value={r ? formatMoney(r.totalOrderValue) : "—"} sub={`${r?.totalOrders ?? 0} orders · avg ${formatMoney(r?.averageOrderValue)}`} icon={<DollarSign size={22} />} />
        <KpiCard label="Collected" value={r ? formatMoney(r.totalCollected) : "—"} sub={`of ${formatMoney(r?.totalInvoiced)} invoiced`} icon={<Wallet size={22} />} tone="emerald" />
        <KpiCard label="Receivables" value={r ? formatMoney(r.outstandingReceivables) : "—"} sub={`${r?.overdueInvoices ?? 0} overdue (${formatMoney(r?.overdueAmount)})`} icon={<AlertTriangle size={22} />} tone="purple" />
        <KpiCard label="Awaiting Approval" value={r ? r.pendingApproval : "—"} sub={`Quote conversion ${r?.quotationConversionRate ?? 0}%`} icon={<Clock size={22} />} tone="blue" />
      </div>

      {reports.loading && !r ? (
        <LoadingBox label="Building sales overview..." />
      ) : (
        r && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SectionCard title="Revenue Invoiced (last 6 months)" className="lg:col-span-2">
              <Chart data={r.monthlyRevenue.map((m) => ({ label: m.label, value: m.value }))} type="area" height={240} color="#d97706" />
            </SectionCard>
            <SectionCard title="Orders by Status" actions={<Link to="/app/sales/orders" className="text-xs font-bold text-amber-700">View</Link>}>
              <BarList rows={ORDER_STATUSES.map((s) => ({ label: s, value: r.byStatus[s] || 0 }))} />
            </SectionCard>
            <SectionCard title="Top Customers">
              <BarList
                color="#2563eb"
                rows={r.topCustomers.map((c) => ({ label: c.name, value: c.value, display: `${formatMoney(c.value)} · ${c.orders} orders` }))}
              />
            </SectionCard>
            <SectionCard title="Top Products">
              <BarList
                color="#059669"
                rows={r.topProducts.map((p) => ({ label: p.itemName, value: p.revenue, display: formatMoney(p.revenue) }))}
              />
            </SectionCard>
            <SectionCard title="Sales History">
              <ErrorBanner message={history.error} onRetry={history.refetch} />
              {!history.data?.data.length ? (
                <p className="text-xs text-slate-400">No sales activity in this period.</p>
              ) : (
                <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto -mx-1">
                  {history.data.data.map((ev) => (
                    <li key={`${ev.type}-${ev.id}`}>
                      <button type="button" className="w-full text-left px-1 py-2 hover:bg-slate-50 flex items-start gap-2" onClick={() => navigate(ev.link)}>
                        <span className="mt-0.5">{HISTORY_ICONS[ev.type]}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs font-semibold text-slate-900 truncate">
                            {ev.type === "payment" ? `Payment on ${ev.number}` : ev.number} · {ev.customer || "—"}
                          </span>
                          <span className="block text-[11px] text-slate-500">{formatDate(ev.date)}</span>
                        </span>
                        <span className="text-right">
                          <span className="block text-xs font-mono font-bold">{formatMoney(ev.amount)}</span>
                          {ev.type !== "payment" && <StatusBadge status={ev.status} />}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        )
      )}

      {modal === "order" && (
        <SalesOrderModal
          onClose={() => setModal(null)}
          onSaved={(order) => {
            setModal(null);
            navigate(`/app/sales/orders/${order._id}`);
          }}
        />
      )}
      {modal === "quotation" && (
        <QuotationModal
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            navigate("/app/sales/quotations");
          }}
        />
      )}
    </div>
  );
};

export default SalesDashboard;
