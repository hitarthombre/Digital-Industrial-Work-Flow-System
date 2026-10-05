import React, { useState } from "react";
import { BarChart3, FileSpreadsheet, FileDown, RefreshCw, Boxes, ShoppingCart, Cpu, TrendingUp, Truck, Building2, UserCheck } from "lucide-react";
import { Button } from "../../components/Button";
import { PageHeader, LoadingBox, EmptyBox, ErrorBanner } from "../../components/ops/OpsUI";
import { useLookup } from "../../hooks/useLookups";
import { useApiQuery, useMutation } from "../../hooks/useApiQuery";
import { reportService } from "../../services/operationsService";
import type { ReportType, ColumnFormat } from "../../types/operations";
import { formatMoney, formatNumber, formatDate, humanize, downloadBlob, formatDateTime } from "../../utils/format";
import "../procurement/ProcurementPages.css";

const REPORTS: Array<{ type: ReportType; label: string; icon: React.ReactNode; statuses?: string[]; categories?: string[]; dated: boolean; warehouse: boolean }> = [
  {
    type: "inventory",
    label: "Inventory",
    icon: <Boxes size={18} />,
    statuses: ["in_stock", "low_stock", "out_of_stock", "overstocked"],
    categories: ["raw_material", "finished_goods", "packaging", "components", "other"],
    dated: false,
    warehouse: true,
  },
  {
    type: "purchase",
    label: "Purchase",
    icon: <ShoppingCart size={18} />,
    statuses: ["PO Created", "Issued", "In Transit", "Partial Delivery", "Goods Received", "Closed", "Cancelled"],
    dated: true,
    warehouse: true,
  },
  { type: "production", label: "Production", icon: <Cpu size={18} />, statuses: ["Planned", "Released", "In Progress", "On Hold", "Completed", "Cancelled"], dated: true, warehouse: true },
  {
    type: "sales",
    label: "Sales",
    icon: <TrendingUp size={18} />,
    statuses: ["Pending Approval", "Approved", "Processing", "Partially Dispatched", "Dispatched", "Delivered", "Rejected", "Cancelled"],
    dated: true,
    warehouse: true,
  },
  {
    type: "dispatch",
    label: "Dispatch",
    icon: <Truck size={18} />,
    statuses: ["Pending", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered", "Returned", "Cancelled"],
    dated: true,
    warehouse: true,
  },
  { type: "supplier", label: "Supplier", icon: <Building2 size={18} />, dated: true, warehouse: false },
  { type: "customer", label: "Customer", icon: <UserCheck size={18} />, dated: true, warehouse: false },
];

const formatCell = (value: any, format?: ColumnFormat) => {
  if (value === null || value === undefined || value === "") return "—";
  switch (format) {
    case "currency":
      return formatMoney(value);
    case "number":
      return formatNumber(value);
    case "percent":
      return `${Number(value).toFixed(1)}%`;
    case "date":
      return formatDate(value);
    default:
      return humanize(String(value));
  }
};

const isNumeric = (format?: ColumnFormat) => format === "currency" || format === "number" || format === "percent";

export const ReportsCenter: React.FC = () => {
  const [type, setType] = useState<ReportType>("inventory");
  const [params, setParams] = useState<{ startDate?: string; endDate?: string; status?: string; category?: string; warehouseId?: string }>({});
  const { options: warehouses } = useLookup("warehouses");
  const exporter = useMutation();

  const meta = REPORTS.find((r) => r.type === type)!;
  const report = useApiQuery(() => reportService.getReport(type, params), [type, params]);
  const r = report.data?.data;

  const exportAs = async (format: "pdf" | "xlsx") => {
    const blob = await exporter.mutate(() => reportService.exportReport(type, format, params)).catch(() => null);
    if (blob) downloadBlob(blob, `${type}-report-${new Date().toISOString().slice(0, 10)}.${format}`);
  };

  return (
    <div className="proc-page-container">
      <PageHeader
        icon={<BarChart3 className="text-amber-600" size={28} />}
        title="Reports"
        subtitle="Cross-module operational reports with PDF and Excel export."
        actions={
          <>
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={report.refetch}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" icon={<FileSpreadsheet size={14} className="text-emerald-600" />} onClick={() => exportAs("xlsx")} loading={exporter.submitting} disabled={!r}>
              Export Excel
            </Button>
            <Button variant="primary" size="sm" icon={<FileDown size={14} />} onClick={() => exportAs("pdf")} loading={exporter.submitting} disabled={!r}>
              Export PDF
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
        {REPORTS.map((rep) => (
          <button
            key={rep.type}
            type="button"
            onClick={() => {
              setType(rep.type);
              setParams({ startDate: params.startDate, endDate: params.endDate });
            }}
            className={`flex items-center gap-2 rounded-lg border p-3 text-left transition ${
              type === rep.type ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {rep.icon}
            <span className="text-xs font-bold">{rep.label}</span>
          </button>
        ))}
      </div>

      <div className="proc-filter-bar">
        <div className="flex flex-wrap items-center gap-2">
          {meta.dated && (
            <>
              <input type="date" className="proc-select-filter" value={params.startDate || ""} onChange={(e) => setParams({ ...params, startDate: e.target.value || undefined })} aria-label="From" />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" className="proc-select-filter" value={params.endDate || ""} onChange={(e) => setParams({ ...params, endDate: e.target.value || undefined })} aria-label="To" />
            </>
          )}
          {meta.statuses && (
            <select className="proc-select-filter" value={params.status || ""} onChange={(e) => setParams({ ...params, status: e.target.value || undefined })} aria-label="Status">
              <option value="">All statuses</option>
              {meta.statuses.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </select>
          )}
          {meta.categories && (
            <select className="proc-select-filter" value={params.category || ""} onChange={(e) => setParams({ ...params, category: e.target.value || undefined })} aria-label="Category">
              <option value="">All categories</option>
              {meta.categories.map((c) => (
                <option key={c} value={c}>
                  {humanize(c)}
                </option>
              ))}
            </select>
          )}
          {meta.warehouse && (
            <select className="proc-select-filter" value={params.warehouseId || ""} onChange={(e) => setParams({ ...params, warehouseId: e.target.value || undefined })} aria-label="Warehouse">
              <option value="">All warehouses</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {r && <span className="text-[11px] text-slate-400">Generated {formatDateTime(r.generatedAt)}</span>}
      </div>

      <ErrorBanner message={report.error || exporter.error} onRetry={report.refetch} />

      {report.loading && !r ? (
        <LoadingBox label="Generating report..." />
      ) : (
        r && (
          <>
            <div className="mb-3">
              <h2 className="text-lg font-bold text-slate-900">{r.title}</h2>
              <p className="text-xs text-slate-500">{r.description}</p>
            </div>
            <div className="proc-kpi-grid">
              {r.summary.map((s) => (
                <div key={s.label} className="proc-kpi-card">
                  <div className="min-w-0">
                    <div className="proc-kpi-label">{s.label}</div>
                    <div className="proc-kpi-value truncate">{formatCell(s.value, s.format)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="proc-card p-0 overflow-hidden">
              {r.rows.length === 0 ? (
                <EmptyBox title="No records" message="Nothing matches the selected filters." />
              ) : (
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="proc-table">
                    <thead className="sticky top-0">
                      <tr>
                        {r.columns.map((c) => (
                          <th key={c.key} className={isNumeric(c.format) ? "text-right" : ""}>
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {r.rows.map((row, i) => (
                        <tr key={i}>
                          {r.columns.map((c) => (
                            <td key={c.key} className={isNumeric(c.format) ? "text-right font-mono" : ""}>
                              {formatCell(row[c.key], c.format)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="px-4 py-2 border-t border-slate-100 text-[11px] text-slate-500">{r.rows.length} rows</div>
            </div>
          </>
        )
      )}
    </div>
  );
};

export default ReportsCenter;
