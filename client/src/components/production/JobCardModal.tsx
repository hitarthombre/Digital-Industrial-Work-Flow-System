import React, { useState } from "react";
import { WorkOrder, JobCard } from "../../types/production";
import Modal from "../Modal";
import Button from "../Button";
import { Wrench, CheckCircle, Clock, User, FileText, Check } from "lucide-react";

interface JobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
  onUpdateStage: (id: string, stage: any) => Promise<void>;
}

export const JobCardModal: React.FC<JobCardModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  onUpdateStage,
}) => {
  const [operatorName, setOperatorName] = useState("");
  const [stageNotes, setStageNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!workOrder) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Job Cards: ${workOrder.workOrderNumber}`}>
      <div className="space-y-6">
        {/* Work Order Info Header */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{workOrder.product?.name}</h4>
            <p className="text-xs text-slate-500">
              Factory: {workOrder.factory?.name} | Target: {workOrder.targetQuantity} {workOrder.unit}
            </p>
          </div>
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
            Stage: {workOrder.stage.replace("_", " ")}
          </span>
        </div>

        {/* Job Cards List */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench size={14} className="text-indigo-600" /> Stage Job Cards & Operator Workflow
          </h5>

          {workOrder.jobCards && workOrder.jobCards.length > 0 ? (
            <div className="space-y-2.5">
              {workOrder.jobCards.map((card, idx) => (
                <div
                  key={card._id || idx}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start justify-between gap-4 shadow-2xs hover:border-indigo-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{card.stageName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          card.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : card.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {card.status}
                      </span>
                    </div>
                    {card.notes && <p className="text-xs text-slate-600 mt-1">{card.notes}</p>}
                    {card.assignedOperator && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <User size={12} /> Operator: <span className="font-medium text-slate-700">{card.assignedOperator}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    {card.startedAt && <div>Started: {new Date(card.startedAt).toLocaleTimeString()}</div>}
                    {card.completedAt && (
                      <div className="text-emerald-600 font-medium">
                        Completed: {new Date(card.completedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No job cards initialized for this order.</p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default JobCardModal;
