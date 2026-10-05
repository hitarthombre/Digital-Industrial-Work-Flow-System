import { useEffect, useState } from "react";
import { api } from "../services/api";

export interface LookupOption {
  _id: string;
  name: string;
  code?: string;
  sku?: string;
  price?: number;
  unit?: string;
  email?: string;
  taxRate?: number;
}

type LookupKind = "warehouses" | "factories" | "customers" | "suppliers" | "products" | "users";

const ENDPOINTS: Record<LookupKind, string> = {
  warehouses: "/warehouses",
  factories: "/factories",
  customers: "/customers",
  suppliers: "/suppliers",
  products: "/products",
  users: "/users",
};

// Module-level cache so pickers in several modals share one request per session view
const cache = new Map<LookupKind, Promise<LookupOption[]>>();

const normalize = (kind: LookupKind, row: any): LookupOption => {
  if (kind === "users") {
    return { _id: row._id || row.id, name: `${row.firstName || ""} ${row.lastName || ""}`.trim() || row.email, email: row.email };
  }
  if (kind === "products") {
    return {
      _id: row._id,
      name: row.name,
      sku: row.sku,
      price: row.price,
      unit: row.uom?.unit || row.unit || "units",
      taxRate: row.taxRate,
    };
  }
  return { _id: row._id || row.id, name: row.name, code: row.code };
};

export const loadLookup = (kind: LookupKind): Promise<LookupOption[]> => {
  if (!cache.has(kind)) {
    const request = api
      .get<any>(ENDPOINTS[kind], { params: { limit: 100 } })
      .then((res) => {
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.items) ? res.data.items : [];
        return rows.map((r: any) => normalize(kind, r));
      })
      .catch((err) => {
        cache.delete(kind);
        throw err;
      });
    cache.set(kind, request);
  }
  return cache.get(kind)!;
};

export const invalidateLookup = (kind: LookupKind) => cache.delete(kind);

export function useLookup(kind: LookupKind, enabled = true) {
  const [options, setOptions] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);
    loadLookup(kind)
      .then((rows) => active && setOptions(rows))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [kind, enabled]);

  return { options, loading, error };
}

export default useLookup;

export interface StockOption {
  _id: string;
  sku: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  itemCategory: string;
}

// Stock lines held in one warehouse (raw materials + finished goods), for material and dispatch pickers
export const loadWarehouseStock = async (warehouseId: string): Promise<StockOption[]> => {
  if (!warehouseId) return [];
  const params = { warehouseId, limit: 100 };
  const [raw, finished] = await Promise.all([
    api.get<any>("/inventory/raw-materials", { params }),
    api.get<any>("/inventory/finished-goods", { params }),
  ]);
  const rows = [...(raw?.data || []), ...(finished?.data || [])];
  const seen = new Set<string>();
  return rows
    .filter((r: any) => (seen.has(r._id) ? false : (seen.add(r._id), true)))
    .map((r: any) => ({
      _id: r._id,
      sku: r.sku,
      itemName: r.itemName,
      quantity: r.quantity,
      unit: r.unit,
      unitCost: r.unitCost,
      itemCategory: r.itemCategory,
    }));
};
