import React, { useState } from "react";
import { ArrowLeftRight, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { StockTransferInput, TransferItemInput, StockLevelItem } from "../../services/inventoryService";

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: any[];
  stockItems: StockLevelItem[];
  onSuccess: () => void;
  onSubmit: (input: StockTransferInput) => Promise<any>;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  stockItems,
  onSuccess,
  onSubmit,
}) => {
  const [sourceWarehouseId, setSourceWarehouseId] = useState(warehouses[0]?._id || "");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState(warehouses[1]?._id || "");
  const [referenceNumber, setReferenceNumber] = useState(`TRF-${Date.now().toString().slice(-4)}`);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<TransferItemInput[]>([
    { sku: "", itemName: "", quantity: 1, unit: "pcs" },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { sku: "", itemName: "", quantity: 1, unit: "pcs" }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof TransferItemInput, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === "sku" && value.trim()) {
      const match = stockItems.find((i) => i.sku.toUpperCase() === value.trim().toUpperCase());
      if (match) {
        updated[index].itemName = match.itemName;
        updated[index].unit = match.unit;
      }
    }

    setItems(updated);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!sourceWarehouseId) errs.sourceWarehouseId = "Source warehouse is required";
    if (!destinationWarehouseId) errs.destinationWarehouseId = "Destination warehouse is required";
    if (sourceWarehouseId === destinationWarehouseId) {
      errs.destinationWarehouseId = "Source and Destination warehouses cannot be the same location";
    }

    if (!items || items.length === 0) {
      errs.items = "At least one item is required for transfer";
    } else {
      items.forEach((item, idx) => {
        if (!item.sku.trim()) errs[`sku_${idx}`] = "SKU Code required";
        if (!item.quantity || item.quantity <= 0) errs[`qty_${idx}`] = "Quantity must be > 0";
      });
    }

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        sourceWarehouseId,
        destinationWarehouseId,
        items,
        referenceNumber,
        notes,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to execute stock transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="diws-modal-backdrop" onClick={onClose}>
      <div className="diws-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
        <div className="diws-modal-header bg-blue-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <ArrowLeftRight size={22} />
            </div>
            <div>
              <h3 className="diws-modal-title text-blue-900">Inter-Warehouse Stock Transfer</h3>
              <p className="text-xs text-blue-700">Relocate stock items between factory and warehouse facilities.</p>
            </div>
          </div>
          <button type="button" className="diws-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="diws-modal-body">
            {submitError && (
              <div className="inv-error-alert">
                <AlertCircle size={16} /> {submitError}
              </div>
            )}

            <div className="inv-form-row">
              <div className="inv-form-group">
                <label className="inv-form-label">Source Warehouse (From) *</label>
                <select
                  className={`inv-form-input ${errors.sourceWarehouseId ? "is-invalid" : ""}`}
                  value={sourceWarehouseId}
                  onChange={(e) => setSourceWarehouseId(e.target.value)}
                >
                  <option value="">Select Source Location</option>
                  {warehouses.map((wh) => (
                    <option key={wh._id} value={wh._id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
                {errors.sourceWarehouseId && <span className="inv-field-error">{errors.sourceWarehouseId}</span>}
              </div>

              <div className="inv-form-group">
                <label className="inv-form-label">Destination Warehouse (To) *</label>
                <select
                  className={`inv-form-input ${errors.destinationWarehouseId ? "is-invalid" : ""}`}
                  value={destinationWarehouseId}
                  onChange={(e) => setDestinationWarehouseId(e.target.value)}
                >
                  <option value="">Select Destination Location</option>
                  {warehouses.map((wh) => (
                    <option key={wh._id} value={wh._id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
                {errors.destinationWarehouseId && (
                  <span className="inv-field-error">{errors.destinationWarehouseId}</span>
                )}
              </div>
            </div>

            <div className="inv-transfer-items-header">
              <span className="font-semibold text-slate-800 text-sm">Transfer Manifest Items</span>
              <button
                type="button"
                className="diws-btn diws-btn-secondary diws-btn-sm"
                onClick={handleAddItemRow}
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            {errors.items && <div className="inv-field-error mb-2">{errors.items}</div>}

            <div className="inv-transfer-table-wrap">
              <table className="inv-transfer-table">
                <thead>
                  <tr>
                    <th>SKU Code *</th>
                    <th>Item Name</th>
                    <th>Qty *</th>
                    <th>Unit</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          className={`inv-form-input inv-table-input ${
                            errors[`sku_${idx}`] ? "is-invalid" : ""
                          }`}
                          placeholder="e.g. RM-STL-316L"
                          value={item.sku}
                          onChange={(e) => handleItemChange(idx, "sku", e.target.value.toUpperCase())}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inv-form-input inv-table-input"
                          placeholder="Item Name"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                        />
                      </td>
                      <td style={{ width: "90px" }}>
                        <input
                          type="number"
                          min={1}
                          className={`inv-form-input inv-table-input ${
                            errors[`qty_${idx}`] ? "is-invalid" : ""
                          }`}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                        />
                      </td>
                      <td style={{ width: "80px" }}>
                        <input
                          type="text"
                          className="inv-form-input inv-table-input"
                          value={item.unit || "pcs"}
                          onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="inv-icon-btn danger"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={items.length <= 1}
                          title="Remove Line"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="inv-form-group mt-4">
              <label className="inv-form-label">Transfer Order / Manifest Reference #</label>
              <input
                type="text"
                className="inv-form-input"
                placeholder="e.g. TRF-9088"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>

            <div className="inv-form-group">
              <label className="inv-form-label">Transfer Instructions / Notes</label>
              <textarea
                className="inv-form-input"
                rows={2}
                placeholder="Special transport or handling notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="diws-modal-footer">
            <button type="button" className="diws-btn diws-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="diws-btn diws-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                "Executing Transfer..."
              ) : (
                <>
                  <CheckCircle2 size={16} /> Execute Stock Transfer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
