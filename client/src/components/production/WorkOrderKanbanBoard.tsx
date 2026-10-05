import React, { useState } from "react";
import { WorkOrder, WorkOrderStage } from "../../types/production";
import {
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Wrench,
  Boxes,
  Trash2,
  PackageCheck,
  ChevronRight,
  User,
  Factory as FactoryIcon,
  Tag,
} from "lucide-react";

interface WorkOrderKanbanBoardProps {
  workOrders: WorkOrder[];
  onUpdateStage: (id: string, stage: WorkOrderStage) => Promise<void>;
  onOpenJobCard: (workOrder: WorkOrder) => void;
  onOpenConsumeMaterial: (workOrder: WorkOrder) => void;
  onOpenRecordScrap: (workOrder: WorkOrder) => void;
  onOpenCompleteOrder: (workOrder: WorkOrder) => void;
  loading?: boolean;
}

const STAGES: { key: WorkOrderStage; title: string; color: string; bg: string; border: string }[] = [
  { key: "PLANNED", title: "1. Planned", color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-300" },
  { key: "MATERIAL_PREP", title: "2. Material Prep", color: "text-blue-700", bg: "bg-blue-50/50", border: "border-blue-300" },
  { key: "MACHINING", title: "3. Machining", color: "text-amber-700", bg: "bg-amber-50/50", border: "border-amber-300" },
  { key: "ASSEMBLY", title: "4. Assembly", color: "text-indigo-700", bg: "bg-indigo-50/50", border: "border-indigo-300" },
  { key: "QUALITY_CHECK", title: "5. Quality Check", color: "text-purple-700", bg: "bg-purple-50/50", border: "border-purple-300" },
  { key: "PACKAGING", title: "6. Packaging", color: "text-cyan-700", bg: "bg-cyan-50/50", border: "border-cyan-300" },
  { key: "COMPLETED", title: "7. Completed", color: "text-emerald-700", bg: "bg-emerald-50/50", border: "border-emerald-300" },
];

export const WorkOrderKanbanBoard: React.FC<WorkOrderKanbanBoardProps> = ({
  workOrders,
  onUpdateStage,
  onOpenJobCard,
  onOpenConsumeMaterial,
  onOpenRecordScrap,
  onOpenCompleteOrder,
  loading = false,
}) => {
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedOrderId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: WorkOrderStage) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain") || draggedOrderId;
    if (!orderId) return;

    setDraggedOrderId(null);
    const order = workOrders.find((w) => w._id === orderId);
    if (order && order.stage !== targetStage) {
      try {
        setUpdatingId(orderId);
        await onUpdateStage(orderId, targetStage);
      } finally {
        setUpdatingId(null);
      }
    }
  };

  // Helper for stage order indexes
  const stageKeys = STAGES.map((s) => s.key);
  const getStageIndex = (stage: WorkOrderStage) => stageKeys.indexOf(stage);

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-rose-100 text-rose-800 border-rose-300 animate-pulse";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "MEDIUM":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-[1400px]">
        {STAGES.map((stageInfo) => {
          const ordersInStage = workOrders.filter((w) => w.stage === stageInfo.key);

          return (
            <div
              key={stageInfo.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stageInfo.key)}
              className={`flex-1 min-w-[280px] max-w-[320px] rounded-xl border ${stageInfo.border} ${stageInfo.bg} p-3 flex flex-col min-h-[600px] transition-all`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${stageInfo.color}`}>
                    {stageInfo.title}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-white/80 text-slate-700 shadow-sm border border-slate-200">
                    {ordersInStage.length}
                  </span>
                </div>
              </div>

              {/* Cards List Container */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {ordersInStage.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-300/60 rounded-lg text-slate-400 text-xs text-center p-3">
                    <span>Drop work orders here</span>
                  </div>
                ) : (
                  ordersInStage.map((order) => {
                    const stageIdx = getStageIndex(order.stage);
                    const prevStage = stageIdx > 0 ? stageKeys[stageIdx - 1] : null;
                    const nextStage = stageIdx < stageKeys.length - 1 ? stageKeys[stageIdx + 1] : null;

                    const progressPercent = Math.min(
                      100,
                      Math.round(((order.completedQuantity || 0) / order.targetQuantity) * 100)
                    );

                    const isUpdating = updatingId === order._id;

                    return (
                      <div
                        key={order._id}
                        draggable={!isUpdating}
                        onDragStart={(e) => handleDragStart(e, order._id)}
                        className={`bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative ${
                          isUpdating ? "opacity-60 pointer-events-none" : ""
                        }`}
                      >
                        {/* Header: Work Order Number & Priority */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-slate-900 tracking-tight">
                                {order.workOrderNumber}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-indigo-600 truncate max-w-[180px]">
                              {order.product?.name || "Product"}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getPriorityBadgeClass(
                              order.priority
                            )}`}
                          >
                            {order.priority}
                          </span>
                        </div>

                        {/* Factory Location & SKU */}
                        <div className="space-y-1 my-2 text-xs text-slate-600">
                          <div className="flex items-center gap-1 text-slate-500">
                            <FactoryIcon size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{order.factory?.name || "Factory"}</span>
                          </div>
                          {order.product?.sku && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Tag size={13} className="text-slate-400 shrink-0" />
                              <span>SKU: {order.product.sku}</span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar & Quantity metrics */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-slate-500 font-medium">Output:</span>
                            <span className="font-semibold text-slate-800">
                              {order.completedQuantity} / {order.targetQuantity} {order.unit}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>

                          {/* Scrap Count Tag */}
                          {order.scrapQuantity > 0 && (
                            <div className="flex items-center justify-between text-[11px] text-amber-700 mt-2 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <span className="flex items-center gap-1">
                                <AlertTriangle size={11} /> Scrap Logged:
                              </span>
                              <span className="font-bold">{order.scrapQuantity} {order.unit}</span>
                            </div>
                          )}
                        </div>

                        {/* Target Completion Date */}
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> Target:
                          </span>
                          <span className="font-medium text-slate-700">
                            {new Date(order.targetCompletionDate).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Quick Action Toolbar */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-4 gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenJobCard(order)}
                            title="Open Job Cards & Operator Stage Notes"
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors border border-slate-200"
                          >
                            <Wrench size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenConsumeMaterial(order)}
                            title="Log Raw Material Consumption"
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition-colors border border-slate-200"
                          >
                            <Boxes size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenRecordScrap(order)}
                            title="Log Scrap & Defect"
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-600 flex items-center justify-center transition-colors border border-slate-200"
                          >
                            <Trash2 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenCompleteOrder(order)}
                            title="Handover Finished Goods"
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-colors border border-slate-200"
                          >
                            <PackageCheck size={14} />
                          </button>
                        </div>

                        {/* Seamless Stage Advance / Retreat Buttons */}
                        <div className="mt-2 flex items-center justify-between gap-1 pt-1">
                          {prevStage ? (
                            <button
                              type="button"
                              onClick={() => onUpdateStage(order._id, prevStage)}
                              className="text-[10px] flex items-center gap-0.5 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                            >
                              <ArrowLeft size={11} /> Prev Stage
                            </button>
                          ) : (
                            <div />
                          )}

                          {nextStage ? (
                            <button
                              type="button"
                              onClick={() => onUpdateStage(order._id, nextStage)}
                              className="text-[10px] flex items-center gap-0.5 px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors"
                            >
                              Next Stage <ArrowRight size={11} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} /> Completed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkOrderKanbanBoard;
