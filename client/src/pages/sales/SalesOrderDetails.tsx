import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingBag, ShieldCheck, Receipt, Truck, XCircle, Cog, CheckCircle2, History, Wallet } from "lucide-react";
import { Button } from "../../components/Button";
import { StatusBadge, LoadingBox, ErrorBanner, SectionCard, KpiCard } from "../../components/ops/OpsUI";
import { OrderApprovalModal, InvoiceModal, PaymentModal } from "../../components/sales/SalesModals";
import { DispatchOrderModal } from "../../components/dispatch/DispatchModals";
import { useApiQuery, useMutation } from "../../hooks/useApiQuery";
import { salesService, dispatchService } from "../../services/operationsService";
import type { ISalesInvoice } from "../../types/operations";
import { formatDate, formatDateTime, formatMoney, formatNumber, refName } from "../../utils/format";
import "../procurement/ProcurementPages.css";

type ModalKind = "approve" | "invoice" | "dispatch" | null;

export const SalesOrderDetails: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [modal, setModal] = useState<ModalKind>(null);
  const [payingInvoice, setPayingInvoice] = useState<ISalesInvoice | null>(null);
  const { data, loading, error, refetch } = useApiQuery(() => salesService.getOrder(id), [id]);
  const dispatches = useApiQuery(() => dispatchService.getDispatches({ salesOrderId: id, limit: 50 }), [id]);
  const action = useMutation();

  const order = data?.data.order;
  const invoices = data?.data.invoices || [];

  const reload = () => {
    refetch();
    dispatches.refetch();
  };

  const setStatus = async (status: string, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    await action.mutate(() => salesService.updateOrderStatus(id, status)).catch(() => undefined);
    refetch();
  };

  if (loading && !order) return <div className="proc-page-container"><LoadingBox label="Loading sales order..." /></div>;
  if (!order)
    return (
      <div className="proc-page-container">
        <ErrorBanner message={error || "Sales order not found"} onRetry={refetch} />
        <Button variant="outline" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate("/app/sales/orders")}>
          Back to sales orders
        </Button>
      </div>
    );

  const activeInvoice = invoices.find((i) => i.status !== "Cancelled");
  const canDispatch = ["Approved", "Processing", "Partially Dispatched"].includes(order.status);
  const canInvoice = !activeInvoice && !["Pending Approval", "Rejected", "Cancelled"].includes(order.status);
  const dispatchedPct = Math.round(
    (order.items.reduce((s, i) => s + (i.quantityDispatched || 0), 0) / Math.max(order.items.reduce((s, i) => s + i.quantity, 0), 1)) * 100
  );
  const customer = typeof order.customerId === "object" ? order.customerId : null;

  return (
    <div className="proc-page-container">
      <button onClick={() => navigate("/app/sales/orders")} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-3">
        <ArrowLeft size={14} /> Sales orders
      </button>

      <div className="proc-header">
        <div>
          <h1 className="proc-page-title">
            <ShoppingBag className="text-amber-600" size={28} />
            {order.orderNumber}
            <StatusBadge status={order.status} size="md" />
          </h1>
          <p className="proc-page-subtitle">
            {refName(order.customerId)} · ordered {formatDate(order.orderDate)}
            {order.customerPoNumber && <> · Customer PO {order.customerPoNumber}</>}
            {order.quotationId && typeof order.quotationId === "object" && <> · from {order.quotationId.quotationNumber}</>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {order.status === "Pending Approval" && (
            <Button variant="primary" size="sm" icon={<ShieldCheck size={14} />} onClick={() => setModal("approve")}>
              Review Order
            </Button>
          )}
          {order.status === "Approved" && (
            <Button variant="outline" size="sm" icon={<Cog size={14} />} onClick={() => setStatus("Processing")} disabled={action.submitting}>
              Start Processing
            </Button>
          )}
          {canDispatch && (
            <Button variant="outline" size="sm" icon={<Truck size={14} />} onClick={() => setModal("dispatch")}>
              Create Dispatch
            </Button>
          )}
          {order.status === "Dispatched" && (
            <Button variant="outline" size="sm" icon={<CheckCircle2 size={14} />} onClick={() => setStatus("Delivered", "Mark this order as delivered?")} disabled={action.submitting}>
              Mark Delivered
            </Button>
          )}
          {canInvoice && (
            <Button variant="outline" size="sm" icon={<Receipt size={14} />} onClick={() => setModal("invoice")}>
              Create Invoice
            </Button>
          )}
          {["Pending Approval", "Approved", "Processing"].includes(order.status) && (
            <Button
              variant="outline"
              size="sm"
              icon={<XCircle size={14} className="text-rose-600" />}
              disabled={action.submitting}
              onClick={() => setStatus("Cancelled", `Cancel ${order.orderNumber}?`)}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <ErrorBanner message={action.error} />
      {order.status === "Rejected" && order.rejectionReason && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs mb-4">
          <strong>Rejected:</strong> {order.rejectionReason}
        </div>
      )}

      <div className="proc-kpi-grid">
        <KpiCard label="Order Value" value={formatMoney(order.grandTotal)} sub={`${order.items.length} lines · ${order.paymentTerms || "Net 30"}`} icon={<ShoppingBag size={22} />} />
        <KpiCard label="Dispatched" value={`${dispatchedPct}%`} sub={`${dispatches.data?.data.length || 0} dispatch order(s)`} icon={<Truck size={22} />} tone="blue" />
        <KpiCard label="Invoiced" value={formatMoney(order.amountInvoiced)} sub={activeInvoice ? activeInvoice.invoiceNumber : "Not invoiced"} icon={<Receipt size={22} />} tone="purple" />
        <KpiCard label="Paid" value={formatMoney(order.amountPaid)} sub={<StatusBadge status={order.paymentStatus} />} icon={<Wallet size={22} />} tone="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionCard title="Order Lines">
            <div className="overflow-x-auto -mx-1">
              <table className="proc-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Dispatched</th>
                    <th>Unit Price</th>
                    <th>Disc / Tax</th>
                    <th className="text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((line) => (
                    <tr key={line._id}>
                      <td>
                        <div className="font-semibold">{line.itemName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{line.sku}</div>
                      </td>
                      <td className="font-mono text-xs">
                        {formatNumber(line.quantity)} {line.unit}
                      </td>
                      <td className="font-mono text-xs">{formatNumber(line.quantityDispatched || 0)}</td>
                      <td className="font-mono text-xs">{formatMoney(line.unitPrice)}</td>
                      <td className="text-xs text-slate-500">
                        {line.discountPercent}% / {line.taxRate}%
                      </td>
                      <td className="text-right font-mono font-bold">{formatMoney(line.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="text-xs">
                  {[
                    ["Subtotal", order.subtotal],
                    ["Discount", -order.discountTotal],
                    ["Tax", order.taxTotal],
                    ["Shipping", order.shippingCost],
                  ].map(([label, value]) => (
                    <tr key={label as string}>
                      <td colSpan={5} className="text-right text-slate-500 py-1">
                        {label}
                      </td>
                      <td className="text-right font-mono py-1">{formatMoney(value as number)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={5} className="text-right font-bold text-slate-900">
                      Grand Total
                    </td>
                    <td className="text-right font-mono font-extrabold text-slate-900">{formatMoney(order.grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Dispatches" icon={<Truck size={16} className="text-amber-600" />}>
            {!dispatches.data?.data.length ? (
              <p className="text-xs text-slate-400">No dispatch orders yet.</p>
            ) : (
              <table className="proc-table">
                <thead>
                  <tr>
                    <th>Dispatch #</th>
                    <th>Items</th>
                    <th>Carrier</th>
                    <th>ETA</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatches.data.data.map((d) => (
                    <tr key={d._id} className="cursor-pointer" onClick={() => navigate(`/app/dispatch/${d._id}`)}>
                      <td>
                        <span className="proc-code-tag">{d.dispatchNumber}</span>
                      </td>
                      <td className="text-xs">{d.items.map((i) => `${formatNumber(i.quantity)} × ${i.sku}`).join(", ")}</td>
                      <td className="text-xs">{d.transport?.carrierName || "—"}</td>
                      <td className="text-xs">{formatDate(d.estimatedDeliveryDate)}</td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          <SectionCard title="Invoices & Payments" icon={<Receipt size={16} className="text-amber-600" />}>
            {invoices.length === 0 ? (
              <p className="text-xs text-slate-400">No invoices yet.</p>
            ) : (
              <table className="proc-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Due</th>
                    <th>Total</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td>
                        <span className="proc-code-tag">{inv.invoiceNumber}</span>
                      </td>
                      <td className="text-xs">{formatDate(inv.invoiceDate)}</td>
                      <td className="text-xs">{formatDate(inv.dueDate)}</td>
                      <td className="font-mono text-xs">{formatMoney(inv.grandTotal)}</td>
                      <td className="font-mono text-xs font-bold">{formatMoney(inv.balanceDue)}</td>
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="text-right">
                        {inv.balanceDue > 0 && inv.status !== "Cancelled" && (
                          <Button variant="outline" size="sm" icon={<Wallet size={13} />} onClick={() => setPayingInvoice(inv)}>
                            Record Payment
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>

        <div>
          <SectionCard title="Customer & Delivery">
            <dl className="text-xs space-y-2">
              {[
                ["Customer", refName(order.customerId)],
                ["Email", customer?.email || "—"],
                ["Phone", customer?.phone || "—"],
                ["Warehouse", refName(order.warehouseId)],
                ["Expected delivery", formatDate(order.expectedDeliveryDate)],
                [
                  "Ship to",
                  [order.shippingAddress?.street, order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.country]
                    .filter(Boolean)
                    .join(", ") || "—",
                ],
                ["Approved by", order.approvedBy ? `${refName(order.approvedBy)} · ${formatDate(order.approvedAt)}` : "—"],
                ["Created by", refName(order.createdBy)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-slate-100 pb-1.5">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-semibold text-slate-900 text-right">{v}</dd>
                </div>
              ))}
            </dl>
            {order.notes && <p className="text-xs text-slate-600 mt-3 bg-slate-50 rounded p-2">{order.notes}</p>}
          </SectionCard>

          <SectionCard title="Status Timeline" icon={<History size={16} className="text-amber-600" />}>
            <ol className="relative border-l border-slate-200 ml-2 space-y-3">
              {[...(order.statusTimeline || [])].reverse().map((ev, i) => (
                <li key={i} className="ml-4">
                  <span className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white" />
                  <div className="text-xs font-bold text-slate-900">{ev.status}</div>
                  <div className="text-[11px] text-slate-500">
                    {formatDateTime(ev.timestamp)} · {refName(ev.updatedBy, "System")}
                  </div>
                  {ev.comment && <div className="text-[11px] text-slate-600 mt-0.5">{ev.comment}</div>}
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>
      </div>

      {modal === "approve" && <OrderApprovalModal order={order} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      {modal === "invoice" && <InvoiceModal order={order} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      {modal === "dispatch" && (
        <DispatchOrderModal
          salesOrder={order}
          onClose={() => setModal(null)}
          onSaved={(dispatch) => {
            setModal(null);
            navigate(`/app/dispatch/${dispatch._id}`);
          }}
        />
      )}
      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onSaved={() => {
            setPayingInvoice(null);
            reload();
          }}
        />
      )}
    </div>
  );
};

export default SalesOrderDetails;
