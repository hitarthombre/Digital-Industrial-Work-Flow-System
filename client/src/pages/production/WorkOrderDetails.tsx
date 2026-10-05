import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Package,
  CheckCircle2,
  Trash2,
  Wrench,
  Play,
  Pause,
  XCircle,
  Circle,
  CircleDot,
  SkipForward,
  RotateCcw,
  History,
  Plus,
} from "lucide-react";
import { Button } from "../../components/Button";
import { StatusBadge, LoadingBox, ErrorBanner, SectionCard, KpiCard, EmptyBox } from "../../components/ops/OpsUI";
import { ConsumeMaterialModal, RecordOutputModal, ScrapModal, JobCardModal } from "../../components/production/ProductionModals";
import { useApiQuery, useMutation } from "../../hooks/useApiQuery";
import { productionService } from "../../services/operationsService";
import type { IWorkOrder, StageStatus, WorkOrderStatus, JobCardStatus } from "../../types/operations";
import { formatDate, formatDateTime, formatNumber, formatMoney, refName } from "../../utils/format";
import "../procurement/ProcurementPages.css";

type ModalKind = "consume" | "output" | "scrap" | "jobcard" | null;

const STAGE_ICONS: Record<StageStatus, React.ReactNode> = {
  pending: <Circle size={18} className="text-slate-300" />,
  in_progress: <CircleDot size={18} className="text-amber-500" />,
  completed: <CheckCircle2 size={18} className="text-emerald-500" />,
  skipped: <SkipForward size={18} className="text-slate-400" />,
};

