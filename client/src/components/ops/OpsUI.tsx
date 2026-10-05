import React from "react";
import { X, AlertTriangle, RefreshCw, Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../Button";
import { Badge } from "../Badge";

// Shared building blocks for the Production, Sales, Dispatch, Documents and Reports screens.

export const inputCls =
  "w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

export const Field: React.FC<{ label: string; required?: boolean; hint?: string; className?: string; children: React.ReactNode }> = ({
  label,
  required,
  hint,
  className = "",
  children,
}) => (
  <div className={className}>
    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
      {label} {required && <span className="text-rose-600">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

export const ErrorBanner: React.FC<{ message?: string | null; onRetry?: () => void }> = ({ message, onRetry }) =>
  message ? (
    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2 mb-4">
      <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-bold underline">
          Retry
        </button>
      )}
    </div>
  ) : null;

export const LoadingBox: React.FC<{ label?: string }> = ({ label = "Loading..." }) => (
  <div className="proc-loading-box">
    <RefreshCw className="animate-spin text-amber-600 mb-2" size={26} />
    <p className="text-xs text-slate-500">{label}</p>
  </div>
);

export const EmptyBox: React.FC<{ icon?: React.ReactNode; title: string; message?: string; action?: React.ReactNode }> = ({
  icon,
  title,
  message,
  action,
}) => (
  <div className="proc-empty-box">
    <div className="text-slate-300 mb-2">{icon || <Inbox size={40} />}</div>
    <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    {message && <p className="text-xs text-slate-500 max-w-sm mt-1">{message}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

interface FormModalProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  submitLabel?: string;
  error?: string | null;
  size?: "md" | "lg" | "xl";
  children: React.ReactNode;
}

export const FormModal: React.FC<FormModalProps> = ({
  title,
  subtitle,
  icon,
  onClose,
  onSubmit,
  submitting,
  submitLabel = "Save",
  error,
  size = "lg",
  children,
}) => {
  const width = size === "md" ? "max-w-lg" : size === "lg" ? "max-w-3xl" : "max-w-5xl";
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className={`bg-white rounded-xl ${width} w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {icon}
              {title}
            </h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <ErrorBanner message={error} />
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">{children}</div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const KpiCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  tone?: "amber" | "blue" | "emerald" | "purple";
}> = ({ label, value, sub, icon, tone = "amber" }) => (
  <div className="proc-kpi-card">
    <div className={`proc-kpi-icon ${tone}`}>{icon}</div>
    <div className="min-w-0">
      <div className="proc-kpi-label">{label}</div>
      <div className="proc-kpi-value truncate">{value}</div>
      {sub && <div className="proc-kpi-subtext">{sub}</div>}
    </div>
  </div>
);

type BadgeVariant = "active" | "inactive" | "maintenance" | "closed" | "neutral" | "warning" | "danger" | "success" | "primary";

// One status → colour mapping for every operations document type
const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  completed: "success",
  delivered: "success",
  paid: "success",
  approved: "active",
  accepted: "active",
  converted: "success",
  dispatched: "active",
  "in progress": "maintenance",
  in_progress: "maintenance",
  processing: "maintenance",
  released: "primary",
  shipped: "primary",
  "in transit": "primary",
  "out for delivery": "primary",
  "partially dispatched": "maintenance",
  "partially paid": "warning",
  partially_paid: "warning",
  packed: "neutral",
  sent: "primary",
  planned: "neutral",
  pending: "neutral",
  "pending approval": "warning",
  open: "neutral",
  draft: "inactive",
  "on hold": "warning",
  unpaid: "warning",
  overdue: "danger",
  rejected: "danger",
  returned: "danger",
  cancelled: "closed",
  expired: "closed",
  skipped: "inactive",
};

export const StatusBadge: React.FC<{ status?: string; size?: "sm" | "md" }> = ({ status, size = "sm" }) => (
  <Badge variant={STATUS_VARIANTS[(status || "").toLowerCase()] || "neutral"} size={size}>
    {(status || "—").replace(/_/g, " ")}
  </Badge>
);

export const Pager: React.FC<{
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
}> = ({ page, pages, total, onChange }) =>
  pages > 1 ? (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
      <span>
        Page {page} of {pages} · {total} records
      </span>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} icon={<ChevronLeft size={14} />}>
          Prev
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)} icon={<ChevronRight size={14} />}>
          Next
        </Button>
      </div>
    </div>
  ) : null;

export const PageHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; actions?: React.ReactNode }> = ({
  icon,
  title,
  subtitle,
  actions,
}) => (
  <div className="proc-header">
    <div>
      <h1 className="proc-page-title">
        {icon}
        {title}
      </h1>
      {subtitle && <p className="proc-page-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

export const TabBar: React.FC<{
  tabs: Array<{ key: string; label: string; count?: number }>;
  active: string;
  onChange: (key: string) => void;
}> = ({ tabs, active, onChange }) => (
  <div className="proc-tabs-bar">
    {tabs.map((tab) => (
      <button key={tab.key} type="button" className={`proc-tab-btn ${active === tab.key ? "active" : ""}`} onClick={() => onChange(tab.key)}>
        <span>{tab.label}</span>
        {tab.count !== undefined && (
          <span className="ml-1 text-[11px] bg-slate-100 px-1.5 rounded-full font-bold">{tab.count}</span>
        )}
      </button>
    ))}
  </div>
);

// Horizontal bar list used for "by status" / "top N" breakdowns
export const BarList: React.FC<{ rows: Array<{ label: string; value: number; display?: string }>; color?: string }> = ({
  rows,
  color = "#d97706",
}) => {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (rows.length === 0) return <p className="text-xs text-slate-400 py-4 text-center">No data yet</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 truncate pr-2">{row.label}</span>
            <span className="font-mono text-slate-900">{row.display ?? row.value}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(row.value / max) * 100}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SectionCard: React.FC<{ title: string; icon?: React.ReactNode; actions?: React.ReactNode; className?: string; children: React.ReactNode }> = ({
  title,
  icon,
  actions,
  className = "",
  children,
}) => (
  <div className={`proc-card ${className}`}>
    <div className="flex items-center justify-between mb-3 gap-2">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {actions}
    </div>
    {children}
  </div>
);
