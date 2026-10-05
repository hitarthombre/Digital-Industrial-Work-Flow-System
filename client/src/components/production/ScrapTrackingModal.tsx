import React, { useState } from "react";
import { WorkOrder, RecordScrapInput } from "../../types/production";
import Modal from "../Modal";
import Button from "../Button";
import Input from "../Input";
import Select from "../Select";
import { Trash2, AlertOctagon } from "lucide-react";

interface ScrapTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
  onRecordScrap: (id: string, input: RecordScrapInput) => Promise<void>;
}

export const ScrapTrackingModal: React.FC<ScrapTrackingModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  onRecordScrap,
}) => {
  const [materialOrProduct, setMaterialOrProduct] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState<RecordScrapInput["reason"]>("OPERATOR_ERROR");
  const [stage, setStage] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrder) return;
    if (!materialOrProduct || !quantity || Number(quantity) <= 0) {
      setErrorMsg("Please fill in item description and scrap quantity.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      await onRecordScrap(workOrder._id, {
        materialOrProduct,
        quantity: Number(quantity),
        reason,
        stage: stage || workOrder.stage,
        notes,
      });
      onClose();
      // Reset
      setMaterialOrProduct("");
      setQuantity("");
      setNotes("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log scrap defect");
    } finally {
      setSubmitting(false);
    }
  };

  if (!workOrder) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Scrap & Defect (${workOrder.workOrderNumber})`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-xs text-amber-900">
          <AlertOctagon size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p>
            Scrap logging records material waste or defective units during production. This will adjust the expected yield rate for this work order.
          </p>
        </div>

        {/* Item Description */}
        <Input
          label="Scrap Material / Defective Part Name *"
          placeholder="e.g. Scratched Metal Casing / Damaged PCB"
          value={materialOrProduct}
          onChange={(e) => setMaterialOrProduct(e.target.value)}
          required
        />

        {/* Quantity & Reason */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Scrap Quantity (${workOrder.unit}) *`}
            type="number"
            min="0.01"
            step="any"
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : "")}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Defect Reason *
            </label>
            <Select value={reason} onChange={(e: any) => setReason(e.target.value)}>
              <option value="OPERATOR_ERROR">Operator Error</option>
              <option value="DEFECTIVE_RAW_MATERIAL">Defective Raw Material</option>
              <option value="MACHINE_MALFUNCTION">Machine Malfunction</option>
              <option value="TESTING_LOSS">Testing Loss / QA Failure</option>
              <option value="OTHER">Other Reason</option>
            </Select>
          </div>
        </div>

        {/* Stage selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Production Stage Where Defect Occurred
          </label>
          <Input
            placeholder="e.g. Machining / Assembly"
            value={stage || workOrder.stage}
            onChange={(e) => setStage(e.target.value)}
          />
        </div>

        {/* Detailed Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Root Cause & Inspection Notes
          </label>
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            placeholder="Describe what went wrong and corrective measures..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting} className="bg-amber-600 hover:bg-amber-700">
            Log Defect Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ScrapTrackingModal;
