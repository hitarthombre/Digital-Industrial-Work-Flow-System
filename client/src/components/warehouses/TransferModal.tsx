import React, { useState, useEffect } from "react";
import { Modal } from "../Modal";
import { Button } from "../Button";
import { api } from "../../services/api";
import type { IWarehouse, ITransferItem } from "../../types/warehouse";
import { ArrowRightLeft, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import "../../pages/warehouses/WarehousePages.css";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: IWarehouse[];
  initialSourceId?: string;
  onSuccess?: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  initialSourceId,
  onSuccess,
}) => {
  const [sourceId, setSourceId] = useState<string>("");
  const [destinationId, setDestinationId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<ITransferItem[]>([
    { itemCode: "", itemName: "", quantity: 1, unit: "units" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialSourceId) {
      setSourceId(initialSourceId);
    } else if (warehouses.length > 0) {
      setSourceId(warehouses[0]._id);
    }
  }, [initialSourceId, warehouses]);

  const availableDestinations = warehouses.filter((wh) => wh._id !== sourceId);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { itemCode: "", itemName: "", quantity: 1, unit: "units" },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ITransferItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const sourceWh = warehouses.find((w) => w._id === sourceId);
  const destWh = warehouses.find((w) => w._id === destinationId);

  const totalTransferQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!sourceId) {
      setError("Please select a source warehouse.");
      return;
    }
    if (!destinationId) {
      setError("Please select a destination warehouse.");
      return;
    }
    if (sourceId === destinationId) {
      setError("Source and destination warehouses cannot be the same.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemCode.trim()) {
        setError(`Item code is required for item row #${i + 1}`);
        return;
      }
      if (!items[i].itemName.trim()) {
        setError(`Item name is required for item row #${i + 1}`);
        return;
      }
      if (Number(items[i].quantity) < 1) {
        setError(`Quantity must be at least 1 for item row #${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        sourceWarehouseId: sourceId,
        destinationWarehouseId: destinationId,
        items: items.map((it) => ({
          itemCode: it.itemCode.trim().toUpperCase(),
          itemName: it.itemName.trim(),
          quantity: Number(it.quantity),
          unit: it.unit?.trim() || "units",
        })),
        notes: notes.trim() || undefined,
      };

      await api.post("/warehouses/transfer", payload);

      setSuccessMsg("Stock transfer executed successfully!");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to complete stock transfer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initiate Stock Transfer"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="wh-alert error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="wh-alert success">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Source & Destination Warehouses Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <label className="form-label required">Source Warehouse (From)</label>
            <select
              value={sourceId}
              onChange={(e) => {
                setSourceId(e.target.value);
                if (destinationId === e.target.value) {
                  setDestinationId("");
                }
              }}
              className="form-select"
              required
            >
              <option value="">-- Select Source Warehouse --</option>
              {warehouses.map((wh) => (
                <option key={wh._id} value={wh._id}>
                  {wh.name} ({wh.code}) - Used: {wh.currentUsage}/{wh.capacity}
                </option>
              ))}
            </select>
            {sourceWh && (
              <span className="text-xs text-slate-500 mt-1 block">
                Type: <strong className="uppercase">{sourceWh.type}</strong> • Current Usage: {sourceWh.currentUsage} units
              </span>
            )}
          </div>

          <div>
            <label className="form-label required">Destination Warehouse (To)</label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="form-select"
              required
            >
              <option value="">-- Select Destination Warehouse --</option>
              {availableDestinations.map((wh) => (
                <option key={wh._id} value={wh._id}>
                  {wh.name} ({wh.code}) - Avail: {Math.max(0, wh.capacity - wh.currentUsage)}
                </option>
              ))}
            </select>
            {destWh && (
              <span className="text-xs text-slate-500 mt-1 block">
                Type: <strong className="uppercase">{destWh.type}</strong> • Max Cap: {destWh.capacity} (Used: {destWh.currentUsage})
              </span>
            )}
          </div>
        </div>

        {/* Transfer Items Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">
              Transfer Item Inventory List
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded">
              Total Quantity: {totalTransferQty}
            </span>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="transfer-item-row">
                <div>
                  <input
                    type="text"
                    placeholder="Item Code (SKU-001)"
                    value={item.itemCode}
                    onChange={(e) => handleItemChange(index, "itemCode", e.target.value)}
                    className="form-input text-xs font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Item Description / Name"
                    value={item.itemName}
                    onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>
                <div>
                  <select
                    value={item.unit || "units"}
                    onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                    className="form-select text-xs"
                  >
                    <option value="units">units</option>
                    <option value="kg">kg</option>
                    <option value="boxes">boxes</option>
                    <option value="pallets">pallets</option>
                    <option value="liters">liters</option>
                  </select>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus size={14} />
            <span>Add Item Row</span>
          </button>
        </div>

        {/* Remarks / Notes */}
        <div>
          <label className="form-label">Transfer Remarks / Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reason for transfer, bill of lading reference, truck assignment..."
            className="form-textarea text-xs"
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="copper"
            loading={submitting}
            icon={<ArrowRightLeft size={16} />}
          >
            Execute Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransferModal;
