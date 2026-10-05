import React, { useState, useEffect } from "react";
import useProduction from "../../hooks/useProduction";
import { WorkOrder, WorkOrderStage } from "../../types/production";
import WorkOrderKanbanBoard from "../../components/production/WorkOrderKanbanBoard";
import JobCardModal from "../../components/production/JobCardModal";
import MaterialConsumptionModal from "../../components/production/MaterialConsumptionModal";
import ScrapTrackingModal from "../../components/production/ScrapTrackingModal";
import ProductionCompletionModal from "../../components/production/ProductionCompletionModal";
import ProductionCharts from "../../components/production/ProductionCharts";
import CreateWorkOrderModal from "../../components/production/CreateWorkOrderModal";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Table from "../../components/Table";
import { api } from "../../services/api";
import {
  Cpu,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Kanban,
  List,
  Award,
  Activity,
  Boxes,
  Trash2,
  PackageCheck,
  Wrench,
  Clock,
  Factory as FactoryIcon,
  BarChart2,
} from "lucide-react";

export const ProductionDashboardPage: React.FC = () => {
  const [factories, setFactories] = useState<{ id: string; name: string }[]>([]);
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [activeTab, setActiveTab] = useState<"board" | "charts" | "logs">("board");

  // Hook
  const {
    workOrders,
    stats,
    loading,
    error,
    fetchWorkOrders,
    createWorkOrder,
    updateWorkOrderStage,
    consumeMaterial,
    recordScrap,
    completeWorkOrder,
  } = useProduction({
    factoryId: selectedFactoryId || undefined,
    search: searchQuery || undefined,
  });

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  const [isJobCardModalOpen, setIsJobCardModalOpen] = useState(false);
  const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false);
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Load Factories dropdown list
  useEffect(() => {
    api
      .get<{ success: boolean; data: any[] }>("/factories")
      .then((res) => {
        if (res.success && res.data) {
          setFactories(res.data.map((f) => ({ id: f._id, name: f.name })));
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenJobCard = (order: WorkOrder) => {
    setSelectedWorkOrder(order);
    setIsJobCardModalOpen(true);
  };

  const handleOpenConsumeMaterial = (order: WorkOrder) => {
    setSelectedWorkOrder(order);
    setIsConsumeModalOpen(true);
  };

  const handleOpenRecordScrap = (order: WorkOrder) => {
    setSelectedWorkOrder(order);
    setIsScrapModalOpen(true);
  };

  const handleOpenCompleteOrder = (order: WorkOrder) => {
    setSelectedWorkOrder(order);
    setIsCompleteModalOpen(true);
  };

  // Table Columns for List View
  const listColumns = [
    {
      header: "Work Order #",
      accessor: (row: WorkOrder) => (
        <div>
          <span className="font-bold text-slate-900">{row.workOrderNumber}</span>
          <div className="text-[11px] text-slate-400">
            Target: {new Date(row.targetCompletionDate).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: "Product / Item",
      accessor: (row: WorkOrder) => (
        <div>
          <span className="font-semibold text-slate-800">{row.product?.name || "N/A"}</span>
          <div className="text-[11px] text-slate-400">SKU: {row.product?.sku || "N/A"}</div>
        </div>
      ),
    },
    {
      header: "Factory Location",
      accessor: (row: WorkOrder) => (
        <span className="text-slate-600 font-medium">{row.factory?.name || "N/A"}</span>
      ),
    },
    {
      header: "Output Progress",
      accessor: (row: WorkOrder) => (
        <div>
          <div className="font-bold text-slate-800 text-xs">
            {row.completedQuantity} / {row.targetQuantity} {row.unit}
          </div>
          <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(((row.completedQuantity || 0) / row.targetQuantity) * 100)
                )}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      header: "Scrap Loss",
      accessor: (row: WorkOrder) => (
        <span
          className={`font-medium ${
            row.scrapQuantity > 0 ? "text-amber-700 font-bold" : "text-slate-400"
          }`}
        >
          {row.scrapQuantity} {row.unit}
        </span>
      ),
    },
    {
      header: "Priority",
      accessor: (row: WorkOrder) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            row.priority === "URGENT"
              ? "bg-rose-100 text-rose-800 border-rose-300"
              : row.priority === "HIGH"
              ? "bg-orange-100 text-orange-800 border-orange-300"
              : "bg-blue-100 text-blue-800 border-blue-300"
          }`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      header: "Stage",
      accessor: (row: WorkOrder) => (
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
          {row.stage.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row: WorkOrder) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenJobCard(row)}
            title="Job Cards"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
          >
            <Wrench size={14} />
          </button>
          <button
            onClick={() => handleOpenConsumeMaterial(row)}
            title="Consume Material"
            className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
          >
            <Boxes size={14} />
          </button>
          <button
            onClick={() => handleOpenRecordScrap(row)}
            title="Record Scrap"
            className="p-1.5 rounded hover:bg-amber-50 text-amber-600"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => handleOpenCompleteOrder(row)}
            title="Handover Finished Goods"
            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"
          >
            <PackageCheck size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
              <Cpu size={22} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Production Planning & Work Orders
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage factory production scheduling, stage progression, material logging, and scrap reduction.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => fetchWorkOrders({ factoryId: selectedFactoryId, search: searchQuery })}
            isLoading={loading}
          >
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> New Work Order
          </Button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Yield Rate</span>
              <Award size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.yieldRate}%</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Clean Output Ratio</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Active Orders</span>
              <Cpu size={16} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.activeOrders}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Of {stats.totalOrders} Total Orders
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Finished Goods</span>
              <PackageCheck size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalCompletedQty}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Target: {stats.totalTargetQty}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Total Scrap</span>
              <Trash2 size={16} className="text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700">{stats.totalScrapQty}</div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">Logged Material Defect</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>OEE Efficiency</span>
              <Activity size={16} className="text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.oeeEfficiency}%</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Overall Performance</div>
          </div>
        </div>
      )}

      {/* Search, Filters & View Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Search work order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            <Search size={14} className="absolute left-2.5 top-3 text-slate-400" />
          </div>

          {/* Factory Filter */}
          <div className="w-48">
            <Select
              value={selectedFactoryId}
              onChange={(e) => setSelectedFactoryId(e.target.value)}
            >
              <option value="">All Factories</option>
              {factories.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* View Mode & Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab("board")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "board"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Kanban size={14} /> Stage Board
            </button>

            <button
              onClick={() => setActiveTab("charts")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "charts"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart2 size={14} /> Yield Analytics
            </button>
          </div>

          {/* Kanban / Table Toggle inside Board view */}
          {activeTab === "board" && (
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "kanban" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                }`}
                title="Kanban Board View"
              >
                <Kanban size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "list" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                }`}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Contents */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {activeTab === "board" && (
        <>
          {viewMode === "kanban" ? (
            <WorkOrderKanbanBoard
              workOrders={workOrders}
              onUpdateStage={updateWorkOrderStage}
              onOpenJobCard={handleOpenJobCard}
              onOpenConsumeMaterial={handleOpenConsumeMaterial}
              onOpenRecordScrap={handleOpenRecordScrap}
              onOpenCompleteOrder={handleOpenCompleteOrder}
              loading={loading}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <Table columns={listColumns} data={workOrders} isLoading={loading} />
            </div>
          )}
        </>
      )}

      {activeTab === "charts" && (
        <ProductionCharts stats={stats} workOrders={workOrders} />
      )}

      {/* Modals */}
      <CreateWorkOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateWorkOrder={createWorkOrder}
      />

      <JobCardModal
        isOpen={isJobCardModalOpen}
        onClose={() => setIsJobCardModalOpen(false)}
        workOrder={selectedWorkOrder}
        onUpdateStage={updateWorkOrderStage}
      />

      <MaterialConsumptionModal
        isOpen={isConsumeModalOpen}
        onClose={() => setIsConsumeModalOpen(false)}
        workOrder={selectedWorkOrder}
        onConsumeMaterial={consumeMaterial}
      />

      <ScrapTrackingModal
        isOpen={isScrapModalOpen}
        onClose={() => setIsScrapModalOpen(false)}
        workOrder={selectedWorkOrder}
        onRecordScrap={recordScrap}
      />

      <ProductionCompletionModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        workOrder={selectedWorkOrder}
        onCompleteWorkOrder={completeWorkOrder}
      />
    </div>
  );
};

export default ProductionDashboardPage;
