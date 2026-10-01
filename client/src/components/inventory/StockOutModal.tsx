import React, { useState, useEffect } from "react";
import { ArrowUpRight, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import type { StockOutInput, StockLevelItem } from "../../services/inventoryService";

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

  return (
    <div className="diws-modal-backdrop" onClick={onClose}>
      <div className="diws-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <div className="diws-modal-header bg-amber-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <ArrowUpRight size={22} />
            </div>
            <div>
              <h3 className="diws-modal-title text-amber-900">Record Stock Out (Goods Issue)</h3>
              <p className="text-xs text-amber-700">Issue or dispatch inventory from warehouse stock.</p>
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
              <label className="inv-form-label">Source Warehouse *</label>
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
                <label className="inv-form-label">Quick Select Item from Stock Catalog</label>
                <select
                  className="inv-form-input bg-slate-50"
                  value={formData.sku}
                  onChange={handleSelectSkuOption}
                >
                  <option value="">-- Choose Stock SKU --</option>
                  {stockItems.map((item) => (
                    <option key={item.sku} value={item.sku}>
                      {item.sku} - {item.itemName} (Available: {item.currentStock} {item.unit})
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
                  placeholder="e.g. FG-SRV-800"
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
                  <option value="finished_goods">Finished Goods</option>
                  <option value="raw_material">Raw Material</option>
                  <option value="packaging">Packaging</option>
                  <option value="components">Components</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Live Stock Availability Card */}
            {selectedStockItem && (
              <div className={`inv-stock-check-box ${isStockInsufficient ? "insufficient" : "sufficient"}`}>
                <div className="flex items-center gap-2">
                  {isStockInsufficient ? (
                    <AlertTriangle size={18} className="text-red-600" />
                  ) : (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  )}
                  <div>
                    <span className="inv-stock-check-title">
                      Current Available Stock for {selectedStockItem.sku}:
                    </span>
                    <strong className="inv-stock-check-qty">
                      {selectedStockItem.currentStock} {selectedStockItem.unit}
                    </strong>
                  </div>
                </div>
                <span className="text-xs text-slate-500">Unit Cost: ${selectedStockItem.unitCost?.toFixed(2)}</span>
              </div>
            )}

            <div className="inv-form-group">
              <label className="inv-form-label">Item Name</label>
              <input
                type="text"
                className="inv-form-input"
                placeholder="Item name"
                value={formData.itemName || ""}
                onChange={(e) => handleChange("itemName", e.target.value)}
              />
            </div>

            <div className="inv-form-row">
              <div className="inv-form-group">
                <label className="inv-form-label">Issue Quantity *</label>
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
                  placeholder="pcs, kg..."
                  value={formData.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                />
              </div>
            </div>

            <div className="inv-form-group">
              <label className="inv-form-label">Dispatch / Sales Order Reference #</label>
              <input
                type="text"
                className="inv-form-input"
                placeholder="e.g. DISPATCH-4401 or SO-9912"
                value={formData.referenceNumber}
                onChange={(e) => handleChange("referenceNumber", e.target.value)}
              />
            </div>

            <div className="inv-form-group">
              <label className="inv-form-label">Reason / Destination</label>
              <input
                type="text"
                className="inv-form-input"
                placeholder="e.g. Sales Order Dispatch to Customer / Issued to Production Floor"
                value={formData.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
              />
            </div>
          </div>

          <div className="diws-modal-footer">
            <button type="button" className="diws-btn diws-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="diws-btn diws-btn-warning"
              disabled={isSubmitting || isStockInsufficient}
            >
              {isSubmitting ? (
                "Recording Stock Out..."
              ) : (
                <>
                  <CheckCircle2 size={16} /> Issue Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
