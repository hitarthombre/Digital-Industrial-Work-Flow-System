import React, { useState } from "react";
import { ArrowDownLeft, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import type { StockInInput } from "../../services/inventoryService";

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: any[];
  onSuccess: () => void;
  onSubmit: (input: StockInInput) => Promise<any>;
  initialData?: { sku?: string; itemName?: string; itemCategory?: string };
}

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  onSuccess,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<StockInInput>({
    warehouseId: warehouses[0]?._id || "",
    sku: initialData?.sku || "",
    itemName: initialData?.itemName || "",
    itemCategory: (initialData?.itemCategory as any) || "finished_goods",
    quantity: 1,
    unit: "pcs",
    unitCost: 0,
    minThreshold: 10,
    maxThreshold: 500,
    locationInWarehouse: "",
    referenceNumber: `PO-REC-${Date.now().toString().slice(-4)}`,
    reason: "Supplier Purchase Receipt",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.warehouseId) errs.warehouseId = "Target warehouse selection is required";
    if (!formData.sku.trim()) errs.sku = "SKU Code is required";
    if (!formData.itemName.trim()) errs.itemName = "Item Name is required";
    if (!formData.quantity || formData.quantity <= 0) errs.quantity = "Quantity must be greater than 0";
    if (formData.unitCost !== undefined && formData.unitCost < 0) errs.unitCost = "Unit cost cannot be negative";
    return errs;
  };

  const handleChange = (field: keyof StockInInput, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    // Real-time validation update
    const errs = { ...errors };
    if (field === "sku" && value.trim()) delete errs.sku;
    if (field === "itemName" && value.trim()) delete errs.itemName;
    if (field === "warehouseId" && value) delete errs.warehouseId;
    if (field === "quantity" && value > 0) delete errs.quantity;
    setErrors(errs);
  };

  const handleGenerateRef = () => {
    handleChange("referenceNumber", `PO-REC-${Date.now().toString().slice(-6)}`);
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
      await onSubmit(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to record stock in transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedTotal = ((formData.quantity || 0) * (formData.unitCost || 0)).toFixed(2);

  return (
    <div className="diws-modal-backdrop" onClick={onClose}>
      <div className="diws-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <div className="diws-modal-header bg-emerald-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <ArrowDownLeft size={22} />
            </div>
            <div>
              <h3 className="diws-modal-title text-emerald-900">Record Stock In (Goods Receipt)</h3>
              <p className="text-xs text-emerald-700">Receive inventory items into warehouse stock.</p>
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

            <div className="inv-form-group">
              <label className="inv-form-label">Target Warehouse *</label>
              <select
                className={`inv-form-input ${errors.warehouseId ? "is-invalid" : ""}`}
                value={formData.warehouseId}
                onChange={(e) => handleChange("warehouseId", e.target.value)}
              >
                <option value="">Select Target Warehouse Location</option>
                {warehouses.map((wh) => (
                  <option key={wh._id} value={wh._id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
              {errors.warehouseId && <span className="inv-field-error">{errors.warehouseId}</span>}
            </div>

            <div className="inv-form-row">
              <div className="inv-form-group">
                <label className="inv-form-label">SKU Code *</label>
                <input
                  type="text"
                  className={`inv-form-input ${errors.sku ? "is-invalid" : ""}`}
                  placeholder="e.g. RM-STL-316L"
                  value={formData.sku}
                  onChange={(e) => handleChange("sku", e.target.value.toUpperCase())}
                />
                {errors.sku && <span className="inv-field-error">{errors.sku}</span>}
              </div>

              <div className="inv-form-group">
                <label className="inv-form-label">Item Category</label>
                <select
                  className="inv-form-input"
                  value={formData.itemCategory}
                  onChange={(e) => handleChange("itemCategory", e.target.value as any)}
                >
                  <option value="raw_material">Raw Material</option>
                  <option value="finished_goods">Finished Goods</option>
                  <option value="packaging">Packaging</option>
                  <option value="components">Components</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="inv-form-group">
              <label className="inv-form-label">Item Name *</label>
              <input
                type="text"
                className={`inv-form-input ${errors.itemName ? "is-invalid" : ""}`}
                placeholder="e.g. Stainless Steel Sheet 316L (2mm)"
                value={formData.itemName}
                onChange={(e) => handleChange("itemName", e.target.value)}
              />
              {errors.itemName && <span className="inv-field-error">{errors.itemName}</span>}
            </div>

            <div className="inv-form-row">
              <div className="inv-form-group">
                <label className="inv-form-label">Quantity Received *</label>
                <input
                  type="number"
                  min={1}
                  className={`inv-form-input ${errors.quantity ? "is-invalid" : ""}`}
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", Number(e.target.value))}
                />
                {errors.quantity && <span className="inv-field-error">{errors.quantity}</span>}
              </div>

              <div className="inv-form-group">
                <label className="inv-form-label">Unit of Measure</label>
                <input
                  type="text"
                  className="inv-form-input"
                  placeholder="pcs, sheets, kg..."
                  value={formData.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                />
              </div>

              <div className="inv-form-group">
                <label className="inv-form-label">Unit Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className="inv-form-input"
                  value={formData.unitCost}
                  onChange={(e) => handleChange("unitCost", Number(e.target.value))}
                />
              </div>
            </div>

            {/* Valuation Preview Badge */}
            <div className="inv-val-preview-box">
              <span>Total Receipt Valuation Impact:</span>
              <strong className="text-emerald-700">${calculatedTotal}</strong>
            </div>

            <div className="inv-form-row">
              <div className="inv-form-group">
                <label className="inv-form-label">Min Stock Threshold</label>
                <input
                  type="number"
                  min={0}
                  className="inv-form-input"
                  value={formData.minThreshold}
                  onChange={(e) => handleChange("minThreshold", Number(e.target.value))}
                />
              </div>

              <div className="inv-form-group">
                <label className="inv-form-label">Warehouse Bin / Rack</label>
                <input
                  type="text"
                  className="inv-form-input"
                  placeholder="e.g. Rack A-04"
                  value={formData.locationInWarehouse}
                  onChange={(e) => handleChange("locationInWarehouse", e.target.value)}
                />
              </div>
            </div>

            <div className="inv-form-group">
              <label className="inv-form-label flex justify-between items-center">
                <span>Reference # / Purchase Order</span>
                <button
                  type="button"
                  onClick={handleGenerateRef}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Sparkles size={12} /> Auto-Generate
                </button>
              </label>
              <input
                type="text"
                className="inv-form-input"
                placeholder="e.g. PO-RECEIPT-9081"
                value={formData.referenceNumber}
                onChange={(e) => handleChange("referenceNumber", e.target.value)}
              />
            </div>

            <div className="inv-form-group">
              <label className="inv-form-label">Reason / Receipt Note</label>
              <input
                type="text"
                className="inv-form-input"
                placeholder="e.g. Supplier Purchase Delivery from TitanCraft"
                value={formData.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
              />
            </div>
          </div>

          <div className="diws-modal-footer">
            <button type="button" className="diws-btn diws-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="diws-btn diws-btn-success" disabled={isSubmitting}>
              {isSubmitting ? (
                "Recording Stock In..."
              ) : (
                <>
                  <CheckCircle2 size={16} /> Confirm & Receive Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
