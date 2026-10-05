import React, { useEffect, useState } from "react";
import { Truck, Navigation, MapPin, Upload, Trash2, Plus } from "lucide-react";
import { FormModal, Field, inputCls } from "../ops/OpsUI";
import { useLookup, loadWarehouseStock } from "../../hooks/useLookups";
import type { StockOption } from "../../hooks/useLookups";
import { useMutation } from "../../hooks/useApiQuery";
import { dispatchService, fileService } from "../../services/operationsService";
import type { ISalesOrder, IDispatchOrder, DispatchStatus, ITransportDetails, DispatchDocType, TransportMode } from "../../types/operations";
import { refId, formatNumber, toInputDate, humanize } from "../../utils/format";

interface BaseProps {
  onClose: () => void;
  onSaved: (result?: any) => void;
}

const TRANSPORT_MODES: TransportMode[] = ["road", "rail", "air", "sea", "courier"];

const TransportFields: React.FC<{ value: ITransportDetails; onChange: (v: ITransportDetails) => void }> = ({ value, onChange }) => {
  const set = (patch: Partial<ITransportDetails>) => onChange({ ...value, ...patch });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <Field label="Mode">
        <select className={inputCls} value={value.mode || ""} onChange={(e) => set({ mode: (e.target.value || undefined) as TransportMode })}>
          <option value="">— Select —</option>
          {TRANSPORT_MODES.map((m) => (
            <option key={m} value={m}>
              {humanize(m)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Carrier / Transporter">
        <input className={inputCls} value={value.carrierName || ""} onChange={(e) => set({ carrierName: e.target.value })} />
      </Field>
      <Field label="Vehicle Number">
        <input className={`${inputCls} uppercase`} value={value.vehicleNumber || ""} onChange={(e) => set({ vehicleNumber: e.target.value })} />
      </Field>
      <Field label="Freight Cost">
        <input type="number" min={0} step="any" className={inputCls} value={value.freightCost ?? 0} onChange={(e) => set({ freightCost: Number(e.target.value) })} />
      </Field>
      <Field label="Driver Name">
        <input className={inputCls} value={value.driverName || ""} onChange={(e) => set({ driverName: e.target.value })} />
      </Field>
      <Field label="Driver Phone">
        <input className={inputCls} value={value.driverPhone || ""} onChange={(e) => set({ driverPhone: e.target.value })} />
      </Field>
      <Field label="Tracking Number">
        <input className={inputCls} value={value.trackingNumber || ""} onChange={(e) => set({ trackingNumber: e.target.value })} />
      </Field>
      <Field label="Waybill / LR Number">
        <input className={inputCls} value={value.waybillNumber || ""} onChange={(e) => set({ waybillNumber: e.target.value })} />
      </Field>
    </div>
  );
};

// ==========================================
// CREATE DISPATCH
// ==========================================

interface DispatchLine {
  sku: string;
  itemName: string;
  quantity: number;
  unit: string;
  max?: number;
}

export const DispatchOrderModal: React.FC<BaseProps & { salesOrder?: ISalesOrder | null }> = ({ salesOrder, onClose, onSaved }) => {
  const { options: warehouses } = useLookup("warehouses");
  const { options: customers } = useLookup("customers", !salesOrder);
  const { submitting, error, setError, mutate } = useMutation();

  const [warehouseId, setWarehouseId] = useState(salesOrder ? refId(salesOrder.warehouseId) : "");
  const [customerId, setCustomerId] = useState("");
  const [stock, setStock] = useState<StockOption[]>([]);
  const [lines, setLines] = useState<DispatchLine[]>(() =>
    salesOrder
      ? salesOrder.items
          .map((i) => ({ sku: i.sku, itemName: i.itemName, unit: i.unit, max: i.quantity - (i.quantityDispatched || 0), quantity: i.quantity - (i.quantityDispatched || 0) }))
          .filter((l) => l.quantity > 0)
      : [{ sku: "", itemName: "", quantity: 1, unit: "units" }]
  );
  const [transport, setTransport] = useState<ITransportDetails>({ mode: "road" });
  const [plannedDispatchDate, setPlannedDispatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(toInputDate(salesOrder?.expectedDeliveryDate));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!warehouseId && warehouses.length) setWarehouseId(warehouses[0]._id);
  }, [warehouses, warehouseId]);

  useEffect(() => {
    loadWarehouseStock(warehouseId).then(setStock).catch(() => setStock([]));
  }, [warehouseId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = lines.filter((l) => l.sku && l.quantity > 0);
    if (items.length === 0) return setError("Add at least one item to dispatch");
    const res = await mutate(() =>
      dispatchService.createDispatch({
        salesOrderId: salesOrder?._id,
        customerId: salesOrder ? undefined : customerId || undefined,
        warehouseId,
        items: items.map(({ sku, itemName, quantity, unit }) => ({ sku, itemName, quantity, unit })),
        transport,
        plannedDispatchDate: plannedDispatchDate || undefined,
        estimatedDeliveryDate: estimatedDeliveryDate || undefined,
        notes: notes || undefined,
      })
    );
    onSaved(res.data);
  };

  return (
    <FormModal
      title="New Dispatch Order"
      subtitle={
        salesOrder
          ? `Ship goods for ${salesOrder.orderNumber}. Stock is deducted when the shipment is marked Shipped.`
          : "Ship stock from a warehouse. Stock is deducted when the shipment is marked Shipped."
      }
      icon={<Truck className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel="Create Dispatch"
      error={error}
      size="xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Field label="Ship From" required>
          <select className={inputCls} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>
        {!salesOrder && (
          <Field label="Customer">
            <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">— Internal / none —</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Planned Dispatch">
          <input type="date" className={inputCls} value={plannedDispatchDate} onChange={(e) => setPlannedDispatchDate(e.target.value)} />
        </Field>
        <Field label="Estimated Delivery">
          <input type="date" className={inputCls} value={estimatedDeliveryDate} onChange={(e) => setEstimatedDeliveryDate(e.target.value)} />
        </Field>
      </div>

      <Field label="Items to Ship" required>
        <div className="space-y-2">
          {lines.map((line, i) => {
            const onHand = stock.find((s) => s.sku === line.sku);
            const short = onHand ? onHand.quantity < line.quantity : !!line.sku;
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-7">
                  {salesOrder ? (
                    <div className={`${inputCls} bg-white`}>
                      {line.itemName} <span className="font-mono text-slate-500">({line.sku})</span>
                    </div>
                  ) : (
                    <select
                      className={inputCls}
                      value={line.sku}
                      onChange={(e) => {
                        const s = stock.find((x) => x.sku === e.target.value);
                        setLines(lines.map((l, idx) => (idx === i ? { ...l, sku: e.target.value, itemName: s?.itemName || "", unit: s?.unit || "units" } : l)));
                      }}
                    >
                      <option value="">Select stock item…</option>
                      {stock.map((s) => (
                        <option key={s._id} value={s.sku}>
                          {s.itemName} ({s.sku})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className={`text-[11px] mt-0.5 ${short ? "text-rose-600" : "text-slate-400"}`}>
                    {line.sku ? `${onHand ? formatNumber(onHand.quantity) : 0} ${line.unit} in stock` : ""}
                    {line.max !== undefined ? ` · ${formatNumber(line.max)} left on order` : ""}
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={line.max}
                  step="any"
                  className={`${inputCls} col-span-4`}
                  value={line.quantity}
                  onChange={(e) => setLines(lines.map((l, idx) => (idx === i ? { ...l, quantity: Number(e.target.value) } : l)))}
                />
                <button type="button" className="col-span-1 pt-2 text-slate-400 hover:text-rose-600" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} aria-label="Remove item">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          {!salesOrder && (
            <button type="button" className="text-xs font-bold text-amber-700 flex items-center gap-1" onClick={() => setLines([...lines, { sku: "", itemName: "", quantity: 1, unit: "units" }])}>
              <Plus size={12} /> Item
            </button>
          )}
          {salesOrder && lines.length === 0 && <p className="text-xs text-slate-500">Every line on this order has already been dispatched.</p>}
        </div>
      </Field>

      <TransportFields value={transport} onChange={setTransport} />
      <Field label="Notes">
        <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </FormModal>
  );
};

// ==========================================
// TRANSPORT DETAILS
// ==========================================

export const TransportModal: React.FC<BaseProps & { dispatch: IDispatchOrder }> = ({ dispatch, onClose, onSaved }) => {
  const { submitting, error, mutate } = useMutation();
  const [transport, setTransport] = useState<ITransportDetails>({ ...dispatch.transport });
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(toInputDate(dispatch.estimatedDeliveryDate));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await mutate(() => dispatchService.updateTransport(dispatch._id, { ...transport, estimatedDeliveryDate: estimatedDeliveryDate || undefined }));
    onSaved(res.data);
  };

  return (
    <FormModal
      title="Transport Details"
      subtitle={`Carrier, vehicle and tracking references for ${dispatch.dispatchNumber}`}
      icon={<Navigation className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel="Save Transport Details"
      error={error}
    >
      <TransportFields value={transport} onChange={setTransport} />
      <Field label="Estimated Delivery Date" className="max-w-xs">
        <input type="date" className={inputCls} value={estimatedDeliveryDate} onChange={(e) => setEstimatedDeliveryDate(e.target.value)} />
      </Field>
    </FormModal>
  );
};

// ==========================================
// SHIPMENT STATUS
// ==========================================

export const NEXT_DISPATCH_STATUSES: Record<DispatchStatus, DispatchStatus[]> = {
  Pending: ["Packed", "Shipped", "Cancelled"],
  Packed: ["Shipped", "Pending", "Cancelled"],
  Shipped: ["In Transit", "Out for Delivery", "Delivered", "Returned"],
  "In Transit": ["In Transit", "Out for Delivery", "Delivered", "Returned"],
  "Out for Delivery": ["Delivered", "In Transit", "Returned"],
  Delivered: [],
  Returned: [],
  Cancelled: [],
};

export const ShipmentStatusModal: React.FC<BaseProps & { dispatch: IDispatchOrder; initialStatus?: DispatchStatus }> = ({
  dispatch,
  initialStatus,
  onClose,
  onSaved,
}) => {
  const options = NEXT_DISPATCH_STATUSES[dispatch.status];
  const { submitting, error, mutate } = useMutation();
  const [status, setStatus] = useState<DispatchStatus>(initialStatus || options[0]);
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [receivedBy, setReceivedBy] = useState("");

  const deductsStock = !dispatch.stockDeducted && ["Shipped", "In Transit", "Out for Delivery", "Delivered"].includes(status);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await mutate(() =>
      dispatchService.updateStatus(dispatch._id, {
        status,
        location: location || undefined,
        note: note || undefined,
        receivedBy: status === "Delivered" ? receivedBy || undefined : undefined,
      })
    );
    onSaved(res.data);
  };

  return (
    <FormModal
      title="Update Shipment Status"
      subtitle={`${dispatch.dispatchNumber} is currently ${dispatch.status}`}
      icon={<MapPin className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel={`Mark ${status}`}
      error={error}
      size="md"
    >
      <Field label="New Status" required>
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as DispatchStatus)}>
          {options.map((s) => (
            <option key={s} value={s}>
              {s === dispatch.status ? `${s} (location update)` : s}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Current Location">
          <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Vadodara hub" />
        </Field>
        {status === "Delivered" && (
          <Field label="Received By">
            <input className={inputCls} value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
          </Field>
        )}
        <Field label="Note" className="col-span-2">
          <textarea className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      {deductsStock && (
        <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2">
          Shipping deducts {dispatch.items.length} item line(s) from warehouse stock. It fails if any item is short.
        </p>
      )}
      {status === "Returned" && (
        <p className="text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-2">
          Returned goods are added back to the source warehouse stock.
        </p>
      )}
    </FormModal>
  );
};

// ==========================================
// DISPATCH DOCUMENT UPLOAD
// ==========================================

const DOC_TYPES: DispatchDocType[] = ["invoice", "packing_list", "eway_bill", "lr_copy", "proof_of_delivery", "other"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const DispatchDocumentModal: React.FC<BaseProps & { dispatch: IDispatchOrder }> = ({ dispatch, onClose, onSaved }) => {
  const { submitting, error, setError, mutate } = useMutation();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DispatchDocType>(dispatch.status === "Delivered" ? "proof_of_delivery" : "packing_list");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError("Choose a file to upload");
    if (file.size > MAX_FILE_BYTES) return setError("Files must be 10MB or smaller");
    const res = await mutate(async () => {
      const uploaded = await fileService.upload(file);
      return dispatchService.addDocument(dispatch._id, {
        title: title || humanize(docType),
        docType,
        fileName: uploaded.fileName,
        fileUrl: uploaded.fileUrl,
        fileType: uploaded.fileType,
        fileSize: uploaded.fileSize,
      });
    });
    onSaved(res.data);
  };

  return (
    <FormModal
      title="Attach Dispatch Document"
      subtitle="Packing list, e-way bill, LR copy, proof of delivery…"
      icon={<Upload className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel="Upload"
      error={error}
      size="md"
    >
      <Field label="File" required hint="PDF, image or office document up to 10MB">
        <input
          type="file"
          className="text-xs"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setFile(f);
            if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
          }}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Document Type">
          <select className={inputCls} value={docType} onChange={(e) => setDocType(e.target.value as DispatchDocType)}>
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {humanize(t)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
      </div>
    </FormModal>
  );
};
