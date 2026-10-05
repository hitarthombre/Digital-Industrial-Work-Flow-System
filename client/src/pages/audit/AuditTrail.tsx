import React, { useState } from "react";
import { ShieldCheck, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "../../components/Button";
import { PageHeader, LoadingBox, EmptyBox, ErrorBanner, Pager } from "../../components/ops/OpsUI";
import { useApiQuery } from "../../hooks/useApiQuery";
import { api } from "../../services/api";
import { formatDateTime, humanize, refName } from "../../utils/format";
import "../procurement/ProcurementPages.css";

interface AuditLog {
  _id: string;
  action: string;
  module: string;
  referenceId?: string;
  before?: unknown;
  after?: unknown;
  userId?: { _id: string; firstName?: string; lastName?: string; email?: string };
  ipAddress?: string;
  createdAt: string;
}

// Quick views for the audit questions people ask most often
const VIEWS = [
  { key: "", label: "All activity" },
  { key: "inventory", label: "Stock changes" },
  { key: "permissions", label: "Permission changes" },
  { key: "auth", label: "Logins & sessions" },
  { key: "procurement", label: "Procurement" },
  { key: "production", label: "Production" },
  { key: "sales", label: "Sales" },
  { key: "dispatch", label: "Dispatch" },
  { key: "documents", label: "Documents" },
];

const Json: React.FC<{ label: string; value: unknown }> = ({ label, value }) =>
  value === undefined || value === null ? null : (
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">{label}</div>
      <pre className="text-[11px] bg-white border border-slate-200 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );

export const AuditTrail: React.FC = () => {
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [range, setRange] = useState<{ startDate?: string; endDate?: string }>({});
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const params = { module: module || undefined, action: action.trim().toUpperCase() || undefined, ...range, page, limit: 25 };
  const { data, loading, error, refetch } = useApiQuery(
    () =>
      api.get<{ data: AuditLog[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>("/audit/logs", {
        params: params as Record<string, string | number | boolean>,
      }),
    [params]
  );

  return (
    <div className="proc-page-container">
      <PageHeader
        icon={<ShieldCheck className="text-amber-600" size={28} />}
        title="Audit Trail"
        subtitle="Immutable record of who changed what: stock movements, permission and role changes, logins and every module action."
        actions={
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={refetch}>
            Refresh
          </Button>
        }
      />

      <div className="proc-tabs-bar">
        {VIEWS.map((v) => (
          <button
            key={v.key || "all"}
            type="button"
            className={`proc-tab-btn ${module === v.key ? "active" : ""}`}
            onClick={() => {
              setModule(v.key);
              setPage(1);
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="proc-filter-bar">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="proc-select-filter w-56"
            placeholder="Exact action, e.g. STOCK_OUT"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          />
          <input type="date" className="proc-select-filter" value={range.startDate || ""} onChange={(e) => setRange({ ...range, startDate: e.target.value || undefined })} aria-label="From" />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" className="proc-select-filter" value={range.endDate || ""} onChange={(e) => setRange({ ...range, endDate: e.target.value || undefined })} aria-label="To" />
        </div>
        {data?.pagination && <span className="text-xs text-slate-500">{data.pagination.total} entries</span>}
      </div>

      <ErrorBanner message={error} onRetry={refetch} />

      <div className="proc-card p-0 overflow-hidden">
        {loading && !data ? (
          <LoadingBox label="Loading audit log..." />
        ) : !data?.data.length ? (
          <EmptyBox icon={<ShieldCheck size={40} />} title="No audit entries" message="Nothing has been recorded for this view yet." />
        ) : (
          <table className="proc-table">
            <thead>
              <tr>
                <th />
                <th>When</th>
                <th>User</th>
                <th>Module</th>
                <th>Action</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((log) => (
                <React.Fragment key={log._id}>
                  <tr className="cursor-pointer" onClick={() => setExpanded(expanded === log._id ? null : log._id)}>
                    <td className="text-slate-400">{expanded === log._id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                    <td className="text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="text-xs">{refName(log.userId, "System")}</td>
                    <td className="text-xs uppercase font-bold text-slate-500">{log.module}</td>
                    <td className="text-xs font-semibold">{humanize(log.action.toLowerCase())}</td>
                    <td className="text-[11px] font-mono text-slate-400">{log.referenceId || "—"}</td>
                  </tr>
                  {expanded === log._id && (
                    <tr>
                      <td colSpan={6} className="bg-slate-50">
                        <div className="flex flex-col md:flex-row gap-3">
                          <Json label="Before" value={log.before} />
                          <Json label="After" value={log.after} />
                          {log.before === undefined && log.after === undefined && <p className="text-xs text-slate-400">No change payload recorded.</p>}
                        </div>
                        {log.ipAddress && <p className="text-[11px] text-slate-400 mt-2">IP {log.ipAddress}</p>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
        {data?.pagination && <Pager page={page} pages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} />}
      </div>
    </div>
  );
};

export default AuditTrail;
