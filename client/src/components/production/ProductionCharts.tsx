import React from "react";
import { ProductionStats, WorkOrder } from "../../types/production";
import { TrendingUp, Award, Activity, PieChart, Layers, AlertCircle } from "lucide-react";

interface ProductionChartsProps {
  stats: ProductionStats | null;
  workOrders: WorkOrder[];
}

export const ProductionCharts: React.FC<ProductionChartsProps> = ({ stats, workOrders }) => {
  if (!stats) return null;

  const yieldRate = stats.yieldRate || 100;
  const oee = stats.oeeEfficiency || 0;

  // Calculate scrap defect breakdown from work orders scrap logs
  const scrapReasonsCount: Record<string, number> = {
    DEFECTIVE_RAW_MATERIAL: 0,
    OPERATOR_ERROR: 0,
    MACHINE_MALFUNCTION: 0,
    TESTING_LOSS: 0,
    OTHER: 0,
  };

  workOrders.forEach((wo) => {
    if (wo.scrapLogs) {
      wo.scrapLogs.forEach((log) => {
        if (scrapReasonsCount[log.reason] !== undefined) {
          scrapReasonsCount[log.reason] += log.quantity || 1;
        } else {
          scrapReasonsCount.OTHER += log.quantity || 1;
        }
      });
    }
  });

  const totalScrapLogs = Object.values(scrapReasonsCount).reduce((a, b) => a + b, 0);

  const stageKeys = [
    { key: "PLANNED", label: "Planned", color: "bg-slate-500" },
    { key: "MATERIAL_PREP", label: "Material Prep", color: "bg-blue-500" },
    { key: "MACHINING", label: "Machining", color: "bg-amber-500" },
    { key: "ASSEMBLY", label: "Assembly", color: "bg-indigo-500" },
    { key: "QUALITY_CHECK", label: "QA Check", color: "bg-purple-500" },
    { key: "PACKAGING", label: "Packaging", color: "bg-cyan-500" },
    { key: "COMPLETED", label: "Completed", color: "bg-emerald-500" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1. Production Yield Rate & Efficiency Metric Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Award size={18} />
            </div>
            <h4 className="font-bold text-sm text-slate-800">Production Yield Rate</h4>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
            Target: 95%+
          </span>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{yieldRate}%</span>
          <span className="text-xs text-slate-500 font-medium">Clean Output Ratio</span>
        </div>

        {/* Progress gauge bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                yieldRate >= 90 ? "bg-emerald-500" : yieldRate >= 75 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, yieldRate)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Good Output: {stats.totalCompletedQty}</span>
            <span>Scrap: {stats.totalScrapQty}</span>
          </div>
        </div>

        {/* OEE Metric Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Activity size={14} className="text-indigo-600" /> Overall Efficiency (OEE):
          </span>
          <span className="font-bold text-slate-800">{oee}%</span>
        </div>
      </div>

      {/* 2. Work Order Stage Progress Distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Layers size={18} />
            </div>
            <h4 className="font-bold text-sm text-slate-800">Stage Workload Breakdown</h4>
          </div>
          <span className="text-xs text-slate-500">{stats.totalOrders} Work Orders</span>
        </div>

        <div className="space-y-2">
          {stageKeys.map((s) => {
            const count = stats.stageBreakdown?.[s.key as keyof typeof stats.stageBreakdown] || 0;
            const pct = stats.totalOrders > 0 ? Math.round((count / stats.totalOrders) * 100) : 0;

            return (
              <div key={s.key} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">{s.label}</span>
                  <span className="text-slate-500 font-semibold">{count} ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${s.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Scrap Defect Root Cause Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle size={18} />
            </div>
            <h4 className="font-bold text-sm text-slate-800">Scrap Defect Reasons</h4>
          </div>
          <span className="text-xs text-slate-500">{totalScrapLogs} Scrap Logs</span>
        </div>

        <div className="space-y-2.5">
          {Object.entries(scrapReasonsCount).map(([reasonKey, qty]) => {
            const label = reasonKey.replace(/_/g, " ");
            const pct = totalScrapLogs > 0 ? Math.round((qty / totalScrapLogs) * 100) : 0;

            return (
              <div key={reasonKey} className="flex items-center justify-between text-xs">
                <span className="capitalize text-slate-600 font-medium truncate max-w-[170px]">
                  {label.toLowerCase()}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-800 min-w-[36px] text-right">{qty}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductionCharts;
