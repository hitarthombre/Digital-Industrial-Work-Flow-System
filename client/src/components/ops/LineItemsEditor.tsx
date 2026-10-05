import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLookup } from "../../hooks/useLookups";
import { inputCls } from "./OpsUI";
import { formatMoney } from "../../utils/format";

export interface LineItemRow {
  productId?: string;
  itemName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  discountPercent?: number;
  taxRate?: number;
}

interface LineItemsEditorProps {
  items: LineItemRow[];
  onChange: (items: LineItemRow[]) => void;
  /** "priced" shows price/discount/tax columns (sales); "quantity" shows only quantities (production). */
  mode?: "priced" | "quantity";
  quantityLabel?: string;
}

export const emptyLine = (): LineItemRow => ({ itemName: "", sku: "", quantity: 1, unit: "units", unitPrice: 0, discountPercent: 0, taxRate: 0 });

export const lineTotal = (row: LineItemRow) => {
  const sub = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);
  const afterDiscount = sub - (sub * (Number(row.discountPercent) || 0)) / 100;
  return afterDiscount + (afterDiscount * (Number(row.taxRate) || 0)) / 100;
};

export const LineItemsEditor: React.FC<LineItemsEditorProps> = ({ items, onChange, mode = "priced", quantityLabel = "Qty" }) => {
  const { options: products } = useLookup("products");

  const update = (index: number, patch: Partial<LineItemRow>) => {
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const pickProduct = (index: number, productId: string) => {
    const product = products.find((p) => p._id === productId);
    if (!product) {
      update(index, { productId: undefined });
      return;
    }
    update(index, {
      productId: product._id,
      itemName: product.name,
      sku: product.sku || "",
      unit: product.unit || "units",
      ...(mode === "priced" ? { unitPrice: product.price || 0, taxRate: product.taxRate || 0 } : {}),
    });
  };

  const priced = mode === "priced";
  const total = items.reduce((sum, row) => sum + lineTotal(row), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-700 uppercase">Line Items</label>
        <button
          type="button"
          onClick={() => onChange([...items, emptyLine()])}
          className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
        >
          <Plus size={14} /> Add line
        </button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
            <tr>
              <th className="p-2 text-left min-w-[150px]">Catalog Product</th>
              <th className="p-2 text-left min-w-[140px]">Item Name *</th>
              <th className="p-2 text-left min-w-[100px]">SKU *</th>
              <th className="p-2 text-left w-20">{quantityLabel} *</th>
              <th className="p-2 text-left w-20">Unit</th>
              {priced && (
                <>
                  <th className="p-2 text-left w-24">Unit Price</th>
                  <th className="p-2 text-left w-16">Disc %</th>
                  <th className="p-2 text-left w-16">Tax %</th>
                  <th className="p-2 text-right w-24">Total</th>
                </>
              )}
              <th className="p-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {items.map((row, index) => (
              <tr key={index} className="border-t border-slate-100">
                <td className="p-1.5">
                  <select className={inputCls} value={row.productId || ""} onChange={(e) => pickProduct(index, e.target.value)}>
                    <option value="">— Free text —</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-1.5">
                  <input className={inputCls} value={row.itemName} required onChange={(e) => update(index, { itemName: e.target.value })} />
                </td>
                <td className="p-1.5">
                  <input
                    className={`${inputCls} font-mono uppercase`}
                    value={row.sku}
                    required
                    onChange={(e) => update(index, { sku: e.target.value.toUpperCase() })}
                  />
                </td>
                <td className="p-1.5">
                  <input
                    type="number"
                    min={0.0001}
                    step="any"
                    className={inputCls}
                    value={row.quantity}
                    required
                    onChange={(e) => update(index, { quantity: Number(e.target.value) })}
                  />
                </td>
                <td className="p-1.5">
                  <input className={inputCls} value={row.unit} onChange={(e) => update(index, { unit: e.target.value })} />
                </td>
                {priced && (
                  <>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className={inputCls}
                        value={row.unitPrice ?? 0}
                        onChange={(e) => update(index, { unitPrice: Number(e.target.value) })}
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        className={inputCls}
                        value={row.discountPercent ?? 0}
                        onChange={(e) => update(index, { discountPercent: Number(e.target.value) })}
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className={inputCls}
                        value={row.taxRate ?? 0}
                        onChange={(e) => update(index, { taxRate: Number(e.target.value) })}
                      />
                    </td>
                    <td className="p-1.5 text-right font-mono font-bold text-slate-900">{formatMoney(lineTotal(row))}</td>
                  </>
                )}
                <td className="p-1.5 text-center">
                  <button
                    type="button"
                    disabled={items.length === 1}
                    onClick={() => onChange(items.filter((_, i) => i !== index))}
                    className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                    aria-label="Remove line"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {priced && (
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td colSpan={8} className="p-2 text-right font-bold text-slate-600 uppercase text-[10px]">
                  Lines total
                </td>
                <td className="p-2 text-right font-mono font-extrabold text-slate-900">{formatMoney(total)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default LineItemsEditor;
