import React from "react";
import { Search, RotateCcw } from "lucide-react";
import { useLookup } from "../../hooks/useLookups";
import { SavedFiltersBar } from "./SavedFiltersBar";
import type { ListQuery } from "../../types/operations";

export interface ListFilterValue {
  search?: string;
  status?: string;
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface ListFiltersProps {
  value: ListFilterValue;
  onChange: (value: ListFilterValue) => void;
  /** Saved-filter namespace, e.g. "sales_orders" */
  module: string;
  searchPlaceholder?: string;
  statuses?: string[];
  showWarehouse?: boolean;
  showDates?: boolean;
  sortOptions?: Array<{ value: string; label: string }>;
}

export const toQuery = (value: ListFilterValue, page = 1, limit = 20): ListQuery => ({
  ...value,
  status: value.status && value.status !== "ALL" ? value.status : undefined,
  page,
  limit,
});

export const ListFilters: React.FC<ListFiltersProps> = ({
  value,
  onChange,
  module,
  searchPlaceholder = "Search...",
  statuses,
  showWarehouse,
  showDates = true,
  sortOptions,
}) => {
  const { options: warehouses } = useLookup("warehouses", !!showWarehouse);
  const set = (patch: Partial<ListFilterValue>) => onChange({ ...value, ...patch });
  const selectCls = "proc-select-filter";

  return (
    <div className="proc-filter-bar flex-col items-stretch">
      <div className="flex flex-wrap items-center gap-2 w-full">
        <div className="proc-search-box">
          <Search size={16} className="proc-search-icon" />
          <input
            type="text"
            className="proc-search-input"
            placeholder={searchPlaceholder}
            value={value.search || ""}
            onChange={(e) => set({ search: e.target.value })}
          />
        </div>

        {statuses && (
          <select className={selectCls} value={value.status || "ALL"} onChange={(e) => set({ status: e.target.value })} aria-label="Status filter">
            <option value="ALL">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        )}

        {showWarehouse && (
          <select className={selectCls} value={value.warehouseId || ""} onChange={(e) => set({ warehouseId: e.target.value || undefined })} aria-label="Warehouse filter">
            <option value="">All warehouses</option>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        )}

        {showDates && (
          <>
            <input
              type="date"
              className={selectCls}
              value={value.startDate || ""}
              onChange={(e) => set({ startDate: e.target.value || undefined })}
              aria-label="From date"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              className={selectCls}
              value={value.endDate || ""}
              onChange={(e) => set({ endDate: e.target.value || undefined })}
              aria-label="To date"
            />
          </>
        )}

        {sortOptions && (
          <select
            className={selectCls}
            value={`${value.sortBy || sortOptions[0].value}:${value.sortOrder || "desc"}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split(":");
              set({ sortBy, sortOrder: sortOrder as "asc" | "desc" });
            }}
            aria-label="Sort"
          >
            {sortOptions.flatMap((o) => [
              <option key={`${o.value}:desc`} value={`${o.value}:desc`}>
                {o.label} ↓
              </option>,
              <option key={`${o.value}:asc`} value={`${o.value}:asc`}>
                {o.label} ↑
              </option>,
            ])}
          </select>
        )}

        <button
          type="button"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2"
          onClick={() => onChange({})}
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>
      <SavedFiltersBar module={module} current={value} onApply={(filters) => onChange(filters)} />
    </div>
  );
};

export default ListFilters;
