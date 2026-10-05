import React, { useState, useEffect } from "react";
import { WorkOrder, CompleteWorkOrderInput } from "../../types/production";
import Modal from "../Modal";
import Button from "../Button";
import Input from "../Input";
import Select from "../Select";
import { api } from "../../services/api";
import { PackageCheck, CheckCircle2, Warehouse } from "lucide-react";

interface ProductionCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
  onCompleteWorkOrder: (id: string, input: CompleteWorkOrderInput) => Promise<void>;
}

export const ProductionCompletionModal: React.FC<ProductionCompletionModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  onCompleteWorkOrder,
}) => {
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [completedQuantity, setCompletedQuantity] = useState<number | "">("");
  const [scrapQuantity, setScrapQuantity] = useState<number | "">("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && workOrder) {
      setCompletedQuantity(workOrder.targetQuantity - (workOrder.scrapQuantity || 0));
      setScrapQuantity(workOrder.scrapQuantity || 0);

      api
        .get<{ success: boolean; data: any[] }>("/warehouses")
        .then((res) => {
          if (res.success && res.data) {
            setWarehouses(res.data.map((w) => ({ id: w._id, name: w.name })));
            if (res.data.length > 0) {
              setSelectedWarehouseId(res.data[0]._id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, workOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrder) return;

    setSubmitting(true);
    setErrorMsg("");
    try {
      await onCompleteWorkOrder(workOrder._id, {
        completedQuantity: Number(completedQuantity),
        scrapQuantity: Number(scrapQuantity),
        warehouseId: selectedWarehouseId || undefined,
        notes,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to finalize work order completion");
    } finally {
      setSubmitting(false);
    }
  };

  if (!workOrder) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Handover Finished Goods (${workOrder.workOrderNumber})`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-start gap-3 text-xs text-emerald-900">
          <PackageCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Finalize Work Order Completion</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Completing this work order will mark stage as COMPLETED and automatically add <strong>{completedQuantity || 0} {workOrder.unit}</strong> of <strong>{workOrder.product?.name}</strong> to the designated warehouse inventory.
            </p>
          </div>
        </div>

        {/* Quantities */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Final Good Output (${workOrder.unit}) *`}
            type="number"
            min="0"
            step="any"
            value={completedQuantity}
            onChange={(e) => setCompletedQuantity(e.target.value ? parseFloat(e.target.value) : "")}
            required
          />

          <Input
            label={`Total Scrap (${workOrder.unit})`}
            type="number"
            min="0"
            step="any"
            value={scrapQuantity}
            onChange={(e) => setScrapQuantity(e.target.value ? parseFloat(e.target.value) : "")}
          />
        </div>

        {/* Destination Warehouse for Stock Addition */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Destination Finished Goods Warehouse
          </label>
          <Select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
          >
            <option value="">-- Do Not Handover to Inventory --</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Final Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Handover & Quality Inspection Sign-off Notes
          </label>
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={3}
            placeholder="Passed final QA testing. Batch ready for store entry..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting} className="bg-emerald-600 hover:bg-emerald-700">
            Handover & Complete Order
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductionCompletionModal;
