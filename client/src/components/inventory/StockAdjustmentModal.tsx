import React, { useState, useEffect } from "react";
import { SlidersHorizontal, AlertCircle, CheckCircle2 } from "lucide-react";
import type { StockAdjustmentInput, StockLevelItem } from "../../services/inventoryService";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: any[];
  stockItems: StockLevelItem[];
  onSuccess: () => void;
  onSubmit: (input: StockAdjustmentInput) => Promise<any>;
  initialData?: { sku?: string; itemName?: string };
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  stockItems,
  onSuccess,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<StockAdjustmentInput>({
    warehouseId: warehouses[0]?._id || "",
    sku: initialData?.sku || "",
    itemName: initialData?.itemName || "",
    newQuantity: 0,
    unitCost: 0,
    reason: "Cycle Count Reconcile Audit",
    notes: "",
  });

  const [previousQty, setPreviousQty] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (formData.sku.trim()) {
      const match = stockItems.find(
        (i) => i.sku.toUpperCase() === formData.sku.trim().toUpperCase()
      );
      if (match) {
        setPreviousQty(match.currentStock);
        setUnitCost(match.unitCost || 0);
        if (!formData.itemName || formData.itemName !== match.itemName) {
          setFormData((prev) => ({
            ...prev,
            itemName: match.itemName,
            unitCost: match.unitCost,
          }));
        }
      } else {
        setPreviousQty(0);
      }
    } else {
      setPreviousQty(0);
    }
  }, [formData.sku, stockItems]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.warehouseId) errs.warehouseId = "Target warehouse selection is required";
    if (!formData.sku.trim()) errs.sku = "SKU Code is required";
    if (!formData.itemName.trim()) errs.itemName = "Item Name is required";
    if (formData.newQuantity === undefined || formData.newQuantity < 0) {
      errs.newQuantity = "New quantity cannot be negative";
    }
    if (!formData.reason.trim()) errs.reason = "Adjustment reason is mandatory for audit trail";
    return errs;
  };

  const handleChange = (field: keyof StockAdjustmentInput, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    const errs = { ...errors };
    if (field === "sku" && value.trim()) delete errs.sku;
    if (field === "itemName" && value.trim()) delete errs.itemName;
    if (field === "warehouseId" && value) delete errs.warehouseId;
    if (field === "newQuantity" && value >= 0) delete errs.newQuantity;
    if (field === "reason" && value.trim()) delete errs.reason;
    setErrors(errs);
  };

  const handleSelectSkuOption = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSku = e.target.value;
    if (!selectedSku) return;
    const match = stockItems.find((i) => i.sku === selectedSku);
    if (match) {
      setFormData((prev) => ({
        ...prev,
        sku: match.sku,
        itemName: match.itemName,
        newQuantity: match.currentStock,
        unitCost: match.unitCost,
      }));
      setPreviousQty(match.currentStock);
      setUnitCost(match.unitCost || 0);
    }
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
        ...formData,
        unitCost,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to record stock adjustment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const difference = formData.newQuantity - previousQty;
  const valuationImpact = (Math.abs(difference) * unitCost).toFixed(2);

  return (
    <div className="diws-modal-backdrop" onClick={onClose}>
      <div className="diws-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <div className="diws-modal-header bg-purple-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <SlidersHorizontal size={22} />
            </div>
            <div>
              <h3 className="diws-modal-title text-purple-900">Record Stock Adjustment</h3>
              <p className="text-xs text-purple-700">Manual cycle count reconciliation & audit correction.</p>
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
                <option value="">Select Warehouse Location</option>
                {warehouses.map((wh) => (
                  <option key={wh._id} value={wh._id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
              {errors.warehouseId && <span className="inv-field-error">{errors.warehouseId}</span>}
            </div>

            {/* Quick Catalog Picker */}
            {stockItems.length > 0 && (
              <div className="inv-form-group">
                <label className="inv-form-label">Select SKU to Reconcile</label>
                <select
                  className="inv-form-input bg-slate-50"
                  value={formData.sku}
                  onChange={handleSelectSkuOption}
                >
                  <option value="">-- Choose Stock Item --</option>
                  {stockItems.map((item) => (
                    <option key={item.sku} value={item.sku}>
                      {item.sku} - {item.itemName} (Current System Qty: {item.currentStock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="inv-form-row">
              <div className="inv-form-group">
                <label className="inv-form-label">SKU Code *</label>
                <input
                  type="text"
                  className={`inv-form-input ${errors.sku ? "is-invalid" : ""}`}
                  placeholder="e.g. RM-ALU-6061"
                  value={formData.sku}
                  onChange={(e) => handleChange("sku", e.target.value.toUpperCase())}
                />
                {errors.sku && <span className="inv-field-error">{errors.sku}</span>}
              </div>

              <div className="inv-form-group">
                <label className="inv-form-label">Item Name *</label>
                <input
                  type="text"
                  className={`inv-form-input ${errors.itemName ? "is-invalid" : ""}`}
                  placeholder="Item Name"
                  value={formData.itemName}
                  onChange={(e) => handleChange("itemName", e.target.value)}
                />
                {errors.itemName && <span className="inv-field-error">{errors.itemName}</span>}
              </div>
            </div>

            {/* Reconciliation Comparison Box */}
            <div className="inv-recon-box">
              <div className="inv-recon-col">
                <span className="inv-recon-label">Previous System Qty</span>
                <span className="inv-recon-val">{previousQty}</span>
              </div>
              <div className="inv-recon-divider">&rarr;</div>
              <div className="inv-recon-col">
                <span className="inv-recon-label">New Actual Physical Qty</span>
                <input
                  type="number"
                  min={0}
                  className={`inv-form-input inv-recon-input ${errors.newQuantity ? "is-invalid" : ""}`}
                  value={formData.newQuantity}
                  onChange={(e) => handleChange("newQuantity", Number(e.target.value))}
                />
              </div>
              <div className="inv-recon-col highlight">
                <span className="inv-recon-label">Net Difference</span>
                <span className={`inv-recon-diff ${difference >= 0 ? "positive" : "negative"}`}>
                  {difference >= 0 ? `+${difference}` : difference}
                </span>
              </div>
            </div>
            {errors.newQuantity && <span className="inv-field-error">{errors.newQuantity}</span>}

            <div className="inv-val-preview-box mt-3">
              <span>Financial Adjustment Impact:</span>
              <strong className={difference >= 0 ? "text-emerald-700" : "text-red-700"}>
                {difference >= 0 ? "+" : "-"}${valuationImpact}
              </strong>
            </div>

            <div className="inv-form-group mt-3">
              <label className="inv-form-label">Adjustment Reason *</label>
              <select
                className={`inv-form-input ${errors.reason ? "is-invalid" : ""}`}
                value={formData.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
              >
                <option value="Cycle Count Reconcile Audit">Cycle Count Reconcile Audit</option>
                <option value="Damaged Stock Written Off">Damaged Stock Written Off</option>
                <option value="Found Uncounted Inventory">Found Uncounted Inventory</option>
                <option value="Scrap / Production Defect">Scrap / Production Defect</option>
                <option value="Supplier Quantity Discrepancy">Supplier Quantity Discrepancy</option>
                <option value="Other Manual Correction">Other Manual Correction</option>
              </select>
              {errors.reason && <span className="inv-field-error">{errors.reason}</span>}
            </div>

            <div className="inv-form-group">
              <label className="inv-form-label">Audit Notes & Inspection Comments</label>
              <textarea
                className="inv-form-input"
                rows={2}
                placeholder="Details of physical verification or supervisor approval..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>
          </div>

          <div className="diws-modal-footer">
            <button type="button" className="diws-btn diws-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="diws-btn diws-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                "Saving Adjustment..."
              ) : (
                <>
                  <CheckCircle2 size={16} /> Confirm & Apply Adjustment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
