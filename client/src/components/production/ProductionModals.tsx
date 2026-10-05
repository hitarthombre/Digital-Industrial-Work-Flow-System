import React, { useEffect, useState } from "react";
import { CalendarRange, ClipboardList, Package, CheckCircle2, Trash2, Wrench, Plus } from "lucide-react";
import { FormModal, Field, inputCls } from "../ops/OpsUI";
import { LineItemsEditor, emptyLine } from "../ops/LineItemsEditor";
import type { LineItemRow } from "../ops/LineItemsEditor";
import { useLookup, loadWarehouseStock } from "../../hooks/useLookups";
import type { StockOption } from "../../hooks/useLookups";
import { useMutation } from "../../hooks/useApiQuery";
import { productionService } from "../../services/operationsService";
import type { IProductionPlan, IWorkOrder } from "../../types/operations";
import { refId, formatNumber } from "../../utils/format";

const DEFAULT_STAGES = ["Material Preparation", "Processing", "Assembly", "Quality Check", "Packaging"];

interface BaseProps {
  onClose: () => void;
  onSaved: () => void;
}

// ==========================================
// PRODUCTION PLAN
// ==========================================

export const ProductionPlanModal: React.FC<BaseProps> = ({ onClose, onSaved }) => {
  const { options: factories } = useLookup("factories");
  const { submitting, error, setError, mutate } = useMutation();
  const [title, setTitle] = useState("");
  const [factoryId, setFactoryId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItemRow[]>([{ ...emptyLine(), quantity: 100 }]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endDate && endDate < startDate) return setError("End date cannot be before the start date");
    await mutate(() =>
      productionService.createPlan({
        title,
        factoryId: factoryId || undefined,
        startDate,
        endDate,
        priority,
        notes: notes || undefined,
        items: items.map((i) => ({ productId: i.productId, itemName: i.itemName, sku: i.sku, plannedQuantity: i.quantity, unit: i.unit })),
      })
    );
    onSaved();
  };

  return (
    <FormModal
      title="New Production Plan"
      subtitle="Schedule what to produce over a period; work orders are raised against the plan"
      icon={<CalendarRange className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel="Create Plan"
      error={error}
      size="xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Field label="Plan Title" required className="sm:col-span-2">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. November assembly run" />
        </Field>
        <Field label="Factory">
          <select className={inputCls} value={factoryId} onChange={(e) => setFactoryId(e.target.value)}>
            <option value="">— Any —</option>
            {factories.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
            {["low", "medium", "high", "urgent"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start Date" required>
          <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Field>
        <Field label="End Date" required>
          <input type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <LineItemsEditor items={items} onChange={setItems} mode="quantity" quantityLabel="Planned Qty" />
    </FormModal>
  );
};

// ==========================================
// WORK ORDER
// ==========================================

interface WorkOrderModalProps extends BaseProps {
  plan?: IProductionPlan | null;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({ plan, onClose, onSaved }) => {
  const { options: warehouses } = useLookup("warehouses");
  const { options: factories } = useLookup("factories");
  const { options: users } = useLookup("users");
  const { options: products } = useLookup("products");
  const { submitting, error, mutate } = useMutation();

  const planLine = plan?.items[0];
  const [productId, setProductId] = useState(planLine?.productId || "");
  const [itemName, setItemName] = useState(planLine?.itemName || "");
  const [sku, setSku] = useState(planLine?.sku || "");
  const [unit, setUnit] = useState(planLine?.unit || "units");
  const [plannedQuantity, setPlannedQuantity] = useState<number>(
    planLine ? Math.max(planLine.plannedQuantity - planLine.producedQuantity, 1) : 100
  );
  const [warehouseId, setWarehouseId] = useState("");
  const [outputWarehouseId, setOutputWarehouseId] = useState("");
  const [factoryId, setFactoryId] = useState(refId(plan?.factoryId));
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<string>(plan?.priority || "medium");
  const [plannedStartDate, setPlannedStartDate] = useState(plan?.startDate?.slice(0, 10) || "");
  const [plannedEndDate, setPlannedEndDate] = useState(plan?.endDate?.slice(0, 10) || "");
  const [stages, setStages] = useState<string[]>(DEFAULT_STAGES);
  const [materials, setMaterials] = useState<Array<{ sku: string; itemName: string; requiredQuantity: number; unit: string }>>([]);
  const [stock, setStock] = useState<StockOption[]>([]);

  useEffect(() => {
    if (!warehouseId && warehouses.length > 0) setWarehouseId(warehouses[0]._id);
  }, [warehouses, warehouseId]);

  useEffect(() => {
    loadWarehouseStock(warehouseId).then(setStock).catch(() => setStock([]));
  }, [warehouseId]);

  const pickPlanLine = (lineId: string) => {
    const line = plan?.items.find((i) => i._id === lineId);
    if (!line) return;
    setProductId(line.productId || "");
    setItemName(line.itemName);
    setSku(line.sku);
    setUnit(line.unit);
    setPlannedQuantity(Math.max(line.plannedQuantity - line.producedQuantity, 1));
  };

  const pickProduct = (id: string) => {
    setProductId(id);
    const p = products.find((x) => x._id === id);
    if (p) {
      setItemName(p.name);
      setSku(p.sku || "");
      setUnit(p.unit || "units");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate(() =>
      productionService.createWorkOrder({
        planId: plan?._id,
        factoryId: factoryId || undefined,
        warehouseId,
        outputWarehouseId: outputWarehouseId || undefined,
        productId: productId || undefined,
        itemName,
        sku,
        unit,
        plannedQuantity: Number(plannedQuantity),
        priority,
        plannedStartDate: plannedStartDate || undefined,
        plannedEndDate: plannedEndDate || undefined,
        assignedTo: assignedTo || undefined,
        stages: stages.map((s) => s.trim()).filter(Boolean),
        materials: materials.filter((m) => m.sku && m.requiredQuantity > 0),
      })
    );
    onSaved();
  };

  return (
    <FormModal
      title="New Work Order"
      subtitle={plan ? `Raised against plan ${plan.planNumber} — ${plan.title}` : "Instruct the shop floor to produce a quantity of one product"}
      icon={<ClipboardList className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel="Create Work Order"
      error={error}
      size="xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {plan ? (
          <Field label="Plan Line" className="sm:col-span-2">
            <select className={inputCls} onChange={(e) => pickPlanLine(e.target.value)} defaultValue={planLine?._id}>
              {plan.items.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.itemName} ({i.sku}) — {formatNumber(i.producedQuantity)}/{formatNumber(i.plannedQuantity)}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Catalog Product" className="sm:col-span-2">
            <select className={inputCls} value={productId} onChange={(e) => pickProduct(e.target.value)}>
              <option value="">— Free text —</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Product Name" required>
          <input className={inputCls} value={itemName} onChange={(e) => setItemName(e.target.value)} required />
        </Field>
        <Field label="SKU" required>
          <input className={`${inputCls} font-mono uppercase`} value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} required />
        </Field>
        <Field label="Planned Quantity" required>
          <input type="number" min={1} className={inputCls} value={plannedQuantity} onChange={(e) => setPlannedQuantity(Number(e.target.value))} required />
        </Field>
        <Field label="Unit">
          <input className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value)} />
        </Field>
        <Field label="Priority">
          <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
            {["low", "medium", "high", "urgent"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Supervisor">
          <select className={inputCls} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">— Unassigned —</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Material Warehouse" required hint="Raw materials are issued from here">
          <select className={inputCls} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Output Warehouse" hint="Finished goods land here (defaults to material warehouse)">
          <select className={inputCls} value={outputWarehouseId} onChange={(e) => setOutputWarehouseId(e.target.value)}>
            <option value="">— Same as material —</option>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Factory">
          <select className={inputCls} value={factoryId} onChange={(e) => setFactoryId(e.target.value)}>
            <option value="">— Any —</option>
            {factories.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Planned Start">
          <input type="date" className={inputCls} value={plannedStartDate} onChange={(e) => setPlannedStartDate(e.target.value)} />
        </Field>
        <Field label="Planned End">
          <input type="date" className={inputCls} value={plannedEndDate} onChange={(e) => setPlannedEndDate(e.target.value)} />
        </Field>
      </div>

      <Field label="Production Stages" hint="Routing steps tracked on the shop floor, in order">
        <div className="flex flex-wrap gap-2">
          {stages.map((stage, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg pl-2">
              <span className="text-[10px] font-bold text-slate-400">{i + 1}</span>
              <input
                className="bg-transparent text-xs py-1 w-36 focus:outline-none"
                value={stage}
                onChange={(e) => setStages(stages.map((s, idx) => (idx === i ? e.target.value : s)))}
              />
              <button type="button" className="p-1 text-slate-400 hover:text-rose-600" onClick={() => setStages(stages.filter((_, idx) => idx !== i))} aria-label="Remove stage">
                <Trash2 size={12} />
              </button>
            </span>
          ))}
          <button type="button" className="text-xs font-bold text-amber-700 flex items-center gap-1" onClick={() => setStages([...stages, ""])}>
            <Plus size={12} /> Stage
          </button>
        </div>
      </Field>

      <Field label="Bill of Materials" hint="Raw materials expected to be consumed (optional)">
        <div className="space-y-2">
          {materials.map((m, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <select
                className={`${inputCls} col-span-6`}
                value={m.sku}
                onChange={(e) => {
                  const s = stock.find((x) => x.sku === e.target.value);
                  setMaterials(materials.map((row, idx) => (idx === i ? { ...row, sku: e.target.value, itemName: s?.itemName || row.itemName, unit: s?.unit || row.unit } : row)));
                }}
              >
                <option value="">Select stock item…</option>
                {stock.map((s) => (
                  <option key={s._id} value={s.sku}>
                    {s.itemName} ({s.sku}) — {formatNumber(s.quantity)} {s.unit} in stock
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step="any"
                className={`${inputCls} col-span-3`}
                value={m.requiredQuantity}
                onChange={(e) => setMaterials(materials.map((row, idx) => (idx === i ? { ...row, requiredQuantity: Number(e.target.value) } : row)))}
              />
              <span className="col-span-2 text-xs text-slate-500">{m.unit}</span>
              <button type="button" className="col-span-1 text-slate-400 hover:text-rose-600" onClick={() => setMaterials(materials.filter((_, idx) => idx !== i))} aria-label="Remove material">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs font-bold text-amber-700 flex items-center gap-1"
            onClick={() => setMaterials([...materials, { sku: "", itemName: "", requiredQuantity: 1, unit: "units" }])}
          >
            <Plus size={12} /> Material
          </button>
        </div>
      </Field>
    </FormModal>
  );
};

// ==========================================
// MATERIAL CONSUMPTION
// ==========================================

interface WorkOrderActionProps extends BaseProps {
  workOrder: IWorkOrder;
}

export const ConsumeMaterialModal: React.FC<WorkOrderActionProps> = ({ workOrder, onClose, onSaved }) => {
  const { options: warehouses } = useLookup("warehouses");
  const { submitting, error, setError, mutate } = useMutation();
  const [warehouseId, setWarehouseId] = useState(refId(workOrder.warehouseId));
  const [stock, setStock] = useState<StockOption[]>([]);
  const [lines, setLines] = useState<Array<{ sku: string; quantity: number; notes?: string }>>(
    workOrder.materials.length > 0
      ? workOrder.materials.map((m) => ({ sku: m.sku, quantity: Math.max(m.requiredQuantity - m.consumedQuantity, 0) }))
      : [{ sku: "", quantity: 1 }]
  );

  useEffect(() => {
    loadWarehouseStock(warehouseId).then(setStock).catch(() => setStock([]));
  }, [warehouseId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = lines.filter((l) => l.sku && l.quantity > 0);
    if (items.length === 0) return setError("Enter at least one material quantity to issue");
    await mutate(() => productionService.consumeMaterials(workOrder._id, { warehouseId, items }));
    onSaved();
  };

  return (
    <FormModal
      title="Issue Material to Production"
      subtitle={`Stock is deducted from the selected warehouse and costed against ${workOrder.workOrderNumber}`}
      icon={<Package className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel="Record Consumption"
      error={error}
    >
      <Field label="Source Warehouse" required>
        <select className={inputCls} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
          {warehouses.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="space-y-2">
        {lines.map((line, i) => {
          const available = stock.find((s) => s.sku === line.sku);
          const bom = workOrder.materials.find((m) => m.sku === line.sku);
          return (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-7">
                <select
                  className={inputCls}
                  value={line.sku}
                  onChange={(e) => setLines(lines.map((l, idx) => (idx === i ? { ...l, sku: e.target.value } : l)))}
                >
                  <option value="">Select material…</option>
                  {stock.map((s) => (
                    <option key={s._id} value={s.sku}>
                      {s.itemName} ({s.sku})
                    </option>
                  ))}
                  {line.sku && !available && <option value={line.sku}>{line.sku} (not in this warehouse)</option>}
                </select>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {available ? `${formatNumber(available.quantity)} ${available.unit} available` : line.sku ? "No stock in this warehouse" : ""}
                  {bom ? ` · BOM ${formatNumber(bom.consumedQuantity)}/${formatNumber(bom.requiredQuantity)} used` : ""}
                </p>
              </div>
              <input
                type="number"
                min={0}
                step="any"
                className={`${inputCls} col-span-4`}
                value={line.quantity}
                onChange={(e) => setLines(lines.map((l, idx) => (idx === i ? { ...l, quantity: Number(e.target.value) } : l)))}
              />
              <button type="button" className="col-span-1 pt-2 text-slate-400 hover:text-rose-600" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} aria-label="Remove line">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        <button type="button" className="text-xs font-bold text-amber-700 flex items-center gap-1" onClick={() => setLines([...lines, { sku: "", quantity: 1 }])}>
          <Plus size={12} /> Material
        </button>
      </div>
    </FormModal>
  );
};

// ==========================================
// PRODUCTION OUTPUT / COMPLETION
// ==========================================

export const RecordOutputModal: React.FC<WorkOrderActionProps> = ({ workOrder, onClose, onSaved }) => {
  const { options: warehouses } = useLookup("warehouses");
  const { submitting, error, setError, mutate } = useMutation();
  const remaining = Math.max(workOrder.plannedQuantity - workOrder.producedQuantity, 0);
  const [quantity, setQuantity] = useState<number>(remaining);
  const [scrapQuantity, setScrapQuantity] = useState<number>(0);
  const [scrapReason, setScrapReason] = useState("");
  const [warehouseId, setWarehouseId] = useState(refId(workOrder.outputWarehouseId) || refId(workOrder.warehouseId));
  const [markComplete, setMarkComplete] = useState(false);
  const [notes, setNotes] = useState("");

  const willComplete = markComplete || workOrder.producedQuantity + quantity >= workOrder.plannedQuantity;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scrapQuantity > 0 && !scrapReason.trim()) return setError("Give a reason for the scrapped quantity");
    await mutate(() =>
      productionService.recordOutput(workOrder._id, {
        quantity: Number(quantity) || 0,
        scrapQuantity: Number(scrapQuantity) || 0,
        scrapReason: scrapReason || undefined,
        warehouseId,
        notes: notes || undefined,
        markComplete,
      })
    );
    onSaved();
  };

  return (
    <FormModal
      title="Record Production Output"
      subtitle={`${formatNumber(workOrder.producedQuantity)} of ${formatNumber(workOrder.plannedQuantity)} ${workOrder.unit} produced so far`}
      icon={<CheckCircle2 className="text-emerald-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel={willComplete ? "Record & Complete" : "Record Output"}
      error={error}
      size="md"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label={`Good Quantity (${workOrder.unit})`} required>
          <input type="number" min={0} step="any" className={inputCls} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </Field>
        <Field label="Scrap Quantity">
          <input type="number" min={0} step="any" className={inputCls} value={scrapQuantity} onChange={(e) => setScrapQuantity(Number(e.target.value))} />
        </Field>
        {scrapQuantity > 0 && (
          <Field label="Scrap Reason" required className="col-span-2">
            <input className={inputCls} value={scrapReason} onChange={(e) => setScrapReason(e.target.value)} placeholder="e.g. dimensional defect" />
          </Field>
        )}
        <Field label="Receive Into Warehouse" className="col-span-2">
          <select className={inputCls} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes" className="col-span-2">
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input type="checkbox" checked={markComplete} onChange={(e) => setMarkComplete(e.target.checked)} />
        Close the work order now, even if short of the planned quantity
      </label>
      {willComplete && (
        <p className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-2">
          This will complete {workOrder.workOrderNumber} and receive finished goods into stock.
        </p>
      )}
    </FormModal>
  );
};

// ==========================================
// SCRAP
// ==========================================

export const ScrapModal: React.FC<WorkOrderActionProps> = ({ workOrder, onClose, onSaved }) => {
  const { submitting, error, mutate } = useMutation();
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState("");
  const [stageName, setStageName] = useState(workOrder.stages.find((s) => s.status === "in_progress")?.name || "");
  const [notes, setNotes] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate(() => productionService.recordScrap(workOrder._id, { quantity, reason, stageName: stageName || undefined, notes: notes || undefined }));
    onSaved();
  };

  return (
    <FormModal
      title="Record Scrap"
      subtitle="Log rejected or wasted units against this work order"
      icon={<Trash2 className="text-rose-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel="Record Scrap"
      error={error}
      size="md"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label={`Quantity (${workOrder.unit})`} required>
          <input type="number" min={0.0001} step="any" className={inputCls} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
        </Field>
        <Field label="Stage">
          <select className={inputCls} value={stageName} onChange={(e) => setStageName(e.target.value)}>
            <option value="">— Not stage specific —</option>
            {workOrder.stages.map((s) => (
              <option key={s._id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reason" required className="col-span-2">
          <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="e.g. weld porosity" />
        </Field>
        <Field label="Notes" className="col-span-2">
          <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
    </FormModal>
  );
};

// ==========================================
// JOB CARD
// ==========================================

export const JobCardModal: React.FC<WorkOrderActionProps> = ({ workOrder, onClose, onSaved }) => {
  const { options: users } = useLookup("users");
  const { submitting, error, mutate } = useMutation();
  const [title, setTitle] = useState("");
  const [stageName, setStageName] = useState(workOrder.stages.find((s) => s.status !== "completed")?.name || "");
  const [assignedTo, setAssignedTo] = useState("");
  const [plannedHours, setPlannedHours] = useState<number>(4);
  const [instructions, setInstructions] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate(() =>
      productionService.addJobCard(workOrder._id, {
        title,
        stageName: stageName || undefined,
        assignedTo: assignedTo || undefined,
        plannedHours,
        instructions: instructions || undefined,
      })
    );
    onSaved();
  };

  return (
    <FormModal
      title="New Job Card"
      subtitle={`A unit of shop-floor work for ${workOrder.workOrderNumber}`}
      icon={<Wrench className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel="Create Job Card"
      error={error}
      size="md"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Task" required className="col-span-2">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. CNC machining of housing" />
        </Field>
        <Field label="Stage">
          <select className={inputCls} value={stageName} onChange={(e) => setStageName(e.target.value)}>
            <option value="">— None —</option>
            {workOrder.stages.map((s) => (
              <option key={s._id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Planned Hours">
          <input type="number" min={0} step="any" className={inputCls} value={plannedHours} onChange={(e) => setPlannedHours(Number(e.target.value))} />
        </Field>
        <Field label="Assign To" className="col-span-2">
          <select className={inputCls} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">— Unassigned —</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Instructions" className="col-span-2">
          <textarea className={inputCls} rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </Field>
      </div>
    </FormModal>
  );
};
