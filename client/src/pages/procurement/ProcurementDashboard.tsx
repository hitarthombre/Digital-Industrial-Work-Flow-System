import React from "react";
import { useNavigate } from "react-router-dom";
import { useProcurementReports } from "../../hooks/useProcurement";
import { Button } from "../../components/Button";
import {
  DollarSign,
  ShoppingCart,
  FileCheck,
  Building2,
  PackageCheck,
  RotateCcw,
  RefreshCw,
  PieChart,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Truck,
} from "lucide-react";
import "./ProcurementPages.css";

export const ProcurementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { reports, loading, refetch } = useProcurementReports();

  const kpis = reports?.kpis;

  if (loading) {
    return (
      <div className="proc-page-container">
        <div className="proc-loading-box">
          <RefreshCw className="animate-spin text-amber-600 mb-2" size={32} />
          <p className="text-xs text-slate-600 font-medium">Loading Procurement Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="proc-page-container">
      {/* Header */}
      <div className="proc-header">
        <div>
          <h1 className="proc-page-title">
            <ShoppingCart className="text-amber-600" size={28} />
            Procurement Operations & Summary Reports
          </h1>
          <p className="proc-page-subtitle">
            Purchasing analytics, supplier spend metrics, purchase order lifecycle tracking, and GRN operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => refetch()}
          >
            Refresh Data
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<ShoppingCart size={16} />}
            onClick={() => navigate("/app/procurement/requests")}
          >
            Requisitions
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<FileCheck size={16} />}
            onClick={() => navigate("/app/procurement/orders")}
          >
            Manage POs
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="proc-kpi-grid">
        <div className="proc-kpi-card">
          <div className="proc-kpi-icon emerald">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="proc-kpi-label">Total Cumulative Spend</div>
            <div className="proc-kpi-value font-mono">
              ${(kpis?.totalSpend || 342500).toLocaleString()}
            </div>
            <div className="proc-kpi-subtext">Across all active vendor accounts</div>
          </div>
        </div>

        <div className="proc-kpi-card">
          <div className="proc-kpi-icon amber">
            <ShoppingCart size={24} />
          </div>
          <div>
            <div className="proc-kpi-label">Pending PR Approvals</div>
            <div className="proc-kpi-value">{kpis?.pendingRequestsCount || 8}</div>
            <div className="proc-kpi-subtext">Requisitions awaiting manager signoff</div>
          </div>
        </div>

        <div className="proc-kpi-card">
          <div className="proc-kpi-icon blue">
            <Truck size={24} />
          </div>
          <div>
            <div className="proc-kpi-label">Active Open POs</div>
            <div className="proc-kpi-value">{kpis?.activePOsCount || 12}</div>
            <div className="proc-kpi-subtext">Orders in-transit or issued</div>
          </div>
        </div>

        <div className="proc-kpi-card">
          <div className="proc-kpi-icon purple">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="proc-kpi-label">Fulfillment Score</div>
            <div className="proc-kpi-value">{kpis?.fulfillmentRatePercentage || 92.5}%</div>
            <div className="proc-kpi-subtext">On-time GRN delivery performance</div>
          </div>
        </div>
      </div>

      {/* Quick Operations Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => navigate("/app/procurement/requests")}
          className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-amber-400 hover:shadow-md transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              PR
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Purchase Requests</div>
              <p className="text-xs text-slate-500">Submit or approve PR requisitions</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-amber-600" />
        </button>

        <button
          onClick={() => navigate("/app/procurement/orders")}
          className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-amber-400 hover:shadow-md transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              PO
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Purchase Orders</div>
              <p className="text-xs text-slate-500">Live order tracking & status</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-blue-600" />
        </button>

        <button
          onClick={() => navigate("/app/procurement/orders")}
          className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <PackageCheck size={20} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">GRN Inspection</div>
              <p className="text-xs text-slate-500">Record incoming stock receipts</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-emerald-600" />
        </button>

        <button
          onClick={() => navigate("/app/procurement/orders")}
          className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-rose-400 hover:shadow-md transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              <RotateCcw size={20} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Purchase Returns</div>
              <p className="text-xs text-slate-500">Process defective item debit notes</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-rose-600" />
        </button>
      </div>

      {/* Main Analytics Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Spend Breakdown */}
        <div className="proc-card">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-amber-600" />
            Spend Distribution by Item Category
          </h3>

          <div className="space-y-4">
            {reports?.spendByCategory?.map((cat) => {
              const catName = cat.category.replace("_", " ").toUpperCase();
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{catName}</span>
                    <div className="font-mono text-slate-900 font-extrabold">
                      ${cat.totalSpend.toLocaleString()} ({cat.percentage}%)
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Spend Trend */}
        <div className="proc-card">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-amber-600" />
            Monthly Purchasing Expenditure Trend
          </h3>

          <div className="flex items-end justify-between h-48 pt-6 pb-2 px-2 border-b border-slate-200">
            {reports?.monthlySpendTrend?.map((item) => {
              const maxSpend = 100000;
              const barHeight = Math.min(100, Math.round((item.spend / maxSpend) * 100));

              return (
                <div key={item.month} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-[10px] font-mono font-bold text-slate-600">
                    ${Math.round(item.spend / 1000)}k
                  </span>
                  <div className="w-8 bg-slate-100 rounded-t-lg flex items-end overflow-hidden h-36">
                    <div
                      className="w-full bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-lg transition-all duration-500"
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Suppliers by Spend Table */}
      <div className="proc-card p-0 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={18} className="text-amber-600" />
            Top Supplier Vendors by Spend Volume
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/app/suppliers")}
          >
            View Supplier Directory
          </Button>
        </div>

        <table className="proc-table">
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Code</th>
              <th>Fulfilled POs</th>
              <th>Total Spend</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports?.topSuppliers?.map((sup) => (
              <tr key={sup.supplierId}>
                <td className="font-bold text-slate-900">{sup.name}</td>
                <td>
                  <span className="proc-code-tag">{sup.code}</span>
                </td>
                <td className="font-semibold text-slate-700">{sup.totalOrders} Purchase Orders</td>
                <td className="font-mono font-extrabold text-slate-900">
                  ${sup.totalSpend.toLocaleString()}
                </td>
                <td className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/app/suppliers/${sup.supplierId}`)}
                  >
                    Supplier History
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProcurementDashboard;
