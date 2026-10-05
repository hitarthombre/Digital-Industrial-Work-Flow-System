import React, { useState, useEffect } from "react";
import { WorkOrder, ConsumeMaterialInput } from "../../types/production";
import Modal from "../Modal";
import Button from "../Button";
import Input from "../Input";
import Select from "../Select";
import { api } from "../../services/api";
import { Boxes, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface MaterialConsumptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
  onConsumeMaterial: (id: string, input: ConsumeMaterialInput) => Promise<void>;
}

export const MaterialConsumptionModal: React.FC<MaterialConsumptionModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  onConsumeMaterial,
}) => {
  const [products, setProducts] = useState<{ id: string; name: string; unit: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [unit, setUnit] = useState("pcs");
  const [deductInventory, setDeductInventory] = useState(true);

  // Stock check state
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [checkingStock, setCheckingStock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load Products and Warehouses list
  useEffect(() => {
    if (isOpen) {
      api
        .get<{ success: boolean; data: any[] }>("/products")
        .then((res) => {
          if (res.success && res.data) {
            setProducts(
              res.data.map((p) => ({ id: p._id, name: p.name, unit: p.unit || "pcs" }))
            );
          }
        })
        .catch(() => {});

      api
        .get<{ success: boolean; data: any[] }>("/warehouses")
        .then((res) => {
          if (res.success && res.data) {
            setWarehouses(res.data.map((w) => ({ id: w._id, name: w.name })));
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Real-time stock check when product and warehouse are selected
  useEffect(() => {
    if (selectedProductId && selectedWarehouseId) {
      setCheckingStock(true);
      api
        .get<{ success: boolean; data: any[] }>("/inventory/raw-materials")
        .then((res) => {
          if (res.success && res.data) {
            const item = res.data.find(
              (i: any) =>
                (i.product?._id === selectedProductId || i.product === selectedProductId) &&
                (i.warehouse?._id === selectedWarehouseId || i.warehouse === selectedWarehouseId)
            );
            setAvailableStock(item ? item.quantity : 0);
          } else {
            setAvailableStock(0);
          }
        })
        .catch(() => {
          setAvailableStock(null);
        })
        .finally(() => setCheckingStock(false));
    } else {
      setAvailableStock(null);
    }
  }, [selectedProductId, selectedWarehouseId]);

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setProductName(prod.name);
      setUnit(prod.unit || "pcs");
    }
  };

  const handleWarehouseSelect = (id: string) => {
    setSelectedWarehouseId(id);
    const wh = warehouses.find((w) => w.id === id);
    if (wh) {
      setWarehouseName(wh.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrder) return;
    if (!productName || !warehouseName || !quantity || Number(quantity) <= 0) {
      setErrorMsg("Please fill in all required material & quantity fields.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      await onConsumeMaterial(workOrder._id, {
        productId: selectedProductId || undefined,
        productName,
        warehouseId: selectedWarehouseId || undefined,
        warehouseName,
        quantity: Number(quantity),
        unit,
        deductInventory,
      });
      onClose();
      // Reset form
      setQuantity("");
      setProductName("");
      setWarehouseName("");
      setSelectedProductId("");
      setSelectedWarehouseId("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log material consumption");
    } finally {
      setSubmitting(false);
    }
  };

  if (!workOrder) return null;

  const numericQty = Number(quantity) || 0;
  const isStockInsufficient =
    availableStock !== null && deductInventory && numericQty > availableStock;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log Material Consumption (${workOrder.workOrderNumber})`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Product Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Raw Material / Component <span className="text-rose-500">*</span>
          </label>
          {products.length > 0 ? (
            <Select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
            >
              <option value="">-- Select from Product Catalog --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </Select>
          ) : (
            <Input
              placeholder="e.g. Aluminum Sheet 5mm"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          )}
        </div>

        {/* Warehouse Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Source Warehouse <span className="text-rose-500">*</span>
          </label>
          {warehouses.length > 0 ? (
            <Select
              value={selectedWarehouseId}
              onChange={(e) => handleWarehouseSelect(e.target.value)}
            >
              <option value="">-- Select Warehouse --</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              placeholder="e.g. Central Raw Material Store"
              value={warehouseName}
              onChange={(e) => setWarehouseName(e.target.value)}
              required
            />
          )}
        </div>

        {/* Real-time Stock Check Warning Box */}
        {selectedProductId && selectedWarehouseId && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              checkingStock
                ? "bg-slate-50 border-slate-200 text-slate-600"
                : isStockInsufficient
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {isStockInsufficient ? (
              <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {checkingStock
                  ? "Checking warehouse inventory balance..."
                  : `Available Stock in ${warehouseName}: ${availableStock} ${unit}`}
              </p>
              {isStockInsufficient && (
                <p className="mt-1 text-[11px] text-amber-800 leading-normal">
                  ⚠️ <strong>Warning:</strong> Requested quantity ({numericQty} {unit}) exceeds current available stock ({availableStock} {unit}). Deducting stock will fail unless inventory is topped up first!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Quantity & Unit */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantity Consumed *"
            type="number"
            min="0.01"
            step="any"
            placeholder="0.00"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : "")}
            required
          />
          <Input
            label="Unit *"
            placeholder="pcs, kg, meters"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
          />
        </div>

        {/* Inventory Deduction Checkbox */}
        <div className="pt-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={deductInventory}
              onChange={(e) => setDeductInventory(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            Automatically deduct quantity from Warehouse Inventory
          </label>
        </div>

        {/* Modal Buttons */}
        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Log Consumption
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MaterialConsumptionModal;
