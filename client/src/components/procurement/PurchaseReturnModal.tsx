import React, { useState, useEffect } from "react";
import type { IPurchaseOrder, CreateReturnPayload, ReturnReason, ItemCategory } from "../../types/procurement";
import { Button } from "../Button";
import { X, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";

interface PurchaseReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: IPurchaseOrder;
  onSubmit: (payload: CreateReturnPayload) => Promise<void>;
  isSubmitting?: boolean;
}

interface ReturnItemFormState {
  productId?: string;
  inventoryId?: string;
  itemName: string;
  sku: string;
  itemCategory: ItemCategory;
  quantityOrdered: number;
  quantityReturned: number;
  unit: string;
  unitCost: number;
  condition: string;
}

export const PurchaseReturnModal: React.FC<PurchaseReturnModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSubmit,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState<ReturnReason>("damaged_in_transit");
  const [reasonDetails, setReasonDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const [items, setItems] = useState<ReturnItemFormState[]>([]);

  useEffect(() => {
    if (purchaseOrder && purchaseOrder.items) {
      setItems(
        purchaseOrder.items.map((i) => ({
          productId: i.productId,
          inventoryId: i.inventoryId,
          itemName: i.itemName,
          sku: i.sku,
          itemCategory: i.itemCategory || "raw_material",
          quantityOrdered: i.quantityOrdered,
          quantityReturned: 0,
          unit: i.unit || "units",
          unitCost: i.unitPrice,
          condition: "Damaged / Defective",
        }))
      );
    }
  }, [purchaseOrder]);

  if (!isOpen) return null;

  const handleReturnQtyChange = (index: number, val: number) => {
    const updated = [...items];
    updated[index].quantityReturned = Math.max(0, val);
    setItems(updated);
  };

  const handleConditionChange = (index: number, val: string) => {
    const updated = [...items];
    updated[index].condition = val;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const activeReturnItems = items.filter((i) => i.quantityReturned > 0);

    if (activeReturnItems.length === 0) {
      setValidationError("Please specify a return quantity greater than 0 for at least one item.");
      return;
    }

    for (const item of activeReturnItems) {
      if (item.quantityReturned > item.quantityOrdered) {
        setValidationError(
          `Cannot return more than ordered quantity for ${item.itemName} (${item.quantityReturned} > ${item.quantityOrdered}).`
        );
        return;
      }
    }

    const supplierId =
      typeof purchaseOrder.supplierId === "string"
        ? purchaseOrder.supplierId
        : purchaseOrder.supplierId._id;

    const warehouseId =
      typeof purchaseOrder.warehouseId === "string"
        ? purchaseOrder.warehouseId
        : purchaseOrder.warehouseId._id;

    if (!supplierId || !warehouseId) {
      setValidationError("Missing supplier or warehouse ID on target order.");
      return;
    }

    const payload: CreateReturnPayload = {
      purchaseOrderId: purchaseOrder._id,
      supplierId,
      warehouseId,
      reason,
      reasonDetails,
      notes,
      items: activeReturnItems.map((i) => ({
        productId: i.productId,
        inventoryId: i.inventoryId,
        itemName: i.itemName,
        sku: i.sku,
        itemCategory: i.itemCategory,
        quantityReturned: i.quantityReturned,
        unit: i.unit,
        unitCost: i.unitCost,
        condition: i.condition,
      })),
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setValidationError(err.message || "Failed to submit purchase return");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="text-rose-600" size={24} />
              Raise Purchase Return Request
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Initiate vendor debit note / return for Purchase Order{" "}
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
          {/* Reason Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Primary Return Reason <span className="text-rose-600">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReturnReason)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500"
              >
                <option value="damaged_in_transit">Damaged in Transit</option>
                <option value="defective">Defective / Manufacturing Flaw</option>
                <option value="incorrect_specification">Incorrect Specification / SKU</option>
                <option value="excess_quantity">Excess Quantity Shipped</option>
                <option value="expired">Expired Material</option>
                <option value="other">Other Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Reason Details / Defect Description
              </label>
              <input
                type="text"
                placeholder="e.g. Scratched surface during transport on 20 units..."
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Items Return Table */}
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg mb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                  <th className="p-3">Item / SKU</th>
                  <th className="p-3 w-24 text-center">Qty Ordered</th>
                  <th className="p-3 w-28 text-center">Qty Returning</th>
                  <th className="p-3 w-36">Condition Note</th>
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
                        max={item.quantityOrdered}
                        value={item.quantityReturned}
                        onChange={(e) => handleReturnQtyChange(idx, parseFloat(e.target.value) || 0)}
                        className={`w-full text-center rounded px-2 py-1 text-xs font-extrabold focus:ring-2 focus:ring-rose-500 ${
                          item.quantityReturned > 0
                            ? "bg-rose-50 border border-rose-300 text-rose-900"
                            : "bg-slate-50 border border-slate-300 text-slate-600"
                        }`}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="e.g. Scratched, Wet..."
                        value={item.condition}
                        onChange={(e) => handleConditionChange(idx, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Debit Note & RMA Tracking Notes
            </label>
            <textarea
              rows={2}
              placeholder="Internal reference notes for accounting credit memo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              * Submitting a return will record stock deduction & trigger supplier debit request.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" type="submit" loading={isSubmitting} icon={<CheckCircle2 size={16} />}>
                Submit Purchase Return
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseReturnModal;
