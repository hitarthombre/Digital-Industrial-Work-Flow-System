import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { inventoryService } from "../../services/inventoryService";
import type { StockLevelItem } from "../../services/inventoryService";
import {
  useRawMaterials,
  useFinishedGoods,
  useInventoryHistory,
  useLowStockAlerts,
  useInventoryReports,
  useStockInMutation,
  useStockOutMutation,
  useStockTransferMutation,
  useStockAdjustmentMutation,
} from "../../hooks/useInventory";

import { LowStockAlertBanner, LowStockNotificationPanel } from "../../components/inventory/LowStockAlertBanner";
import { StockInModal } from "../../components/inventory/StockInModal";
import { StockOutModal } from "../../components/inventory/StockOutModal";
import { StockTransferModal } from "../../components/inventory/StockTransferModal";
import { StockAdjustmentModal } from "../../components/inventory/StockAdjustmentModal";
import { StockMovementTimeline } from "../../components/inventory/StockMovementTimeline";
import { InventoryReportsCharts } from "../../components/inventory/InventoryReportsCharts";

import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  RefreshCw,
  Search,
  FileText,
  Layers,
  DollarSign,
  PackageCheck,
  Bell,
  Plus,
} from "lucide-react";

import "./InventoryPages.css";

export const InventoryList: React.FC = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"raw_materials" | "finished_goods" | "all_levels" | "movements" | "reports">("raw_materials");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("ALL");

  // Warehouses list
  const [warehouses, setWarehouses] = useState<any[]>([
    { _id: "wh-1", name: "Central Hub Warehouse", code: "WH-CENTRAL-01" },
    { _id: "wh-2", name: "West Coast Assembly Facility", code: "WH-WEST-02" },
  ]);

  // Modal Control States
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);

  // Initial modal prefill data
  const [modalInitialData, setModalInitialData] = useState<{ sku?: string; itemName?: string; itemCategory?: string }>({});

  // Custom Inventory Hooks (Task 8)
  const rawMaterialsHook = useRawMaterials({ search: searchQuery, warehouseId: selectedWarehouse });
  const finishedGoodsHook = useFinishedGoods({ search: searchQuery, warehouseId: selectedWarehouse });
  const historyHook = useInventoryHistory({
    search: searchQuery,
    type: selectedType,
    itemCategory: selectedCategory,
    warehouseId: selectedWarehouse,
  });
  const alertsHook = useLowStockAlerts();
  const reportsHook = useInventoryReports();

  // Master Stock Levels state for all SKUs
  const [allStockLevels, setAllStockLevels] = useState<StockLevelItem[]>([]);
  const [loadingAllLevels, setLoadingAllLevels] = useState(true);

  // Mutations
  const stockInMutation = useStockInMutation();
  const stockOutMutation = useStockOutMutation();
  const transferMutation = useStockTransferMutation();
  const adjustmentMutation = useStockAdjustmentMutation();

  useEffect(() => {
    fetchWarehouses();
    fetchAllStockLevels();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get<{ data: any[] }>("/warehouses");
      if (res && res.data && res.data.length > 0) {
        setWarehouses(res.data);
      }
    } catch (_) {
      // Keep default sample warehouses
    }
  };

  const fetchAllStockLevels = async () => {
    setLoadingAllLevels(true);
    try {
      const res = await inventoryService.getStockLevels();
      if (res.stockItems) {
        setAllStockLevels(res.stockItems);
      }
    } catch (_) {
    } finally {
      setLoadingAllLevels(false);
    }
  };

  const refreshAllData = () => {
    fetchAllStockLevels();
    rawMaterialsHook.refetch();
    finishedGoodsHook.refetch();
    historyHook.refetch();
    alertsHook.refetch();
    reportsHook.refetch();
  };

  // Quick Action Triggers
  const handleOpenStockIn = (sku?: string, itemName?: string, category?: string) => {
    setModalInitialData({ sku, itemName, itemCategory: category });
    setIsStockInModalOpen(true);
  };

  const handleOpenStockOut = (sku?: string, itemName?: string, category?: string) => {
    setModalInitialData({ sku, itemName, itemCategory: category });
    setIsStockOutModalOpen(true);
  };

  const handleOpenAdjustment = (sku?: string, itemName?: string) => {
    setModalInitialData({ sku, itemName });
    setIsAdjustmentModalOpen(true);
  };

  // Total valuation calculation across all stock items
  const totalValuation = allStockLevels.reduce((acc, item) => acc + (item.totalValue || 0), 0);

  return (
    <div className="inv-page-container">
      {/* LOW STOCK ALERT BANNER (Task 5) */}
      <LowStockAlertBanner
        alerts={alertsHook.alerts}
        onOpenPanel={() => setIsNotifPanelOpen(true)}
        onQuickStockIn={(sku, itemName, cat) => handleOpenStockIn(sku, itemName, cat)}
      />

      {/* PAGE HEADER */}
      <div className="inv-page-header">
        <div className="inv-header-left">
          <div className="inv-breadcrumbs">
            <span>Operations</span>
            <span>/</span>
            <span className="active">Inventory Stock Control</span>
          </div>
          <h1 className="inv-page-title">
            <Boxes className="text-copper" size={30} />
            Inventory Stock Management
          </h1>
          <p className="inv-page-subtitle">
            Manage raw materials, finished goods stock levels, inter-warehouse transfers, manual reconciliations, and automated low-stock notifications.
          </p>
        </div>

        <div className="inv-header-actions">
          <button
            type="button"
            className="inv-notif-bell-btn"
            onClick={() => setIsNotifPanelOpen(true)}
            title="View Low Stock Notifications"
          >
            <Bell size={18} />
            {alertsHook.alerts.length > 0 && (
              <span className="inv-notif-badge">{alertsHook.alerts.length}</span>
            )}
          </button>

          <button
            type="button"
            className="diws-btn diws-btn-secondary"
            onClick={refreshAllData}
            title="Refresh All Data"
          >
            <RefreshCw size={16} /> Refresh
          </button>

          <button
            type="button"
            className="diws-btn diws-btn-success"
            onClick={() => handleOpenStockIn()}
          >
            <ArrowDownLeft size={18} /> Stock In
          </button>

          <button
            type="button"
            className="diws-btn diws-btn-warning"
            onClick={() => handleOpenStockOut()}
          >
            <ArrowUpRight size={18} /> Stock Out
          </button>

          <button
            type="button"
            className="diws-btn diws-btn-secondary"
            onClick={() => setIsTransferModalOpen(true)}
          >
            <ArrowLeftRight size={18} /> Transfer
          </button>

          <button
            type="button"
            className="diws-btn diws-btn-primary"
            onClick={() => handleOpenAdjustment()}
          >
            <SlidersHorizontal size={18} /> Adjustment
          </button>
        </div>
      </div>

      {/* OVERVIEW STATS CARDS */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap forest">
            <PackageCheck size={24} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">{allStockLevels.length} SKUs</span>
            <span className="inv-stat-label">Tracked Catalog Items</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap emerald">
            <ArrowDownLeft size={24} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">+{historyHook.stats?.totalStockInQty || 0} units</span>
            <span className="inv-stat-label">Stock Received (Stock In)</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap amber">
            <ArrowUpRight size={24} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">-{historyHook.stats?.totalStockOutQty || 0} units</span>
            <span className="inv-stat-label">Stock Issued (Stock Out)</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap copper">
            <DollarSign size={24} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">
              ${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="inv-stat-label">Gross Stock Valuation</span>
          </div>
        </div>
      </div>

      {/* MAIN NAVIGATION TABS */}
      <div className="inv-tabs-header">
        <button
          className={`inv-tab-btn ${activeTab === "raw_materials" ? "active" : ""}`}
          onClick={() => setActiveTab("raw_materials")}
        >
          <Layers size={18} /> Raw Materials Inventory
          {rawMaterialsHook.summary && (
            <span className="inv-tab-count">{rawMaterialsHook.summary.totalItems}</span>
          )}
        </button>

        <button
          className={`inv-tab-btn ${activeTab === "finished_goods" ? "active" : ""}`}
          onClick={() => setActiveTab("finished_goods")}
        >
          <Boxes size={18} /> Finished Goods Inventory
          {finishedGoodsHook.summary && (
            <span className="inv-tab-count">{finishedGoodsHook.summary.totalItems}</span>
          )}
        </button>

        <button
          className={`inv-tab-btn ${activeTab === "all_levels" ? "active" : ""}`}
          onClick={() => setActiveTab("all_levels")}
        >
          <PackageCheck size={18} /> All Stock Catalog
          <span className="inv-tab-count">{allStockLevels.length}</span>
        </button>

        <button
          className={`inv-tab-btn ${activeTab === "movements" ? "active" : ""}`}
          onClick={() => setActiveTab("movements")}
        >
          <FileText size={18} /> Stock Movements & Audit Log
        </button>

        <button
          className={`inv-tab-btn ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          <DollarSign size={18} /> Reports & Valuation Charts
        </button>
      </div>

      {/* TAB CONTENT 1: RAW MATERIALS */}
      {activeTab === "raw_materials" && (
        <div className="inv-tab-body">
          <div className="inv-toolbar">
            <div className="inv-search-form">
              <Search size={18} className="inv-search-icon" />
              <input
                type="text"
                className="inv-search-input"
                placeholder="Search raw materials by SKU, item name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="diws-btn diws-btn-success"
              onClick={() => handleOpenStockIn(undefined, undefined, "raw_material")}
            >
              <Plus size={16} /> Add Raw Material Stock In
            </button>
          </div>

          {rawMaterialsHook.loading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div className="diws-spinner" style={{ margin: "0 auto 1rem" }} />
              <p style={{ color: "var(--text-secondary)" }}>Loading Raw Materials stock levels...</p>
            </div>
          ) : (
            <div className="inv-table-card">
              <table className="inv-data-table">
                <thead>
                  <tr>
                    <th>SKU Code & Raw Material</th>
                    <th>Warehouse Location</th>
                    <th>On-Hand Stock</th>
                    <th>Min / Max Threshold</th>
                    <th>Unit Cost</th>
                    <th>Valuation</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterialsHook.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "3rem" }}>
                        <Boxes size={36} color="#94A3B8" style={{ margin: "0 auto 0.5rem" }} />
                        <p style={{ color: "#64748B" }}>No raw material items match your filters.</p>
                      </td>
                    </tr>
                  ) : (
                    rawMaterialsHook.data.map((item) => {
                      const isLow = item.currentStock <= (item.minThreshold || 10);
                      const isZero = item.currentStock === 0;

                      return (
                        <tr key={item.sku}>
                          <td>
                            <div style={{ fontWeight: 700, color: "#1E293B" }}>{item.itemName}</div>
                            <span className="inv-code-tag">{item.sku}</span>
                          </td>
                          <td>
                            <span className="inv-wh-tag">
                              {typeof item.warehouseId === "object" ? item.warehouseId?.name : "Main Warehouse"}
                            </span>
                            {item.locationInWarehouse && (
                              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{item.locationInWarehouse}</div>
                            )}
                          </td>
                          <td>
                            <strong
                              style={{
                                fontSize: "1.05rem",
                                color: isZero ? "#DC2626" : isLow ? "#D97706" : "#047857",
                              }}
                            >
                              {item.currentStock} {item.unit}
                            </strong>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.85rem", color: "#64748B" }}>
                              Min: {item.minThreshold || 10} / Max: {item.maxThreshold || 500}
                            </span>
                          </td>
                          <td>${(item.unitCost || 0).toFixed(2)}</td>
                          <td>
                            <strong>
                              ${(item.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                          <td>
                            <span className={`inv-status-tag ${isZero ? "out" : isLow ? "low" : "healthy"}`}>
                              {isZero ? "Out of Stock" : isLow ? "Low Stock Alert" : "In Stock"}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                className="diws-btn diws-btn-success diws-btn-sm"
                                onClick={() => handleOpenStockIn(item.sku, item.itemName, "raw_material")}
                                title="Stock In Receipt"
                              >
                                <ArrowDownLeft size={14} /> +Stock In
                              </button>
                              <button
                                type="button"
                                className="diws-btn diws-btn-warning diws-btn-sm"
                                onClick={() => handleOpenStockOut(item.sku, item.itemName, "raw_material")}
                                title="Issue Stock Out"
                              >
                                <ArrowUpRight size={14} /> -Stock Out
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: FINISHED GOODS */}
      {activeTab === "finished_goods" && (
        <div className="inv-tab-body">
          <div className="inv-toolbar">
            <div className="inv-search-form">
              <Search size={18} className="inv-search-icon" />
              <input
                type="text"
                className="inv-search-input"
                placeholder="Search finished goods by SKU, product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="diws-btn diws-btn-warning"
              onClick={() => handleOpenStockOut(undefined, undefined, "finished_goods")}
            >
              <ArrowUpRight size={16} /> Dispatch Finished Goods
            </button>
          </div>

          {finishedGoodsHook.loading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div className="diws-spinner" style={{ margin: "0 auto 1rem" }} />
              <p style={{ color: "var(--text-secondary)" }}>Loading Finished Goods inventory...</p>
            </div>
          ) : (
            <div className="inv-table-card">
              <table className="inv-data-table">
                <thead>
                  <tr>
                    <th>SKU Code & Finished Product</th>
                    <th>Warehouse Location</th>
                    <th>Current Stock</th>
                    <th>Min / Max Threshold</th>
                    <th>Unit Cost</th>
                    <th>Total Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {finishedGoodsHook.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "3rem" }}>
                        <Boxes size={36} color="#94A3B8" style={{ margin: "0 auto 0.5rem" }} />
                        <p style={{ color: "#64748B" }}>No finished goods matching search filters.</p>
                      </td>
                    </tr>
                  ) : (
                    finishedGoodsHook.data.map((item) => {
                      const isLow = item.currentStock <= (item.minThreshold || 10);
                      const isZero = item.currentStock === 0;

                      return (
                        <tr key={item.sku}>
                          <td>
                            <div style={{ fontWeight: 700, color: "#1E293B" }}>{item.itemName}</div>
                            <span className="inv-code-tag">{item.sku}</span>
                          </td>
                          <td>
                            <span className="inv-wh-tag">
                              {typeof item.warehouseId === "object" ? item.warehouseId?.name : "Central Hub Warehouse"}
                            </span>
                          </td>
                          <td>
                            <strong
                              style={{
                                fontSize: "1.05rem",
                                color: isZero ? "#DC2626" : isLow ? "#D97706" : "#047857",
                              }}
                            >
                              {item.currentStock} {item.unit}
                            </strong>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.85rem", color: "#64748B" }}>
                              Min: {item.minThreshold || 10} / Max: {item.maxThreshold || 500}
                            </span>
                          </td>
                          <td>${(item.unitCost || 0).toFixed(2)}</td>
                          <td>
                            <strong>
                              ${(item.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                          <td>
                            <span className={`inv-status-tag ${isZero ? "out" : isLow ? "low" : "healthy"}`}>
                              {isZero ? "Out of Stock" : isLow ? "Low Stock Alert" : "In Stock"}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                className="diws-btn diws-btn-warning diws-btn-sm"
                                onClick={() => handleOpenStockOut(item.sku, item.itemName, "finished_goods")}
                                title="Issue / Dispatch"
                              >
                                <ArrowUpRight size={14} /> Dispatch
                              </button>
                              <button
                                type="button"
                                className="diws-btn diws-btn-secondary diws-btn-sm"
                                onClick={() => handleOpenAdjustment(item.sku, item.itemName)}
                                title="Reconcile Count"
                              >
                                Adjust
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: ALL STOCK CATALOG */}
      {activeTab === "all_levels" && (
        <div className="inv-tab-body">
          {loadingAllLevels ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div className="diws-spinner" style={{ margin: "0 auto 1rem" }} />
              <p style={{ color: "var(--text-secondary)" }}>Loading complete stock levels catalog...</p>
            </div>
          ) : (
            <div className="inv-table-card">
              <table className="inv-data-table">
                <thead>
                  <tr>
                    <th>SKU & Item Name</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Current Stock</th>
                    <th>Unit Cost</th>
                    <th>Total Value</th>
                    <th>Status</th>
                    <th>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allStockLevels.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "3rem" }}>
                        <Boxes size={36} color="#94A3B8" style={{ margin: "0 auto 0.5rem" }} />
                        <p style={{ color: "#64748B" }}>No stock items found in inventory.</p>
                      </td>
                    </tr>
                  ) : (
                    allStockLevels.map((item) => {
                      const isLow = item.currentStock <= (item.minThreshold || 10);
                      const isZero = item.currentStock === 0;

                      return (
                        <tr key={item.sku}>
                          <td>
                            <div style={{ fontWeight: 700, color: "#1E293B" }}>{item.itemName}</div>
                            <span className="inv-code-tag">{item.sku}</span>
                          </td>
                          <td>
                            <span className={`inv-cat-pill ${item.itemCategory}`}>
                              {item.itemCategory ? item.itemCategory.replace("_", " ") : "finished goods"}
                            </span>
                          </td>
                          <td>
                            <span className="inv-wh-tag">
                              {typeof item.warehouseId === "object" ? item.warehouseId?.name : "Main Warehouse"}
                            </span>
                          </td>
                          <td>
                            <strong
                              style={{
                                fontSize: "1.05rem",
                                color: isZero ? "#DC2626" : isLow ? "#D97706" : "#047857",
                              }}
                            >
                              {item.currentStock} {item.unit}
                            </strong>
                          </td>
                          <td>${(item.unitCost || 0).toFixed(2)}</td>
                          <td>
                            <strong>
                              ${(item.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                          <td>
                            <span className={`inv-status-tag ${isZero ? "out" : isLow ? "low" : "healthy"}`}>
                              {isZero ? "Out of Stock" : isLow ? "Low Stock Alert" : "In Stock"}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                className="diws-btn diws-btn-success diws-btn-sm"
                                onClick={() => handleOpenStockIn(item.sku, item.itemName, item.itemCategory)}
                              >
                                +In
                              </button>
                              <button
                                type="button"
                                className="diws-btn diws-btn-warning diws-btn-sm"
                                onClick={() => handleOpenStockOut(item.sku, item.itemName, item.itemCategory)}
                              >
                                -Out
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: STOCK MOVEMENTS & AUDIT LOG (Task 6) */}
      {activeTab === "movements" && (
        <div className="inv-tab-body">
          <StockMovementTimeline
            movements={historyHook.movements}
            loading={historyHook.loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            warehouses={warehouses}
            selectedWarehouse={selectedWarehouse}
            onWarehouseChange={setSelectedWarehouse}
          />
        </div>
      )}

      {/* TAB CONTENT 5: REPORTS & VALUATION CHARTS (Task 7) */}
      {activeTab === "reports" && (
        <div className="inv-tab-body">
          <InventoryReportsCharts
            report={reportsHook.report}
            loading={reportsHook.loading}
          />
        </div>
      )}

      {/* MODAL FORMS & DRAWER PANELS */}
      <StockInModal
        isOpen={isStockInModalOpen}
        onClose={() => setIsStockInModalOpen(false)}
        warehouses={warehouses}
        initialData={modalInitialData}
        onSuccess={refreshAllData}
        onSubmit={stockInMutation.execute}
      />

      <StockOutModal
        isOpen={isStockOutModalOpen}
        onClose={() => setIsStockOutModalOpen(false)}
        warehouses={warehouses}
        stockItems={allStockLevels}
        initialData={modalInitialData}
        onSuccess={refreshAllData}
        onSubmit={stockOutMutation.execute}
      />

      <StockTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        warehouses={warehouses}
        stockItems={allStockLevels}
        onSuccess={refreshAllData}
        onSubmit={transferMutation.execute}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        warehouses={warehouses}
        stockItems={allStockLevels}
        initialData={modalInitialData}
        onSuccess={refreshAllData}
        onSubmit={adjustmentMutation.execute}
      />

      <LowStockNotificationPanel
        isOpen={isNotifPanelOpen}
        onClose={() => setIsNotifPanelOpen(false)}
        alerts={alertsHook.alerts}
        onStockInItem={(sku, name, cat) => handleOpenStockIn(sku, name, cat)}
        onAdjustItem={(sku, name) => handleOpenAdjustment(sku, name)}
      />
    </div>
  );
};

export default InventoryList;
