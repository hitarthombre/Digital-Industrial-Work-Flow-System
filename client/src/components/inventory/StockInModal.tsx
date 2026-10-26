import React, { useState } from "react";
import {
  ArrowDownLeft,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  X,
  Building2,
  Package,
  Layers,
  FileText,
  SlidersHorizontal,
  IndianRupee,
} from "lucide-react";
import type { StockInInput } from "../../services/inventoryService";
import { formatMoney } from "../../utils/format";

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

  const calculatedTotal = (formData.quantity || 0) * (formData.unitCost || 0);

  return (
    <div className="diws-modal-backdrop" onClick={onClose}>
      <div
        className="diws-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "620px" }}
      >
        {/* Header */}
        <div className="diws-modal-header bg-gradient-to-r from-emerald-50 to-teal-50/60 border-b border-emerald-200/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/15 text-emerald-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <ArrowDownLeft size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-emerald-950 m-0">Record Stock In</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 uppercase tracking-wide">
                  Goods Receipt
                </span>
              </div>
              <p className="text-xs text-emerald-800/80 mt-0.5 m-0">
                Receive and log incoming materials or finished products into warehouse inventory.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="diws-modal-close hover:bg-emerald-200/50"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="diws-modal-body">
            {submitError && (
              <div className="inv-error-alert">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* SECTION 1: Warehouse Location */}
            <div className="inv-form-section">
              <div className="inv-form-section-title">
                <Building2 size={13} className="text-emerald-700" />
                <span>Target Warehouse Location</span>
              </div>

              <div className="inv-form-group">
                <label className="inv-form-label">
                  <span>Target Warehouse <span className="text-rose-600">*</span></span>
                </label>
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
            </div>

            {/* SECTION 2: Item Information */}
            <div className="inv-form-section">
              <div className="inv-form-section-title">
                <Package size={13} className="text-emerald-700" />
                <span>Item Identification & Category</span>
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label className="inv-form-label">
                    <span>SKU Code <span className="text-rose-600">*</span></span>
                  </label>
                  <input
                    type="text"
                    className={`inv-form-input font-mono font-bold ${errors.sku ? "is-invalid" : ""}`}
                    placeholder="e.g. RM-STL-316L"
                    value={formData.sku}
                    onChange={(e) => handleChange("sku", e.target.value.toUpperCase())}
                  />
                  {errors.sku && <span className="inv-field-error">{errors.sku}</span>}
                </div>

                <div className="inv-form-group">
                  <label className="inv-form-label">
                    <span>Item Category</span>
                  </label>
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
                <label className="inv-form-label">
                  <span>Item Description / Name <span className="text-rose-600">*</span></span>
                </label>
                <input
                  type="text"
                  className={`inv-form-input ${errors.itemName ? "is-invalid" : ""}`}
                  placeholder="e.g. Stainless Steel Sheet 316L (2mm)"
                  value={formData.itemName}
                  onChange={(e) => handleChange("itemName", e.target.value)}
                />
                {errors.itemName && <span className="inv-field-error">{errors.itemName}</span>}
              </div>
            </div>

            {/* SECTION 3: Quantity & Inward Valuation */}
            <div className="inv-form-section">
              <div className="inv-form-section-title">
                <Layers size={13} className="text-emerald-700" />
                <span>Quantity Received & Cost Valuation</span>
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label className="inv-form-label">
                    <span>Quantity Received <span className="text-rose-600">*</span></span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    className={`inv-form-input font-bold text-base ${errors.quantity ? "is-invalid" : ""}`}
                    value={formData.quantity}
                    onChange={(e) => handleChange("quantity", Number(e.target.value))}
                  />
                  {errors.quantity && <span className="inv-field-error">{errors.quantity}</span>}
                </div>

                <div className="inv-form-group">
                  <label className="inv-form-label">
                    <span>Unit of Measure</span>
                  </label>
                  <input
                    type="text"
                    className="inv-form-input"
                    placeholder="pcs, sheets, kg..."
                    value={formData.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                  />
                </div>

                <div className="inv-form-group">
                  <label className="inv-form-label">
                    <span>Unit Cost (₹)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="inv-form-input font-mono"
                    value={formData.unitCost}
                    onChange={(e) => handleChange("unitCost", Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Valuation Impact Banner */}
              <div className="inv-val-preview-box">
                <div className="flex items-center gap-2">
                  <IndianRupee size={16} className="text-emerald-700" />
                  <span>Total Inward Valuation Impact:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-800 font-normal">
                    ({formData.quantity} {formData.unit} @ {formatMoney(formData.unitCost)})
                  </span>
                  <strong className="text-base text-emerald-950 font-mono font-extrabold">
                    {formatMoney(calculatedTotal)}
                  </strong>
                </div>
              </div>
            </div>

            {/* SECTION 4: Storage Controls & Thresholds */}
            <div className="inv-form-section">
              <div className="inv-form-section-title">
                <SlidersHorizontal size={13} className="text-emerald-700" />
                <span>Storage Controls & Safety Thresholds</span>
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label className="inv-form-label">
                    <span>Min Stock Threshold</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="inv-form-input"
                    value={formData.minThreshold}
                    onChange={(e) => handleChange("minThreshold", Number(e.target.value))}
                  />
                </div>

                <div className="inv-form-group">
                  <label className="inv-form-label">
                    <span>Warehouse Bin / Rack</span>
                  </label>
                  <input
                    type="text"
                    className="inv-form-input"
                    placeholder="e.g. Rack A-04, Bin 12"
                    value={formData.locationInWarehouse}
                    onChange={(e) => handleChange("locationInWarehouse", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: Purchase Traceability & Notes */}
            <div className="inv-form-section">
              <div className="inv-form-section-title">
                <FileText size={13} className="text-emerald-700" />
                <span>Purchase Traceability & Notes</span>
              </div>

              <div className="inv-form-group">
                <label className="inv-form-label">
                  <span>Reference # / Purchase Order</span>
                  <button
                    type="button"
                    onClick={handleGenerateRef}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={12} /> Auto-Generate
                  </button>
                </label>
                <input
                  type="text"
                  className="inv-form-input font-mono"
                  placeholder="e.g. PO-RECEIPT-9081"
                  value={formData.referenceNumber}
                  onChange={(e) => handleChange("referenceNumber", e.target.value)}
                />
              </div>

              <div className="inv-form-group">
                <label className="inv-form-label">
                  <span>Reason / Receipt Note</span>
                </label>
                <input
                  type="text"
                  className="inv-form-input"
                  placeholder="e.g. Supplier Purchase Delivery from Vendor"
                  value={formData.reason}
                  onChange={(e) => handleChange("reason", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="diws-modal-footer">
            <button
              type="button"
              className="diws-btn diws-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="diws-btn diws-btn-primary flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="diws-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Recording Stock In...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirm & Receive Stock</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockInModal;
