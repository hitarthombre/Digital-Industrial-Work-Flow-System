import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, RefreshCw, Wallet, ChevronDown, ChevronRight, XCircle } from "lucide-react";
import { Button } from "../../components/Button";
import { PageHeader, StatusBadge, LoadingBox, EmptyBox, ErrorBanner, Pager } from "../../components/ops/OpsUI";
import { ListFilters, toQuery } from "../../components/ops/ListFilters";
import type { ListFilterValue } from "../../components/ops/ListFilters";
import { SalesNav } from "../../components/sales/SalesNav";
import { PaymentModal } from "../../components/sales/SalesModals";
import { useApiQuery, useDebounced, useMutation } from "../../hooks/useApiQuery";
import { salesService } from "../../services/operationsService";
import type { ISalesInvoice } from "../../types/operations";
import { formatDate, formatMoney, refName, humanize } from "../../utils/format";
import "../procurement/ProcurementPages.css";

const STATUSES = ["Unpaid", "Partially Paid", "Overdue", "Paid", "Cancelled"];

const PaymentHistory: React.FC<{ invoiceId: string }> = ({ invoiceId }) => {
  const { data, loading, error } = useApiQuery(() => salesService.getInvoice(invoiceId), [invoiceId]);
  if (loading) return <p className="text-xs text-slate-400 p-3">Loading payments…</p>;
  if (error) return <p className="text-xs text-rose-600 p-3">{error}</p>;
  const payments = data?.data.payments || [];
  return payments.length === 0 ? (
    <p className="text-xs text-slate-400 p-3">No payments recorded.</p>
  ) : (
    <table className="w-full text-xs">
      <thead className="text-slate-500 text-[10px] uppercase">
        <tr>
          <th className="text-left p-2">Date</th>
          <th className="text-left p-2">Method</th>
          <th className="text-left p-2">Reference</th>
          <th className="text-left p-2">Recorded by</th>
          <th className="text-right p-2">Amount</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((p) => (
          <tr key={p._id} className="border-t border-slate-100">
            <td className="p-2">{formatDate(p.paymentDate)}</td>
            <td className="p-2">{humanize(p.method)}</td>
            <td className="p-2">{p.reference || "—"}</td>
            <td className="p-2">{refName(p.recordedBy)}</td>
            <td className="p-2 text-right font-mono font-bold text-emerald-700">{formatMoney(p.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const InvoicesList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ListFilterValue>({});
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [paying, setPaying] = useState<ISalesInvoice | null>(null);
  const action = useMutation();

  const query = toQuery({ ...filters, search: useDebounced(filters.search) }, page);
  const list = useApiQuery(() => salesService.getInvoices(query), [query]);

  const cancel = async (inv: ISalesInvoice) => {
    if (!window.confirm(`Cancel invoice ${inv.invoiceNumber}? The order can then be re-invoiced.`)) return;
    await action.mutate(() => salesService.cancelInvoice(inv._id)).catch(() => undefined);
    list.refetch();
  };

  return (
    <div className="proc-page-container">
      <PageHeader
        icon={<Receipt className="text-amber-600" size={28} />}
        title="Invoices & Payments"
        subtitle="Track what customers owe, record payments and follow up overdue balances."
        actions={
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={list.refetch}>
            Refresh
          </Button>
        }
      />
      <SalesNav />
      <ListFilters
        module="invoices"
        value={filters}
        onChange={(v) => {
          setFilters(v);
          setPage(1);
        }}
        searchPlaceholder="Search invoice #..."
        statuses={STATUSES}
      />
      <ErrorBanner message={list.error || action.error} onRetry={list.refetch} />

      <div className="proc-card p-0 overflow-hidden">
        {list.loading ? (
          <LoadingBox label="Loading invoices..." />
        ) : !list.data?.data.length ? (
          <EmptyBox icon={<Receipt size={40} />} title="No invoices" message="Invoices are raised from approved sales orders." />
        ) : (
          <div className="overflow-x-auto">
            <table className="proc-table">
              <thead>
                <tr>
                  <th />
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Sales Order</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th>Total</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.data.data.map((inv) => (
                  <React.Fragment key={inv._id}>
                    <tr>
                      <td>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-700"
                          onClick={() => setExpanded(expanded === inv._id ? null : inv._id)}
                          aria-label="Toggle payments"
                        >
                          {expanded === inv._id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td>
                        <span className="proc-code-tag">{inv.invoiceNumber}</span>
                      </td>
                      <td className="font-semibold">{refName(inv.customerId)}</td>
                      <td>
                        {typeof inv.salesOrderId === "object" ? (
                          <button
                            type="button"
                            className="text-xs font-bold text-amber-700 hover:underline"
                            onClick={() => navigate(`/app/sales/orders/${(inv.salesOrderId as { _id: string })._id}`)}
                          >
                            {inv.salesOrderId.orderNumber}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-xs">{formatDate(inv.invoiceDate)}</td>
                      <td className={`text-xs ${inv.status === "Overdue" ? "text-rose-600 font-bold" : ""}`}>{formatDate(inv.dueDate)}</td>
                      <td className="font-mono text-xs">{formatMoney(inv.grandTotal)}</td>
                      <td className="font-mono font-bold">{formatMoney(inv.balanceDue)}</td>
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {inv.balanceDue > 0 && inv.status !== "Cancelled" && (
                            <Button variant="primary" size="sm" icon={<Wallet size={13} />} onClick={() => setPaying(inv)}>
                              Payment
                            </Button>
                          )}
                          {inv.amountPaid === 0 && inv.status !== "Cancelled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<XCircle size={13} className="text-rose-600" />}
                              disabled={action.submitting}
                              onClick={() => cancel(inv)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded === inv._id && (
                      <tr>
                        <td colSpan={10} className="bg-slate-50 p-0">
                          <PaymentHistory invoiceId={inv._id} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list.data?.pagination && <Pager {...list.data.pagination} page={page} onChange={setPage} />}
      </div>

      {paying && (
        <PaymentModal
          invoice={paying}
          onClose={() => setPaying(null)}
          onSaved={() => {
            setPaying(null);
            list.refetch();
          }}
        />
      )}
    </div>
  );
};

export default InvoicesList;
