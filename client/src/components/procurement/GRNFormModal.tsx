import React, { useState, useEffect } from "react";
import type { IPurchaseOrder, CreateGRNPayload, ItemCategory } from "../../types/procurement";
import { Button } from "../Button";
import { X, PackageCheck, AlertTriangle, CheckCircle2, FileText, Hash } from "lucide-react";

interface GRNFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: IPurchaseOrder;
  onSubmit: (payload: CreateGRNPayload) => Promise<void>;
  isSubmitting?: boolean;
}

interface GRNItemFormState {
  poItemId?: string;
  productId?: string;
  inventoryId?: string;
  itemName: string;
  sku: string;
  itemCategory: ItemCategory;
  quantityOrdered: number;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected: number;
  unit: string;
  unitCost: number;
  remarks: string;
  rejectionReason: string;
}

export const GRNFormModal: React.FC<GRNFormModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSubmit,
  isSubmitting = false,
}) => {
  const [deliveryChallanNumber, setDeliveryChallanNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const [items, setItems] = useState<GRNItemFormState[]>([]);

  useEffect(() => {
    if (purchaseOrder && purchaseOrder.items) {
      const initialItems: GRNItemFormState[] = purchaseOrder.items.map((item) => ({
        poItemId: item._id,
        productId: item.productId,
        inventoryId: item.inventoryId,
        itemName: item.itemName,
        sku: item.sku,
        itemCategory: item.itemCategory || "raw_material",
        quantityOrdered: item.quantityOrdered,
        quantityReceived: item.quantityOrdered,
        quantityAccepted: item.quantityOrdered,
        quantityRejected: 0,
        unit: item.unit || "units",
        unitCost: item.unitPrice,
        remarks: "",
        rejectionReason: "",
      }));
      setItems(initialItems);
    }
  }, [purchaseOrder]);

  if (!isOpen) return null;

  const handleReceivedChange = (index: number, val: number) => {
    const updated = [...items];
    const qty = Math.max(0, val);
    updated[index].quantityReceived = qty;
    // Auto adjust accepted and rejected to maintain balance
    updated[index].quantityAccepted = Math.max(0, qty - updated[index].quantityRejected);
    setItems(updated);
  };

  const handleAcceptedChange = (index: number, val: number) => {
    const updated = [...items];
    const accepted = Math.max(0, val);
    updated[index].quantityAccepted = accepted;
    updated[index].quantityRejected = Math.max(0, updated[index].quantityReceived - accepted);
    setItems(updated);
  };

  const handleRejectedChange = (index: number, val: number) => {
    const updated = [...items];
    const rejected = Math.max(0, val);
    updated[index].quantityRejected = rejected;
    updated[index].quantityAccepted = Math.max(0, updated[index].quantityReceived - rejected);
    setItems(updated);
  };

  const handleItemFieldChange = (index: number, field: keyof GRNItemFormState, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (items.length === 0) {
      setValidationError("At least one line item is required for inspection.");
      return;
    }

    // Validate quantities logic
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.quantityReceived < 0) {
        setValidationError(`Item #${i + 1} (${item.itemName}): Quantity received cannot be negative.`);
        return;
      }
      if (item.quantityAccepted + item.quantityRejected !== item.quantityReceived) {
        setValidationError(
          `Item #${i + 1} (${item.itemName}): Accepted (${item.quantityAccepted}) + Rejected (${item.quantityRejected}) must equal Received (${item.quantityReceived}).`
        );
        return;
      }
      if (item.quantityRejected > 0 && !item.rejectionReason.trim()) {
        setValidationError(`Item #${i + 1} (${item.itemName}): Rejection reason is required for rejected items.`);
        return;
      }
    }

    const payload: CreateGRNPayload = {
      purchaseOrderId: purchaseOrder._id,
      deliveryChallanNumber,
      invoiceNumber,
      notes,
      items: items.map((i) => ({
        poItemId: i.poItemId,
        productId: i.productId,
        inventoryId: i.inventoryId,
        itemName: i.itemName,
        sku: i.sku,
        itemCategory: i.itemCategory,
        quantityOrdered: i.quantityOrdered,
        quantityReceived: i.quantityReceived,
        quantityAccepted: i.quantityAccepted,
        quantityRejected: i.quantityRejected,
        unit: i.unit,
        unitCost: i.unitCost,
        remarks: i.remarks,
        rejectionReason: i.rejectionReason,
      })),
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setValidationError(err.message || "Failed to submit GRN");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <PackageCheck className="text-emerald-600" size={24} />
              Goods Receipt Note (GRN) Inspection
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect incoming warehouse items against Purchase Order{" "}
              <strong className="font-mono text-amber-800">{purchaseOrder.poNumber}</strong>
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
          {/* Top Shipment Info Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                <Hash size={12} className="inline mr-1 text-slate-400" />
                Delivery Challan / Waybill #
              </label>
              <input
                type="text"
                placeholder="e.g. DC-990812"
                value={deliveryChallanNumber}
                onChange={(e) => setDeliveryChallanNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                <FileText size={12} className="inline mr-1 text-slate-400" />
                Vendor Invoice #
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-441"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Inspection Remarks / Gate Pass Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Received intact at Loading Dock 3..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Line Items Inspection Grid Table */}
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg mb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                  <th className="p-3">Item / SKU</th>
                  <th className="p-3 w-20 text-center">Ordered</th>
                  <th className="p-3 w-24 text-center">Received</th>
                  <th className="p-3 w-24 text-center">Accepted</th>
                  <th className="p-3 w-24 text-center">Rejected</th>
                  <th className="p-3 min-w-[150px]">Rejection Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{item.itemName}</div>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.sku}
                      </span>
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">
                      {item.quantityOrdered} {item.unit}
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={item.quantityReceived}
                        onChange={(e) => handleReceivedChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full text-center bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={item.quantityAccepted}
                        onChange={(e) => handleAcceptedChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full text-center bg-emerald-50 border border-emerald-300 rounded px-2 py-1 text-xs font-extrabold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={item.quantityRejected}
                        onChange={(e) => handleRejectedChange(idx, parseFloat(e.target.value) || 0)}
                        className={`w-full text-center rounded px-2 py-1 text-xs font-extrabold focus:ring-2 focus:ring-rose-500 ${
                          item.quantityRejected > 0
                            ? "bg-rose-50 border border-rose-300 text-rose-900"
                            : "bg-slate-50 border border-slate-300 text-slate-600"
                        }`}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder={item.quantityRejected > 0 ? "Required reason..." : "Optional..."}
                        value={item.rejectionReason}
                        onChange={(e) => handleItemFieldChange(idx, "rejectionReason", e.target.value)}
                        className={`w-full bg-slate-50 border rounded px-2 py-1 text-xs text-slate-800 ${
                          item.quantityRejected > 0 && !item.rejectionReason.trim()
                            ? "border-rose-400 bg-rose-50/50"
                            : "border-slate-300"
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              * Submitting GRN will automatically update inventory stock levels in the warehouse.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={isSubmitting} icon={<CheckCircle2 size={16} />}>
                Submit GRN & Update Stock
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GRNFormModal;
