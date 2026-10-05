import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Truck, MapPin, Navigation, Upload, FileText, Download, Trash2, CheckCircle2, Circle, CircleDot, AlertTriangle, Package } from "lucide-react";
import { Button } from "../../components/Button";
import { StatusBadge, LoadingBox, ErrorBanner, SectionCard, EmptyBox } from "../../components/ops/OpsUI";
import { TransportModal, ShipmentStatusModal, DispatchDocumentModal, NEXT_DISPATCH_STATUSES } from "../../components/dispatch/DispatchModals";
import { useApiQuery, useMutation } from "../../hooks/useApiQuery";
import { dispatchService } from "../../services/operationsService";
import { formatDate, formatDateTime, formatNumber, formatMoney, formatFileSize, refName, humanize } from "../../utils/format";
import "../procurement/ProcurementPages.css";

type ModalKind = "transport" | "status" | "document" | null;

export const DispatchDetails: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [modal, setModal] = useState<ModalKind>(null);
  const detail = useApiQuery(() => dispatchService.getDispatch(id), [id]);
  const tracking = useApiQuery(() => dispatchService.getTracking(id), [id]);
  const action = useMutation();

  const d = detail.data?.data;
  const t = tracking.data?.data;
  const reload = () => {
    detail.refetch();
    tracking.refetch();
  };

  const removeDoc = async (docId: string, title: string) => {
    if (!window.confirm(`Remove "${title}" from this dispatch?`)) return;
    await action.mutate(() => dispatchService.removeDocument(id, docId)).catch(() => undefined);
    detail.refetch();
  };

  if (detail.loading && !d) return <div className="proc-page-container"><LoadingBox label="Loading shipment..." /></div>;
  if (!d)
    return (
      <div className="proc-page-container">
        <ErrorBanner message={detail.error || "Dispatch order not found"} onRetry={detail.refetch} />
        <Button variant="outline" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate("/app/dispatch")}>
          Back to dispatch
        </Button>
      </div>
    );

  const canUpdate = NEXT_DISPATCH_STATUSES[d.status].length > 0;
  const closed = ["Delivered", "Returned", "Cancelled"].includes(d.status);

  return (
    <div className="proc-page-container">
      <button onClick={() => navigate("/app/dispatch")} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-3">
        <ArrowLeft size={14} /> Dispatch
      </button>

      <div className="proc-header">
        <div>
          <h1 className="proc-page-title">
            <Truck className="text-amber-600" size={28} />
            {d.dispatchNumber}
            <StatusBadge status={d.status} size="md" />
          </h1>
          <p className="proc-page-subtitle">
            {refName(d.customerId, "Internal shipment")} · from {refName(d.warehouseId)}
            {d.salesOrderId && typeof d.salesOrderId === "object" && (
              <>
                {" "}
                ·{" "}
                <button
                  type="button"
                  className="font-bold text-amber-700 hover:underline"
                  onClick={() => navigate(`/app/sales/orders/${(d.salesOrderId as { _id: string })._id}`)}
                >
                  {d.salesOrderId.orderNumber}
                </button>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!closed && (
            <Button variant="outline" size="sm" icon={<Navigation size={14} />} onClick={() => setModal("transport")}>
              Transport Details
            </Button>
          )}
          <Button variant="outline" size="sm" icon={<Upload size={14} />} onClick={() => setModal("document")}>
            Attach Document
          </Button>
          {canUpdate && (
            <Button variant="primary" size="sm" icon={<MapPin size={14} />} onClick={() => setModal("status")}>
              Update Status
            </Button>
          )}
        </div>
      </div>

      <ErrorBanner message={action.error || tracking.error} />

      {/* Delivery tracking progress */}
      {t && (
        <div className="proc-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Delivery Tracking</h3>
            {t.isDelayed && (
              <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                <AlertTriangle size={14} /> Past ETA ({formatDate(t.estimatedDeliveryDate)})
              </span>
            )}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full ${d.status === "Returned" || d.status === "Cancelled" ? "bg-rose-400" : "bg-emerald-500"}`}
              style={{ width: `${t.progressPercent}%` }}
            />
          </div>
          <ol className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {t.steps.map((step) => (
              <li key={step.status} className="text-center">
                <div className="flex justify-center mb-1">
                  {step.state === "completed" ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : step.state === "current" ? (
                    <CircleDot size={20} className="text-amber-500" />
                  ) : (
                    <Circle size={20} className="text-slate-300" />
                  )}
                </div>
                <div className={`text-[11px] font-bold ${step.state === "upcoming" || step.state === "skipped" ? "text-slate-400" : "text-slate-800"}`}>
                  {step.status}
                </div>
                {step.timestamp && <div className="text-[10px] text-slate-400">{formatDateTime(step.timestamp)}</div>}
                {step.location && <div className="text-[10px] text-slate-500">{step.location}</div>}
              </li>
            ))}
          </ol>
          {(d.status === "Returned" || d.status === "Cancelled") && (
            <p className="text-xs text-rose-700 mt-3">This shipment was {d.status.toLowerCase()}.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionCard title="Items" icon={<Package size={16} className="text-amber-600" />}>
            <table className="proc-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>SKU</th>
                  <th className="text-right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((item) => (
                  <tr key={item._id}>
                    <td className="font-semibold">{item.itemName}</td>
                    <td className="font-mono text-xs">{item.sku}</td>
                    <td className="text-right font-mono">
                      {formatNumber(item.quantity)} {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-slate-500 mt-2">
              {d.stockDeducted ? "Stock has been deducted from the source warehouse." : "Stock will be deducted when the shipment is marked Shipped."}
            </p>
          </SectionCard>

          <SectionCard
            title="Dispatch Documents"
            icon={<FileText size={16} className="text-amber-600" />}
            actions={
              <Button variant="outline" size="sm" icon={<Upload size={13} />} onClick={() => setModal("document")}>
                Attach
              </Button>
            }
          >
            {d.documents.length === 0 ? (
              <EmptyBox title="No documents" message="Attach the packing list, e-way bill, LR copy or proof of delivery." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {d.documents.map((doc) => (
                  <li key={doc._id} className="flex items-center gap-3 py-2">
                    <FileText size={18} className="text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{doc.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {humanize(doc.docType)} · {doc.fileName} · {formatFileSize(doc.fileSize)} · {formatDate(doc.uploadedAt)}
                      </div>
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-amber-700 p-1" title="Open / download">
                      <Download size={16} />
                    </a>
                    <button type="button" className="text-slate-400 hover:text-rose-600 p-1" onClick={() => removeDoc(doc._id, doc.title)} title="Remove">
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Tracking Events" icon={<MapPin size={16} className="text-amber-600" />}>
            <ol className="relative border-l border-slate-200 ml-2 space-y-3">
              {(t?.events || []).map((ev) => (
                <li key={ev._id} className="ml-4">
                  <span className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white" />
                  <div className="text-xs font-bold text-slate-900">
                    {ev.status}
                    {ev.location && <span className="font-normal text-slate-500"> · {ev.location}</span>}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {formatDateTime(ev.timestamp)} · {refName(ev.updatedBy, "System")}
                  </div>
                  {ev.note && <div className="text-[11px] text-slate-600 mt-0.5">{ev.note}</div>}
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>

        <div>
          <SectionCard title="Transport" icon={<Navigation size={16} className="text-amber-600" />}>
            <dl className="text-xs space-y-2">
              {[
                ["Mode", d.transport?.mode ? humanize(d.transport.mode) : "—"],
                ["Carrier", d.transport?.carrierName || "—"],
                ["Vehicle", d.transport?.vehicleNumber || "—"],
                ["Driver", [d.transport?.driverName, d.transport?.driverPhone].filter(Boolean).join(" · ") || "—"],
                ["Tracking #", d.transport?.trackingNumber || "—"],
                ["Waybill / LR", d.transport?.waybillNumber || "—"],
                ["Freight", formatMoney(d.transport?.freightCost)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-slate-100 pb-1.5">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-semibold text-slate-900 text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
          <SectionCard title="Delivery">
            <dl className="text-xs space-y-2">
              {[
                ["Planned dispatch", formatDate(d.plannedDispatchDate)],
                ["Shipped", formatDateTime(d.actualDispatchDate)],
                ["ETA", formatDate(d.estimatedDeliveryDate)],
                ["Delivered", formatDateTime(d.deliveredAt)],
                ["Received by", d.receivedBy || "—"],
                ["Contact", [d.contactName, d.contactPhone].filter(Boolean).join(" · ") || "—"],
                [
                  "Ship to",
                  [d.shippingAddress?.street, d.shippingAddress?.city, d.shippingAddress?.state, d.shippingAddress?.postalCode, d.shippingAddress?.country]
                    .filter(Boolean)
                    .join(", ") || "—",
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-slate-100 pb-1.5">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-semibold text-slate-900 text-right">{v}</dd>
                </div>
              ))}
            </dl>
            {d.notes && <p className="text-xs text-slate-600 mt-3 bg-slate-50 rounded p-2">{d.notes}</p>}
          </SectionCard>
        </div>
      </div>

      {modal === "transport" && <TransportModal dispatch={d} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      {modal === "status" && <ShipmentStatusModal dispatch={d} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      {modal === "document" && <DispatchDocumentModal dispatch={d} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
    </div>
  );
};

export default DispatchDetails;
