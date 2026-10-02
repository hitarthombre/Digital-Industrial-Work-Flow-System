import React, { useState, useEffect } from "react";
import type { CreatePOPayload, IPurchaseRequest, ItemCategory } from "../../types/procurement";
import { Button } from "../Button";
import { api } from "../../services/api";
import {
  X,
  FileCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPR?: IPurchaseRequest | null;
  onSubmit: (payload: CreatePOPayload) => Promise<void>;
  isSubmitting?: boolean;
}

interface POItemRow {
  itemName: string;
  sku: string;
  itemCategory: ItemCategory;
  quantityOrdered: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  remarks: string;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  preselectedPR,
  onSubmit,
  isSubmitting = false,
}) => {
  const [suppliers, setSuppliers] = useState<Array<{ _id: string; name: string; code?: string; paymentTerms?: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ _id: string; name: string; code?: string }>>([]);

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("Standard DIWS Procurement T&C Apply.");

  const [items, setItems] = useState<POItemRow[]>([
    {
      itemName: "",
      sku: "",
      itemCategory: "raw_material",
      quantityOrdered: 1,
      unit: "units",
      unitPrice: 0,
      taxRate: 10,
      remarks: "",
    },
  ]);

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDropdowns();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedPR && preselectedPR.items) {
      const targetWh =
        typeof preselectedPR.warehouseId === "string"
          ? preselectedPR.warehouseId
          : preselectedPR.warehouseId?._id || "";
      setWarehouseId(targetWh);

      setItems(
        preselectedPR.items.map((i: any) => ({
          itemName: i.itemName,
          sku: i.sku || "SKU-GEN",
          itemCategory: i.itemCategory || "raw_material",
          quantityOrdered: i.quantity,
          unit: i.unit || "units",
          unitPrice: i.estimatedUnitPrice || 0,
          taxRate: 10,
          remarks: i.notes || "",
        }))
      );
    }
  }, [preselectedPR]);

  const fetchDropdowns = async () => {
    try {
      const [supRes, whRes] = await Promise.all([
        api.get<any>("/suppliers"),
        api.get<any>("/warehouses"),
      ]);

      if (supRes.data && Array.isArray(supRes.data)) {
        setSuppliers(supRes.data);
        if (supRes.data.length > 0 && !supplierId) {
          setSupplierId(supRes.data[0]._id);
          if (supRes.data[0].paymentTerms) setPaymentTerms(supRes.data[0].paymentTerms);
        }
      }
      if (whRes.data && Array.isArray(whRes.data)) {
        setWarehouses(whRes.data);
        if (whRes.data.length > 0 && !warehouseId) {
          setWarehouseId(whRes.data[0]._id);
        }
      }
    } catch (_) {
      // Fallback demo options
      setSuppliers([
        { _id: "sup-1", name: "Apex Steel & Metallurgy Corp", code: "SUP-101", paymentTerms: "Net 30" },
        { _id: "sup-2", name: "Precision Hydraulics International", code: "SUP-102", paymentTerms: "Net 45" },
        { _id: "sup-3", name: "Global Industrial Motors Inc", code: "SUP-103", paymentTerms: "Advance 50%" },
      ]);
      setWarehouses([
        { _id: "wh-1", name: "Central Distribution Center", code: "CDC-01" },
        { _id: "wh-2", name: "East Coast Assembly Hub", code: "ECA-02" },
      ]);
      setSupplierId("sup-1");
      setWarehouseId("wh-1");
    }
  };

  if (!isOpen) return null;

  const addItemRow = () => {
    setItems([
      ...items,
      {
        itemName: "",
        sku: "",
        itemCategory: "raw_material",
        quantityOrdered: 1,
        unit: "units",
        unitPrice: 0,
        taxRate: 10,
        remarks: "",
      },
    ]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof POItemRow, val: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = val;
    setItems(updated);
  };

  const subtotal = items.reduce((acc, item) => acc + (item.quantityOrdered || 0) * (item.unitPrice || 0), 0);
  const taxTotal = items.reduce(
    (acc, item) => acc + (item.quantityOrdered || 0) * (item.unitPrice || 0) * ((item.taxRate || 0) / 100),
    0
  );
  const grandTotal = subtotal + taxTotal + (shippingCost || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!supplierId) {
      setValidationError("Supplier selection is required.");
      return;
    }
    if (!warehouseId) {
      setValidationError("Destination warehouse is required.");
      return;
    }
    if (items.length === 0) {
      setValidationError("At least one order line item is required.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemName.trim()) {
        setValidationError(`Item #${i + 1}: Item name is required.`);
        return;
      }
      if (!items[i].sku.trim()) {
        setValidationError(`Item #${i + 1}: SKU code is required.`);
        return;
      }
      if (items[i].quantityOrdered <= 0) {
        setValidationError(`Item #${i + 1}: Quantity ordered must be at least 1.`);
        return;
      }
      if (items[i].unitPrice < 0) {
        setValidationError(`Item #${i + 1}: Unit price cannot be negative.`);
        return;
      }
    }

    const payload: CreatePOPayload = {
      purchaseRequestId: preselectedPR?._id,
      supplierId,
      warehouseId,
      paymentTerms,
      expectedDeliveryDate,
      shippingCost,
      notes,
      termsAndConditions,
      items: items.map((i) => ({
        itemName: i.itemName,
        sku: i.sku,
        itemCategory: i.itemCategory,
        quantityOrdered: i.quantityOrdered,
        unit: i.unit,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
        remarks: i.remarks,
      })),
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setValidationError(err.message || "Failed to create purchase order.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="text-amber-600" size={24} />
              Create Official Purchase Order (PO)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Issue a legally binding purchase order to an approved supplier vendor
              {preselectedPR && (
                <span className="ml-1 text-amber-700 font-semibold font-mono">
                  (Linked to {preselectedPR.prNumber})
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>

        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Top Config Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Supplier Vendor <span className="text-rose-600">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value);
                    const selected = suppliers.find((s) => s._id === e.target.value);
                    if (selected?.paymentTerms) setPaymentTerms(selected.paymentTerms);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800"
                >
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.code || "SUP"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Warehouse Facility <span className="text-rose-600">*</span>
                </label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800"
                >
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>
            </div>

            {/* Line Items Table Builder */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold uppercase text-slate-700">Order Items & Unit Pricing</h4>
                <Button variant="outline" size="sm" type="button" icon={<Plus size={14} />} onClick={addItemRow}>
                  Add Item Row
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Item Name *"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-semibold text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="SKU *"
                        value={item.sku}
                        onChange={(e) => handleItemChange(idx, "sku", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty Ordered *"
                        value={item.quantityOrdered}
                        onChange={(e) => handleItemChange(idx, "quantityOrdered", parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-bold text-center"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Unit Price $"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-right"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Tax %"
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(idx, "taxRate", parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-center"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">%</span>
                      </div>
                    </div>

                    <div className="sm:col-span-1 text-right">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary Box */}
            <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">Freight / Shipping Cost</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                      className="w-24 bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">Subtotal</span>
                  <span className="font-mono font-bold text-slate-200">${subtotal.toLocaleString()}</span>
                </div>

                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">Est Tax</span>
                  <span className="font-mono font-bold text-slate-200">${taxTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-amber-400 uppercase font-extrabold text-[10px] block">Grand Order Total</span>
                <div className="text-2xl font-black font-mono text-white">${grandTotal.toLocaleString()}</div>
              </div>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  PO Delivery Notes
                </label>
                <input
                  type="text"
                  placeholder="Special instructions for receiving dock..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Terms & Conditions
                </label>
                <input
                  type="text"
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={isSubmitting} icon={<CheckCircle2 size={16} />}>
              Issue Purchase Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;
