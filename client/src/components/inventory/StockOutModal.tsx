import React, { useState, useEffect } from "react";
import {
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Building2,
  Package,
  Layers,
  FileText,
} from "lucide-react";
import type { StockOutInput, StockLevelItem } from "../../services/inventoryService";
import { formatMoney } from "../../utils/format";

interface StockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: any[];
  stockItems: StockLevelItem[];
  onSuccess: () => void;
  onSubmit: (input: StockOutInput) => Promise<any>;
  initialData?: { sku?: string; itemName?: string; itemCategory?: string };
}

export const StockOutModal: React.FC<StockOutModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  stockItems,
  onSuccess,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<StockOutInput>({
    warehouseId: warehouses[0]?._id || "",
    sku: initialData?.sku || "",
    itemName: initialData?.itemName || "",
    itemCategory: (initialData?.itemCategory as any) || "finished_goods",
    quantity: 1,
    unit: "pcs",
    referenceNumber: `DISPATCH-${Date.now().toString().slice(-4)}`,
    reason: "Sales Order Dispatch",
    notes: "",
  });

  const [selectedStockItem, setSelectedStockItem] = useState<StockLevelItem | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (formData.sku.trim()) {
      const match = stockItems.find(
        (i) => i.sku.toUpperCase() === formData.sku.trim().toUpperCase()
      );
      if (match) {
        setSelectedStockItem(match);
        if (!formData.itemName || formData.itemName !== match.itemName) {
          setFormData((prev) => ({
            ...prev,
            itemName: match.itemName,
            itemCategory: match.itemCategory,
            unit: match.unit,
          }));
        }
      } else {
        setSelectedStockItem(null);
      }
    } else {
      setSelectedStockItem(null);
    }
  }, [formData.sku, stockItems]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.warehouseId) errs.warehouseId = "Warehouse location is required";
    if (!formData.sku.trim()) errs.sku = "SKU Code is required";
    if (!formData.quantity || formData.quantity <= 0) errs.quantity = "Quantity must be greater than 0";

    if (selectedStockItem && formData.quantity > selectedStockItem.currentStock) {
      errs.quantity = `Requested quantity (${formData.quantity}) exceeds available stock (${selectedStockItem.currentStock} ${selectedStockItem.unit})`;
    }
    return errs;
  };

  const handleChange = (field: keyof StockOutInput, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    const errs = { ...errors };
    if (field === "sku" && value.trim()) delete errs.sku;
    if (field === "warehouseId" && value) delete errs.warehouseId;
    if (field === "quantity") delete errs.quantity;
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
        itemCategory: match.itemCategory,
        unit: match.unit,
      }));
      setSelectedStockItem(match);
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
      await onSubmit(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to record stock out issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableStock = selectedStockItem ? selectedStockItem.currentStock : null;
  const isStockInsufficient = availableStock !== null && formData.quantity > availableStock;
  const remainingStock = availableStock !== null ? availableStock - formData.quantity : null;

  return (
    <div className="diws-modal-backdrop" onClick={onClose}>
      <div
        className="diws-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "620px" }}
      >
        {/* Header */}
        <div className="diws-modal-header bg-gradient-to-r from-amber-50 to-orange-50/60 border-b border-amber-200/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/15 text-amber-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <ArrowUpRight size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-amber-950 m-0">Record Stock Out</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 uppercase tracking-wide">
                  Goods Issue
                </span>
              </div>
              <p className="text-xs text-amber-800/80 mt-0.5 m-0">
                Issue or dispatch physical inventory from warehouse stock.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="diws-modal-close hover:bg-amber-200/50"
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

            {/* SECTION 1: Warehouse & Catalog Selection */}
            <div className="inv-form-section">
              <div className="inv-form-section-title">
                <Building2 size={13} className="text-amber-700" />
                <span>Warehouse Location & SKU Selection</span>
              </div>

              <div className="inv-form-group">
                <label className="inv-form-label">
                  <span>Source Warehouse <span className="text-rose-600">*</span></span>
                </label>
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

              {stockItems.length > 0 && (
                <div className="inv-form-group">
                  <label className="inv-form-label">
                    <span>Quick Select Item from Stock Catalog</span>
                  </label>
                  <select
                    className="inv-form-input bg-slate-50"
                    value={formData.sku}
                    onChange={handleSelectSkuOption}
                  >
                    <option value="">-- Choose from Available Stock Catalog --</option>
                    {stockItems.map((item) => (
                      <option key={item.sku} value={item.sku}>
                        {item.sku} — {item.itemName} (Available: {item.currentStock} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* SECTION 2: Item Information */}
            <div className="inv-form-section">
              <div className="inv-form-section-title">
                <Package size={13} className="text-amber-700" />
                <span>Item Identification</span>
              </div>

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label className="inv-form-label">
                    <span>SKU Code <span className="text-rose-600">*</span></span>
                  </label>
                  <input
                    type="text"
                    className={`inv-form-input font-mono font-bold ${errors.sku ? "is-invalid" : ""}`}
                    placeholder="e.g. FG-SRV-800"
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
                    <option value="finished_goods">Finished Goods</option>
                    <option value="raw_material">Raw Material</option>
                    <option value="packaging">Packaging</option>
                    <option value="components">Components</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="inv-form-group">
                <label className="inv-form-label">
                  <span>Item Description / Name</span>
                </label>
                <input
                  type="text"
                  className="inv-form-input"
                  placeholder="Item name / specification"
                  value={formData.itemName || ""}
                  onChange={(e) => handleChange("itemName", e.target.value)}
                />
              </div>
            </div>

            {/* SECTION 3: Live Stock Availability & Quantity */}
            <div className="inv-form-section">
              <div className="inv-form-section-title">
                <Layers size={13} className="text-amber-700" />
                <span>Quantity & Stock Verification</span>
              </div>

              {/* Real-time Stock Check Badge */}
              {selectedStockItem && (
                <div className={`inv-stock-check-box ${isStockInsufficient ? "insufficient" : "sufficient"}`}>
                  <div className="flex items-center gap-2.5">
                    {isStockInsufficient ? (
                      <AlertTriangle size={20} className="text-rose-600 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                    )}
                    <div>
                      <span className="inv-stock-check-title text-slate-800">
                        Available Stock for <code className="font-mono font-bold">{selectedStockItem.sku}</code>:
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <strong className="inv-stock-check-qty">
                          {selectedStockItem.currentStock} {selectedStockItem.unit}
                        </strong>
                        {remainingStock !== null && !isStockInsufficient && (
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            Remaining after issue: {remainingStock} {selectedStockItem.unit}
                          </span>
                        )}
                        {isStockInsufficient && (
                          <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                            Deficit of {formData.quantity - selectedStockItem.currentStock} {selectedStockItem.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-600 font-semibold">
                    <span>Valuation Rate:</span>
                    <div className="font-mono font-bold text-slate-900">{formatMoney(selectedStockItem.unitCost)}</div>
                  </div>
                </div>
              )}

              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label className="inv-form-label">
                    <span>Issue Quantity <span className="text-rose-600">*</span></span>
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
                    placeholder="pcs, kg, m..."
                    value={formData.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Reference & Tracking */}
            <div className="inv-form-section">
              <div className="inv-form-section-title">
                <FileText size={13} className="text-amber-700" />
                <span>Tracking & Audit Reference</span>
              </div>

              <div className="inv-form-group">
                <label className="inv-form-label">
                  <span>Dispatch / Sales Order Reference #</span>
                </label>
                <input
                  type="text"
                  className="inv-form-input font-mono"
                  placeholder="e.g. DISPATCH-4401 or SO-9912"
                  value={formData.referenceNumber}
                  onChange={(e) => handleChange("referenceNumber", e.target.value)}
                />
              </div>

              <div className="inv-form-group">
                <label className="inv-form-label">
                  <span>Reason / Destination</span>
                </label>
                <input
                  type="text"
                  className="inv-form-input"
                  placeholder="e.g. Sales Order Dispatch to Customer / Issued to Production Floor"
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
              className="diws-btn diws-btn-warning flex items-center gap-2"
              disabled={isSubmitting || isStockInsufficient}
            >
              {isSubmitting ? (
                <>
                  <span className="diws-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Recording Stock Out...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Issue Stock</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockOutModal;
