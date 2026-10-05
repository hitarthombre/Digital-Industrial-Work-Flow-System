import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { useDebounced } from "../hooks/useApiQuery";
import { searchApi } from "../services/operationsService";
import type { ISearchResult } from "../types/operations";

/**
 * Header search across every module the user can read. Ctrl/Cmd+K focuses it,
 * arrow keys move through results and Enter opens the highlighted record.
 */
export const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ISearchResult | null>(null);
  const [active, setActive] = useState(0);
  const debounced = useDebounced(query.trim(), 250);

  const flat = useMemo(() => (result ? result.groups.flatMap((g) => g.items) : []), [result]);

  useEffect(() => {
    if (debounced.length < 2) {
      setResult(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchApi
      .search(debounced, 5)
      .then((res) => {
        if (!cancelled) {
          setResult(res.data);
          setActive(0);
          setError(null);
        }
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const go = (link: string) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    navigate(link);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flat[active]) {
      e.preventDefault();
      go(flat[active].link);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  let index = -1;

  return (
    <div className="diws-search-bar relative" ref={boxRef}>
      <Search size={16} className="diws-search-icon" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search products, orders, customers, documents..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        aria-label="Global search"
      />
      {loading ? <Loader2 size={14} className="animate-spin text-slate-400 mr-2" /> : <kbd className="diws-search-shortcut">Ctrl K</kbd>}

      {open && debounced.length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto text-left">
          {error ? (
            <p className="text-xs text-rose-600 p-4">{error}</p>
          ) : !result || result.total === 0 ? (
            <p className="text-xs text-slate-500 p-4">{loading ? "Searching…" : `No results for "${debounced}"`}</p>
          ) : (
            result.groups.map((group) => (
              <div key={group.type} className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{group.label}</div>
                {group.items.map((item) => {
                  index += 1;
                  const isActive = index === active;
                  const myIndex = index;
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onMouseEnter={() => setActive(myIndex)}
                      onClick={() => go(item.link)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left ${isActive ? "bg-amber-50" : "hover:bg-slate-50"}`}
                    >
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-900 truncate">{item.title}</span>
                        {item.subtitle && <span className="block text-[11px] text-slate-500 truncate">{item.subtitle}</span>}
                      </span>
                      {item.status && <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">{item.status.replace(/_/g, " ")}</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
