import React from "react";
import { DollarSign, PieChart, Layers, BarChart3, TrendingUp, ShieldCheck } from "lucide-react";
import type { InventoryReportData } from "../../services/inventoryService";

interface InventoryReportsChartsProps {
  report: InventoryReportData | null;
  loading: boolean;
}

export const InventoryReportsCharts: React.FC<InventoryReportsChartsProps> = ({ report, loading }) => {
  if (loading || !report) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div className="diws-spinner" style={{ margin: "0 auto 1rem" }} />
        <p style={{ color: "var(--text-secondary)" }}>Generating inventory financial & distribution analytics...</p>
      </div>
    );
  }

  const { summary, categoryBreakdown } = report;

  const totalVal = summary.totalInventoryValue || 1;
  const rawVal = categoryBreakdown?.rawMaterials?.value || 0;
  const fgVal = categoryBreakdown?.finishedGoods?.value || 0;
  const pkgVal = categoryBreakdown?.packaging?.value || 0;
  const cmpVal = categoryBreakdown?.components?.value || 0;

  const rawPct = Math.round((rawVal / totalVal) * 100);
  const fgPct = Math.round((fgVal / totalVal) * 100);
  const pkgPct = Math.round((pkgVal / totalVal) * 100);
  const cmpPct = Math.round((cmpVal / totalVal) * 100);

  const totalStatusCount = (summary.inStockCount || 0) + (summary.lowStockCount || 0) + (summary.outOfStockCount || 0) || 1;
  const inStockPct = Math.round(((summary.inStockCount || 0) / totalStatusCount) * 100);
  const lowStockPct = Math.round(((summary.lowStockCount || 0) / totalStatusCount) * 100);
  const outOfStockPct = Math.round(((summary.outOfStockCount || 0) / totalStatusCount) * 100);

  return (
    <div className="inv-reports-container">
      {/* FINANCIAL TOP CARDS */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap copper">
            <DollarSign size={24} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">
              ${summary.totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="inv-stat-label">Total Inventory Asset Valuation</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap amber">
            <Layers size={24} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">${rawVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="inv-stat-label">Raw Materials Stock Value</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap forest">
            <TrendingUp size={24} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">${fgVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="inv-stat-label">Finished Goods Stock Value</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap emerald">
            <ShieldCheck size={24} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">{summary.totalSKUs} SKUs</span>
            <span className="inv-stat-label">Active Tracked Inventory SKUs</span>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="inv-report-grid">
        {/* CHART 1: CATEGORY VALUATION DISTRIBUTION */}
        <div className="inv-report-card">
          <h3 className="inv-report-title text-slate-800">
            <BarChart3 size={20} className="text-copper" /> Category Valuation Distribution
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Percentage breakdown of working capital invested across inventory categories.
          </p>

          <div className="inv-chart-bars-list">
            <div className="inv-chart-bar-item">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-800">Raw Materials</span>
                <span>${rawVal.toLocaleString()} ({rawPct}%)</span>
              </div>
              <div className="inv-bar-bg">
                <div className="inv-bar-fill bg-amber-500" style={{ width: `${Math.max(5, rawPct)}%` }} />
              </div>
            </div>

            <div className="inv-chart-bar-item">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-800">Finished Goods</span>
                <span>${fgVal.toLocaleString()} ({fgPct}%)</span>
              </div>
              <div className="inv-bar-bg">
                <div className="inv-bar-fill bg-emerald-500" style={{ width: `${Math.max(5, fgPct)}%` }} />
              </div>
            </div>

            <div className="inv-chart-bar-item">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-purple-800">Packaging</span>
                <span>${pkgVal.toLocaleString()} ({pkgPct}%)</span>
              </div>
              <div className="inv-bar-bg">
                <div className="inv-bar-fill bg-purple-500" style={{ width: `${Math.max(5, pkgPct)}%` }} />
              </div>
            </div>

            <div className="inv-chart-bar-item">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-800">Components & Hardware</span>
                <span>${cmpVal.toLocaleString()} ({cmpPct}%)</span>
              </div>
              <div className="inv-bar-bg">
                <div className="inv-bar-fill bg-blue-500" style={{ width: `${Math.max(5, cmpPct)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: STOCK STATUS DISTRIBUTION (DONUT / PIE INDICATOR) */}
        <div className="inv-report-card">
          <h3 className="inv-report-title text-slate-800">
            <PieChart size={20} className="text-blue-600" /> Stock Level Status Distribution
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Health breakdown of total active SKUs in factory warehouses.
          </p>

          <div className="inv-donut-wrapper">
            <div className="inv-donut-graphic">
              <svg viewBox="0 0 36 36" className="inv-donut-chart">
                <path
                  className="donut-ring"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="3.8"
                />
                <path
                  className="donut-segment segment-instock"
                  strokeDasharray={`${inStockPct}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3.8"
                />
                <path
                  className="donut-segment segment-lowstock"
                  strokeDasharray={`${lowStockPct}, 100`}
                  strokeDashoffset={`-${inStockPct}`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="3.8"
                />
                <path
                  className="donut-segment segment-outstock"
                  strokeDasharray={`${outOfStockPct}, 100`}
                  strokeDashoffset={`-${inStockPct + lowStockPct}`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="3.8"
                />
              </svg>
              <div className="inv-donut-center">
                <span className="donut-num">{summary.totalSKUs}</span>
                <span className="donut-lbl">Total SKUs</span>
              </div>
            </div>

            <div className="inv-legend-list">
              <div className="inv-legend-item">
                <span className="inv-legend-dot bg-emerald-600" />
                <span>In Stock Optimal ({summary.inStockCount})</span>
                <strong>{inStockPct}%</strong>
              </div>
              <div className="inv-legend-item">
                <span className="inv-legend-dot bg-amber-500" />
                <span>Low Stock Warning ({summary.lowStockCount})</span>
                <strong>{lowStockPct}%</strong>
              </div>
              <div className="inv-legend-item">
                <span className="inv-legend-dot bg-red-600" />
                <span>Out of Stock ({summary.outOfStockCount})</span>
                <strong>{outOfStockPct}%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
