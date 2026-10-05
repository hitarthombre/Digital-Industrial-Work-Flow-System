import React, { useEffect, useState } from "react";
import { Bookmark, Save, X, Star } from "lucide-react";
import { api } from "../../services/api";

interface SavedFilter {
  _id: string;
  name: string;
  filters: Record<string, any>;
  isDefault: boolean;
}

interface SavedFiltersBarProps {
  /** List identifier, e.g. "sales_orders" */
  module: string;
  current: Record<string, any>;
  onApply: (filters: Record<string, any>) => void;
}

const hasActiveFilters = (filters: Record<string, any>) =>
  Object.values(filters).some((v) => v !== undefined && v !== null && v !== "" && v !== "ALL");

/**
 * Lets a user save the current list filters under a name, re-apply them later,
 * and mark one preset as the default that loads when the list opens.
 */
export const SavedFiltersBar: React.FC<SavedFiltersBarProps> = ({ module, current, onApply }) => {
  const [saved, setSaved] = useState<SavedFilter[]>([]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [asDefault, setAsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (applyDefault = false) => {
    try {
      const res = await api.get<{ data: SavedFilter[] }>("/saved-filters", { params: { module } });
      setSaved(res.data || []);
      const def = (res.data || []).find((f) => f.isDefault);
      if (applyDefault && def) onApply(def.filters);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module]);

  const save = async () => {
    if (!name.trim()) return;
    try {
      await api.post("/saved-filters", { module, name: name.trim(), filters: current, isDefault: asDefault });
      setNaming(false);
      setName("");
      setAsDefault(false);
      setError(null);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/saved-filters/${id}`);
      setSaved((prev) => prev.filter((f) => f._id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      <span className="flex items-center gap-1 font-bold text-slate-500 uppercase text-[10px]">
        <Bookmark size={12} /> Saved
      </span>
      {saved.length === 0 && !naming && <span className="text-slate-400">No saved filters</span>}
      {saved.map((f) => (
        <span key={f._id} className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded-full pl-2.5 pr-1 py-0.5">
          <button type="button" className="font-semibold text-slate-700 hover:text-amber-700 flex items-center gap-1" onClick={() => onApply(f.filters)}>
            {f.isDefault && <Star size={10} className="text-amber-500 fill-amber-500" />}
            {f.name}
          </button>
          <button type="button" onClick={() => remove(f._id)} className="text-slate-400 hover:text-rose-600 p-0.5" aria-label={`Delete ${f.name}`}>
            <X size={11} />
          </button>
        </span>
      ))}

      {naming ? (
        <span className="inline-flex items-center gap-1.5">
          <input
            autoFocus
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape") setNaming(false);
            }}
            placeholder="Filter name"
            className="border border-slate-300 rounded-md px-2 py-1 text-xs w-32"
          />
          <label className="flex items-center gap-1 text-slate-500">
            <input type="checkbox" checked={asDefault} onChange={(e) => setAsDefault(e.target.checked)} /> default
          </label>
          <button type="button" onClick={save} className="font-bold text-amber-700">
            Save
          </button>
          <button type="button" onClick={() => setNaming(false)} className="text-slate-400">
            Cancel
          </button>
        </span>
      ) : (
        hasActiveFilters(current) && (
          <button type="button" onClick={() => setNaming(true)} className="inline-flex items-center gap-1 font-bold text-amber-700 hover:text-amber-800">
            <Save size={12} /> Save current filters
          </button>
        )
      )}
      {error && <span className="text-rose-600">{error}</span>}
    </div>
  );
};

export default SavedFiltersBar;
