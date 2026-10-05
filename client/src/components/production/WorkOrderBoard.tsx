import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, User } from "lucide-react";
import type { IWorkOrder, WorkOrderStatus } from "../../types/operations";
import { formatDate, formatNumber, refName } from "../../utils/format";

const COLUMNS: Array<{ status: WorkOrderStatus; title: string; tone: string }> = [
  { status: "Planned", title: "Planned", tone: "border-slate-300 bg-slate-50" },
  { status: "Released", title: "Released", tone: "border-blue-300 bg-blue-50/50" },
  { status: "In Progress", title: "In Progress", tone: "border-amber-300 bg-amber-50/50" },
  { status: "On Hold", title: "On Hold", tone: "border-rose-300 bg-rose-50/40" },
  { status: "Completed", title: "Completed", tone: "border-emerald-300 bg-emerald-50/50" },
];

// Mirrors the server's allowed work order transitions
const ALLOWED: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  Planned: ["Released", "In Progress", "Cancelled"],
  Released: ["In Progress", "On Hold", "Cancelled"],
  "In Progress": ["On Hold", "Completed", "Cancelled"],
  "On Hold": ["In Progress", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

interface WorkOrderBoardProps {
  workOrders: IWorkOrder[];
  onMove: (workOrder: IWorkOrder, status: WorkOrderStatus) => Promise<void>;
}

/** Kanban view of work orders by status; drag a card to another column to change its status. */
export const WorkOrderBoard: React.FC<WorkOrderBoardProps> = ({ workOrders, onMove }) => {
  const navigate = useNavigate();
  const [dragging, setDragging] = useState<IWorkOrder | null>(null);
  const [moving, setMoving] = useState<string | null>(null);

  const drop = async (status: WorkOrderStatus) => {
    const wo = dragging;
    setDragging(null);
    if (!wo || wo.status === status || !ALLOWED[wo.status].includes(status)) return;
    setMoving(wo._id);
    try {
      await onMove(wo, status);
    } finally {
      setMoving(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {COLUMNS.map((col) => {
        const cards = workOrders.filter((wo) => wo.status === col.status);
        const canDrop = !!dragging && dragging.status !== col.status && ALLOWED[dragging.status].includes(col.status);
        return (
          <div
            key={col.status}
            onDragOver={(e) => canDrop && e.preventDefault()}
            onDrop={() => drop(col.status)}
            className={`rounded-xl border-2 ${col.tone} ${canDrop ? "ring-2 ring-amber-400" : ""} ${dragging && !canDrop && dragging.status !== col.status ? "opacity-50" : ""} p-2 min-h-[240px] transition`}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-xs font-bold uppercase text-slate-700">{col.title}</span>
              <span className="text-[11px] font-bold bg-white rounded-full px-2 border border-slate-200">{cards.length}</span>
            </div>
            <div className="space-y-2">
              {cards.map((wo) => {
                const pct = Math.min(100, Math.round((wo.producedQuantity / wo.plannedQuantity) * 100));
                const stage = wo.stages.find((s) => s.status === "in_progress") || wo.stages.find((s) => s.status === "pending");
                const overdue = wo.plannedEndDate && new Date(wo.plannedEndDate) < new Date() && wo.status !== "Completed";
                const draggable = ALLOWED[wo.status].some((s) => s !== "Cancelled");
                return (
                  <div
                    key={wo._id}
                    draggable={draggable}
                    onDragStart={() => setDragging(wo)}
                    onDragEnd={() => setDragging(null)}
                    onClick={() => navigate(`/app/production/work-orders/${wo._id}`)}
                    className={`bg-white rounded-lg border border-slate-200 p-2.5 shadow-sm cursor-pointer hover:border-amber-400 ${moving === wo._id ? "opacity-50" : ""} ${draggable ? "active:cursor-grabbing" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="proc-code-tag">{wo.workOrderNumber}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{wo.priority}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1.5 truncate">{wo.itemName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{wo.status === "Completed" ? "Done" : stage?.name || "—"}</div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                      <span>
                        {formatNumber(wo.producedQuantity)}/{formatNumber(wo.plannedQuantity)} {wo.unit}
                      </span>
                      <span className={overdue ? "text-rose-600 font-bold flex items-center gap-0.5" : ""}>
                        {overdue && <AlertTriangle size={10} />}
                        {formatDate(wo.plannedEndDate)}
                      </span>
                    </div>
                    {wo.assignedTo && (
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <User size={10} /> {refName(wo.assignedTo)}
                      </div>
                    )}
                  </div>
                );
              })}
              {cards.length === 0 && <p className="text-[11px] text-slate-400 text-center py-6">No work orders</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WorkOrderBoard;