export const WorkOrderDetails: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [modal, setModal] = useState<ModalKind>(null);
  const { data, loading, error, refetch, setData } = useApiQuery(() => productionService.getWorkOrder(id), [id]);
  const action = useMutation();

  const wo = data?.data;
  const active = wo && wo.status !== "Completed" && wo.status !== "Cancelled";

  // Mutations return the updated work order; refetch to pick up populated references
  const run = async (fn: () => Promise<{ data: IWorkOrder }>) => {
    try {
      const res = await action.mutate(fn);
      setData({ success: true, data: res.data });
      refetch();
    } catch {
      /* error surfaced through action.error */
    }
  };

  const setStatus = (status: WorkOrderStatus, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    const comment = status === "On Hold" || status === "Cancelled" ? window.prompt("Reason (optional)") || undefined : undefined;
    run(() => productionService.updateWorkOrderStatus(id, status, comment));
  };

  const setStage = (stageId: string, status: StageStatus) => run(() => productionService.updateStage(id, stageId, status));
  const setJobCard = (jobCardId: string, status: JobCardStatus) => {
    const hours = status === "completed" ? window.prompt("Actual hours spent", "0") : null;
    run(() =>
      productionService.updateJobCard(id, jobCardId, {
        status,
        ...(hours !== null && hours !== "" ? { actualHours: Number(hours) || 0 } : {}),
      })
    );
  };

  if (loading && !wo) return <div className="proc-page-container"><LoadingBox label="Loading work order..." /></div>;
  if (!wo)
    return (
      <div className="proc-page-container">
        <ErrorBanner message={error || "Work order not found"} onRetry={refetch} />
        <Button variant="outline" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate("/app/production")}>
          Back to production
        </Button>
      </div>
    );

  const pct = Math.min(100, Math.round((wo.producedQuantity / wo.plannedQuantity) * 100));
  const stagesDone = wo.stages.filter((s) => s.status === "completed" || s.status === "skipped").length;

  return (
    <div className="proc-page-container">
      <button onClick={() => navigate("/app/production")} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-3">
        <ArrowLeft size={14} /> Production
      </button>

      <div className="proc-header">
        <div>
          <h1 className="proc-page-title">
            <ClipboardList className="text-amber-600" size={28} />
            {wo.workOrderNumber}
            <StatusBadge status={wo.status} size="md" />
          </h1>
          <p className="proc-page-subtitle">
            {wo.itemName} <span className="font-mono">({wo.sku})</span> · {wo.priority} priority
            {wo.planId && typeof wo.planId === "object" && <> · Plan {wo.planId.planNumber}</>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {wo.status === "Planned" && (
            <Button variant="outline" size="sm" icon={<Play size={14} />} onClick={() => setStatus("Released")} disabled={action.submitting}>
              Release
            </Button>
          )}
          {(wo.status === "Released" || wo.status === "On Hold") && (
            <Button variant="outline" size="sm" icon={<Play size={14} />} onClick={() => setStatus("In Progress")} disabled={action.submitting}>
              {wo.status === "On Hold" ? "Resume" : "Start"}
            </Button>
          )}
          {(wo.status === "Released" || wo.status === "In Progress") && (
            <Button variant="outline" size="sm" icon={<Pause size={14} />} onClick={() => setStatus("On Hold")} disabled={action.submitting}>
              Hold
            </Button>
          )}
          {active && (
            <>
              <Button variant="outline" size="sm" icon={<Package size={14} />} onClick={() => setModal("consume")}>
                Issue Material
              </Button>
              <Button variant="outline" size="sm" icon={<Trash2 size={14} className="text-rose-600" />} onClick={() => setModal("scrap")}>
                Scrap
              </Button>
              <Button variant="primary" size="sm" icon={<CheckCircle2 size={14} />} onClick={() => setModal("output")}>
                Record Output
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<XCircle size={14} className="text-rose-600" />}
                onClick={() => setStatus("Cancelled", `Cancel ${wo.workOrderNumber}? This cannot be undone.`)}
                disabled={action.submitting}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <ErrorBanner message={action.error} />

      <div className="proc-kpi-grid">
        <KpiCard
          label="Produced"
          value={`${formatNumber(wo.producedQuantity)} / ${formatNumber(wo.plannedQuantity)}`}
          sub={`${pct}% of planned ${wo.unit}`}
          icon={<CheckCircle2 size={22} />}
          tone="emerald"
        />
        <KpiCard label="Scrap" value={formatNumber(wo.scrapQuantity)} sub={`${wo.scrapLog?.length || 0} scrap entries`} icon={<Trash2 size={22} />} tone="purple" />
        <KpiCard label="Material Cost" value={formatMoney(wo.materialCost)} sub={`${wo.consumptionLog?.length || 0} issues`} icon={<Package size={22} />} />
        <KpiCard
          label="Schedule"
          value={formatDate(wo.plannedEndDate)}
          sub={wo.actualEndDate ? `Finished ${formatDate(wo.actualEndDate)}` : wo.actualStartDate ? `Started ${formatDate(wo.actualStartDate)}` : "Not started"}
          icon={<History size={22} />}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-0">
          {/* Stage tracking */}
          <SectionCard title={`Production Stages (${stagesDone}/${wo.stages.length})`} icon={<CircleDot size={16} className="text-amber-600" />}>
            <ol className="space-y-2">
              {[...wo.stages]
                .sort((a, b) => a.sequence - b.sequence)
                .map((stage) => (
                  <li key={stage._id} className="flex items-center gap-3 border border-slate-100 rounded-lg p-2.5">
                    {STAGE_ICONS[stage.status]}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900">
                        {stage.sequence}. {stage.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {stage.status === "completed"
                          ? `Completed ${formatDateTime(stage.completedAt)}`
                          : stage.status === "in_progress"
                            ? `Started ${formatDateTime(stage.startedAt)}`
                            : stage.status === "skipped"
                              ? "Skipped"
                              : "Pending"}
                      </div>
                    </div>
                    {active && (
                      <div className="flex gap-1">
                        {stage.status === "pending" && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setStage(stage._id, "in_progress")} disabled={action.submitting}>
                              Start
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setStage(stage._id, "skipped")} disabled={action.submitting}>
                              Skip
                            </Button>
                          </>
                        )}
                        {stage.status === "in_progress" && (
                          <Button variant="outline" size="sm" onClick={() => setStage(stage._id, "completed")} disabled={action.submitting}>
                            Complete
                          </Button>
                        )}
                        {(stage.status === "completed" || stage.status === "skipped") && (
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-700 p-1"
                            title="Reopen stage"
                            onClick={() => setStage(stage._id, "pending")}
                            disabled={action.submitting}
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
            </ol>
          </SectionCard>

          {/* Job cards */}
          <SectionCard
            title="Job Cards"
            icon={<Wrench size={16} className="text-amber-600" />}
            actions={
              active && (
                <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setModal("jobcard")}>
                  Job Card
                </Button>
              )
            }
          >
            {wo.jobCards.length === 0 ? (
              <EmptyBox title="No job cards yet" message="Break the work order into assignable shop-floor tasks." />
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="proc-table">
                  <thead>
                    <tr>
                      <th>Card</th>
                      <th>Task</th>
                      <th>Assignee</th>
                      <th>Hours</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {wo.jobCards.map((jc) => (
                      <tr key={jc._id}>
                        <td className="font-mono text-xs">{jc.jobCardNumber}</td>
                        <td>
                          <div className="font-semibold">{jc.title}</div>
                          {jc.stageName && <div className="text-[11px] text-slate-500">{jc.stageName}</div>}
                          {jc.instructions && <div className="text-[11px] text-slate-400 mt-0.5">{jc.instructions}</div>}
                        </td>
                        <td className="text-xs">{refName(jc.assignedTo, "Unassigned")}</td>
                        <td className="text-xs font-mono">
                          {formatNumber(jc.actualHours)} / {formatNumber(jc.plannedHours)}h
                        </td>
                        <td>
                          <StatusBadge status={jc.status} />
                        </td>
                        <td className="text-right">
                          {active && jc.status === "open" && (
                            <Button variant="outline" size="sm" onClick={() => setJobCard(jc._id, "in_progress")} disabled={action.submitting}>
                              Start
                            </Button>
                          )}
                          {active && jc.status === "in_progress" && (
                            <Button variant="outline" size="sm" onClick={() => setJobCard(jc._id, "completed")} disabled={action.submitting}>
                              Complete
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Materials */}
          <SectionCard
            title="Material Consumption"
            icon={<Package size={16} className="text-amber-600" />}
            actions={
              active && (
                <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setModal("consume")}>
                  Issue
                </Button>
              )
            }
          >
            {wo.materials.length === 0 ? (
              <EmptyBox title="No materials issued" message="Issue raw material to deduct it from stock and cost this work order." />
            ) : (
              <table className="proc-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Required</th>
                    <th>Consumed</th>
                    <th>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {wo.materials.map((m) => {
                    const variance = m.consumedQuantity - m.requiredQuantity;
                    return (
                      <tr key={m._id}>
                        <td>
                          <div className="font-semibold">{m.itemName}</div>
                          <div className="text-[11px] font-mono text-slate-500">{m.sku}</div>
                        </td>
                        <td className="font-mono text-xs">
                          {m.requiredQuantity ? `${formatNumber(m.requiredQuantity)} ${m.unit}` : "—"}
                        </td>
                        <td className="font-mono text-xs">
                          {formatNumber(m.consumedQuantity)} {m.unit}
                        </td>
                        <td className={`font-mono text-xs ${m.requiredQuantity && variance > 0 ? "text-rose-600 font-bold" : "text-slate-500"}`}>
                          {m.requiredQuantity ? `${variance > 0 ? "+" : ""}${formatNumber(variance)}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>

        <div>
          <SectionCard title="Details">
            <dl className="text-xs space-y-2">
              {[
                ["Material warehouse", refName(wo.warehouseId)],
                ["Output warehouse", refName(wo.outputWarehouseId, refName(wo.warehouseId))],
                ["Factory", refName(wo.factoryId)],
                ["Supervisor", refName(wo.assignedTo, "Unassigned")],
                ["Planned start", formatDate(wo.plannedStartDate)],
                ["Planned end", formatDate(wo.plannedEndDate)],
                ["Created by", refName(wo.createdBy)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-semibold text-slate-900 text-right">{v}</dd>
                </div>
              ))}
            </dl>
            {wo.notes && <p className="text-xs text-slate-600 mt-3 bg-slate-50 rounded p-2">{wo.notes}</p>}
          </SectionCard>

          <SectionCard title="Output & Scrap Log">
            {(wo.outputLog?.length || 0) + (wo.scrapLog?.length || 0) === 0 ? (
              <p className="text-xs text-slate-400">Nothing recorded yet.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {[
                  ...(wo.outputLog || []).map((o) => ({ at: o.recordedAt, text: `+${formatNumber(o.quantity)} ${wo.unit} produced`, tone: "text-emerald-700", note: o.notes })),
                  ...(wo.scrapLog || []).map((s) => ({
                    at: s.recordedAt,
                    text: `${formatNumber(s.quantity)} ${wo.unit} scrapped — ${s.reason}${s.stageName ? ` (${s.stageName})` : ""}`,
                    tone: "text-rose-700",
                    note: s.notes,
                  })),
                ]
                  .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                  .map((e, i) => (
                    <li key={i} className="border-b border-slate-100 pb-1.5">
                      <div className={`font-semibold ${e.tone}`}>{e.text}</div>
                      <div className="text-[11px] text-slate-400">
                        {formatDateTime(e.at)}
                        {e.note ? ` · ${e.note}` : ""}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Status Timeline" icon={<History size={16} className="text-amber-600" />}>
            <ol className="relative border-l border-slate-200 ml-2 space-y-3">
              {[...(wo.statusTimeline || [])].reverse().map((ev, i) => (
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

      {modal === "consume" && <ConsumeMaterialModal workOrder={wo} onClose={() => setModal(null)} onSaved={() => { setModal(null); refetch(); }} />}
      {modal === "output" && <RecordOutputModal workOrder={wo} onClose={() => setModal(null)} onSaved={() => { setModal(null); refetch(); }} />}
      {modal === "scrap" && <ScrapModal workOrder={wo} onClose={() => setModal(null)} onSaved={() => { setModal(null); refetch(); }} />}
      {modal === "jobcard" && <JobCardModal workOrder={wo} onClose={() => setModal(null)} onSaved={() => { setModal(null); refetch(); }} />}
    </div>
  );
};

export default WorkOrderDetails;
