import React, { useState, useEffect } from "react";
import { CreateWorkOrderInput, WorkOrderPriority } from "../../types/production";
import Modal from "../Modal";
import Button from "../Button";
import Input from "../Input";
import Select from "../Select";
import { api } from "../../services/api";

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkOrder: (input: CreateWorkOrderInput) => Promise<any>;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  isOpen,
  onClose,
  onCreateWorkOrder,
}) => {
  const [factories, setFactories] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; unit: string }[]>([]);

  const [factoryId, setFactoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [targetQuantity, setTargetQuantity] = useState<number | "">("");
  const [unit, setUnit] = useState("pcs");
  const [priority, setPriority] = useState<WorkOrderPriority>("MEDIUM");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [targetCompletionDate, setTargetCompletionDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      api
        .get<{ success: boolean; data: any[] }>("/factories")
        .then((res) => {
          if (res.success && res.data) {
            setFactories(res.data.map((f) => ({ id: f._id, name: f.name })));
            if (res.data.length > 0) setFactoryId(res.data[0]._id);
          }
        })
        .catch(() => {});

      api
        .get<{ success: boolean; data: any[] }>("/products")
        .then((res) => {
          if (res.success && res.data) {
            setProducts(res.data.map((p) => ({ id: p._id, name: p.name, unit: p.unit || "pcs" })));
            if (res.data.length > 0) {
              setProductId(res.data[0]._id);
              setUnit(res.data[0].unit || "pcs");
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleProductSelect = (id: string) => {
    setProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setUnit(prod.unit || "pcs");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryId || !productId || !targetQuantity || Number(targetQuantity) <= 0 || !targetCompletionDate) {
      setErrorMsg("Please fill in factory, target product, quantity, and completion date.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      await onCreateWorkOrder({
        factoryId,
        productId,
        targetQuantity: Number(targetQuantity),
        unit,
        priority,
        startDate,
        targetCompletionDate,
        notes,
      });
      onClose();
      // Reset
      setTargetQuantity("");
      setNotes("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create work order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Production Plan / Work Order">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Factory Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Manufacturing Factory <span className="text-rose-500">*</span>
          </label>
          <Select value={factoryId} onChange={(e) => setFactoryId(e.target.value)} required>
            <option value="">-- Select Factory Location --</option>
            {factories.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Target Product */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Finished Product to Manufacture <span className="text-rose-500">*</span>
          </label>
          <Select value={productId} onChange={(e) => handleProductSelect(e.target.value)} required>
            <option value="">-- Select Finished Good Product --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.unit})
              </option>
            ))}
          </Select>
        </div>

        {/* Target Quantity & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Target Batch Quantity (${unit}) *`}
            type="number"
            min="1"
            placeholder="100"
            value={targetQuantity}
            onChange={(e) => setTargetQuantity(e.target.value ? parseFloat(e.target.value) : "")}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Production Priority *
            </label>
            <Select value={priority} onChange={(e: any) => setPriority(e.target.value)}>
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="URGENT">Urgent Rush Order</option>
            </Select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Scheduled Start Date *"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <Input
            label="Target Completion Date *"
            type="date"
            value={targetCompletionDate}
            onChange={(e) => setTargetCompletionDate(e.target.value)}
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Production & Engineering Notes
          </label>
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            placeholder="Special instructions, tooling requirement, customer order ref..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Create Work Order
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateWorkOrderModal;
