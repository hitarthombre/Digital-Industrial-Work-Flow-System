import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { inventoryService } from "../../services/inventoryService";
import type {
  IStockMovementItem,
  StockLevelItem,
  RecordMovementInput,
} from "../../services/inventoryService";
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
  FileText,
  Layers,
  DollarSign,
  PackageCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import "./InventoryPages.css";

export const InventoryList: React.FC = () => {
  // Tabs
  const [activeTab, setActiveTab] = useState<"levels" | "movements" | "reports">("levels");

  // State
  const [movements, setMovements] = useState<IStockMovementItem[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevelItem[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([
    { _id: "wh-1", name: "Central Hub Warehouse", code: "WH-CENTRAL-01" },
    { _id: "wh-2", name: "West Coast Assembly Facility", code: "WH-WEST-02" },
  ]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalMovements: 0,
    totalStockInQty: 0,
    totalStockOutQty: 0,
    totalValuation: 0,
    rawMaterialMovements: 0,
    finishedGoodsMovements: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<"stock_in" | "stock_out" | "adjustment">("stock_in");
  const [formData, setFormData] = useState<RecordMovementInput>({
    warehouseId: "",
    sku: "",
    itemName: "",
    type: "stock_in",
    itemCategory: "finished_goods",
    quantity: 1,
    unit: "pcs",
    unitCost: 0,
    referenceNumber: "",
    reason: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
    fetchWarehouses();
  }, [selectedType, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [movRes, levRes] = await Promise.all([
        inventoryService.getMovements({
          search: searchQuery,
          type: selectedType,
          itemCategory: selectedCategory,
        }),
        inventoryService.getStockLevels(),
      ]);

      if (movRes.data) setMovements(movRes.data);
      if (movRes.stats) setStats(movRes.stats);
      if (levRes.stockItems) setStockLevels(levRes.stockItems);
    } catch (err) {
      console.error("Failed to load inventory data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await api.get<{ data: any[] }>("/warehouses");
      if (res && res.data && res.data.length > 0) {
        setWarehouses(res.data);
      }
    } catch (_) {
      // Fallback to sample warehouses
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const openMovementModal = (type: "stock_in" | "stock_out" | "adjustment") => {
    setMovementType(type);
    setFormError("");
    setFormData({
      warehouseId: warehouses[0]?._id || "wh-1",
      sku: "",
      itemName: "",
      type,
      itemCategory: "finished_goods",
      quantity: 1,
      unit: "pcs",
      unitCost: 0,
      referenceNumber: type === "stock_in" ? "PO-REC-" + Date.now().toString().slice(-4) : "SO-DISP-" + Date.now().toString().slice(-4),
      reason: type === "stock_in" ? "Supplier Purchase Receipt" : type === "stock_out" ? "Sales Order Dispatch" : "Inventory Count Adjustment",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.warehouseId) {
      setFormError("Please select a warehouse location.");
      return;
    }
    if (!formData.sku.trim()) {
      setFormError("Item SKU is required.");
      return;
    }
    if (!formData.itemName.trim()) {
      setFormError("Item name is required.");
      return;
    }
    if (formData.quantity <= 0) {
      setFormError("Quantity must be greater than 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryService.recordMovement({
        ...formData,
        type: movementType,
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Failed to record stock movement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inv-page-container">
      {/* PAGE HEADER */}
      <div className="inv-page-header">
        <div className="inv-header-left">
          <div className="inv-breadcrumbs">
            <span>Operations</span>
            <span>/</span>
            <span className="active">Inventory & Stock Operations</span>
          </div>
          <h1 className="inv-page-title">
            <Boxes className="text-copper" size={30} />
            Inventory Control & Stock Movements
          </h1>
          <p className="inv-page-subtitle">
            Track stock in receipts, stock out dispatches, cycle count adjustments, raw materials, and finished goods valuation.
          </p>
        </div>

        <div className="inv-header-actions">
          <button
            type="button"
            className="diws-btn diws-btn-secondary"
            onClick={fetchData}
            title="Refresh Data"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            type="button"
            className="diws-btn diws-btn-success"
            onClick={() => openMovementModal("stock_in")}
          >
            <ArrowDownLeft size={18} /> Record Stock In
          </button>
          <button
            type="button"
            className="diws-btn diws-btn-warning"
            onClick={() => openMovementModal("stock_out")}
          >
            <ArrowUpRight size={18} /> Record Stock Out
          </button>
          <button
            type="button"
            className="diws-btn diws-btn-primary"
            onClick={() => openMovementModal("adjustment")}
          >
            <SlidersHorizontal size={18} /> Adjustment
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap forest">
            <PackageCheck size={24} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">{stockLevels.length}</span>
            <span className="inv-stat-label">Tracked Catalog SKUs</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap emerald">
            <ArrowDownLeft size={24} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">+{stats.totalStockInQty} units</span>
            <span className="inv-stat-label">Total Stock Received</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap amber">
            <ArrowUpRight size={24} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">-{stats.totalStockOutQty} units</span>
            <span className="inv-stat-label">Total Stock Issued</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon-wrap copper">
            <DollarSign size={24} />
          </div>
          <div className="inv-stat-info">
            <span className="inv-stat-value">
              ${stats.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="inv-stat-label">Total Stock Valuation</span>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="inv-tabs-header">
        <button
          className={`inv-tab-btn ${activeTab === "levels" ? "active" : ""}`}
          onClick={() => setActiveTab("levels")}
        >
          <Layers size={18} /> Current Stock Levels
        </button>
        <button
          className={`inv-tab-btn ${activeTab === "movements" ? "active" : ""}`}
          onClick={() => setActiveTab("movements")}
        >
          <FileText size={18} /> Stock Movement Audit Logs
        </button>
        <button
          className={`inv-tab-btn ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          <DollarSign size={18} /> Inventory Reports & Valuation
        </button>
      </div>

      {/* TAB CONTENT 1: CURRENT STOCK LEVELS */}
      {activeTab === "levels" && (
        <div className="inv-tab-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div className="diws-spinner" style={{ margin: "0 auto 1rem" }} />
              <p style={{ color: "var(--text-secondary)" }}>Loading stock levels...</p>
            </div>
          ) : (
            <div className="inv-table-card">
              <table className="inv-data-table">
                <thead>
                  <tr>
                    <th>SKU & Item Name</th>
                    <th>Category</th>
                    <th>Stock In</th>
                    <th>Stock Out</th>
                    <th>Current Stock</th>
                    <th>Unit Cost</th>
                    <th>Total Valuation</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLevels.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "3rem" }}>
                        <Boxes size={36} color="#94A3B8" style={{ margin: "0 auto 0.5rem" }} />
                        <p style={{ color: "#64748B" }}>No stock items found in inventory.</p>
                      </td>
                    </tr>
                  ) : (
                    stockLevels.map((item) => (
                      <tr key={item.sku}>
                        <td>
                          <div style={{ fontWeight: 700, color: "#1E293B" }}>{item.itemName}</div>
                          <span className="inv-code-tag">{item.sku}</span>
                        </td>
                        <td>
                          <span className={`inv-cat-pill ${item.itemCategory}`}>
                            {item.itemCategory.replace("_", " ")}
                          </span>
                        </td>
                        <td>+{item.stockIn} {item.unit}</td>
                        <td>-{item.stockOut} {item.unit}</td>
                        <td>
                          <strong style={{ fontSize: "1.05rem", color: item.currentStock > 10 ? "#047857" : "#D97706" }}>
                            {item.currentStock} {item.unit}
                          </strong>
                        </td>
                        <td>${item.unitCost.toFixed(2)}</td>
                        <td>
                          <strong>${item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                        </td>
                        <td>
                          <span className={`inv-status-tag ${item.currentStock > 10 ? "healthy" : "low"}`}>
                            {item.currentStock > 10 ? "Optimal Stock" : "Low Stock Alert"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: MOVEMENT AUDIT LOGS */}
      {activeTab === "movements" && (
        <div className="inv-tab-body">
          {/* TOOLBAR */}
          <div className="inv-toolbar">
            <form onSubmit={handleSearchSubmit} className="inv-search-form">
              <Search size={18} className="inv-search-icon" />
              <input
                type="text"
                className="inv-search-input"
                placeholder="Search by SKU, item name, reference #, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="inv-filters-row">
              <select
                className="inv-filter-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="ALL">All Movement Types</option>
                <option value="stock_in">Stock In (Receipt)</option>
                <option value="stock_out">Stock Out (Issue)</option>
                <option value="adjustment">Stock Adjustment</option>
              </select>

              <select
                className="inv-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="raw_material">Raw Materials</option>
                <option value="finished_goods">Finished Goods</option>
                <option value="components">Components</option>
                <option value="packaging">Packaging</option>
              </select>
            </div>
          </div>

          <div className="inv-table-card">
            <table className="inv-data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Type</th>
                  <th>SKU & Item Name</th>
                  <th>Quantity</th>
                  <th>Reference #</th>
                  <th>Reason / Notes</th>
                  <th>Valuation Impact</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "3rem" }}>
                      <FileText size={36} color="#94A3B8" style={{ margin: "0 auto 0.5rem" }} />
                      <p style={{ color: "#64748B" }}>No stock movement records matching filters.</p>
                    </td>
                  </tr>
                ) : (
                  movements.map((mov) => (
                    <tr key={mov._id}>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "#64748B" }}>
                          {new Date(mov.createdAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>
                          {new Date(mov.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td>
                        <span className={`inv-type-badge ${mov.type}`}>
                          {mov.type === "stock_in" ? (
                            <><ArrowDownLeft size={14} /> Stock In</>
                          ) : mov.type === "stock_out" ? (
                            <><ArrowUpRight size={14} /> Stock Out</>
                          ) : (
                            <><SlidersHorizontal size={14} /> Adjustment</>
                          )}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{mov.itemName}</div>
                        <span className="inv-code-tag">{mov.sku}</span>
                      </td>
                      <td>
                        <strong style={{ color: mov.type === "stock_in" ? "#047857" : "#DC2626" }}>
                          {mov.type === "stock_in" ? "+" : "-"}{mov.quantity} {mov.unit}
                        </strong>
                      </td>
                      <td>
                        <span className="inv-ref-tag">{mov.referenceNumber}</span>
                      </td>
                      <td>
                        <div>{mov.reason || "Operational Transaction"}</div>
                        {mov.notes && <div style={{ fontSize: "0.8rem", color: "#64748B" }}>{mov.notes}</div>}
                      </td>
                      <td>
                        <strong>${(mov.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: REPORTS & VALUATION */}
      {activeTab === "reports" && (
        <div className="inv-tab-body">
          <div className="inv-report-grid">
            <div className="inv-report-card">
              <h3 className="inv-report-title">
                <DollarSign size={20} /> Total Valuation Summary
              </h3>
              <p style={{ color: "#64748B", marginBottom: "1.5rem" }}>
                Financial breakdown of inventory items on hand across all factory & warehouse units.
              </p>
              <div className="inv-report-metric-box">
                <div className="metric-row">
                  <span>Raw Materials Valuation</span>
                  <strong>
                    $
                    {stockLevels
                      .filter((i) => i.itemCategory === "raw_material")
                      .reduce((acc, i) => acc + i.totalValue, 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="metric-row">
                  <span>Finished Goods Valuation</span>
                  <strong>
                    $
                    {stockLevels
                      .filter((i) => i.itemCategory === "finished_goods")
                      .reduce((acc, i) => acc + i.totalValue, 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="metric-row total">
                  <span>Gross Inventory Asset Value</span>
                  <strong className="text-copper">
                    ${stats.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            </div>

            <div className="inv-report-card">
              <h3 className="inv-report-title">
                <CheckCircle2 size={20} /> Inventory Health Metrics
              </h3>
              <p style={{ color: "#64748B", marginBottom: "1.5rem" }}>
                Operational turnover stats and stock balance checks.
              </p>
              <div className="inv-health-stats">
                <div className="health-box">
                  <span className="health-num">{stockLevels.length}</span>
                  <span className="health-label">Active SKUs</span>
                </div>
                <div className="health-box">
                  <span className="health-num">{stockLevels.filter((s) => s.currentStock <= 10).length}</span>
                  <span className="health-label">Low Stock Warnings</span>
                </div>
                <div className="health-box">
                  <span className="health-num">99.4%</span>
                  <span className="health-label">Audit Accuracy Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECORD MOVEMENT MODAL */}
      {isModalOpen && (
        <div className="diws-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="diws-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
            <div className="diws-modal-header">
              <h3 className="diws-modal-title">
                {movementType === "stock_in"
                  ? "Record Stock In (Goods Receipt)"
                  : movementType === "stock_out"
                  ? "Record Stock Out (Goods Issue)"
                  : "Record Stock Adjustment"}
              </h3>
              <button type="button" className="diws-modal-close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleModalSubmit}>
              <div className="diws-modal-body">
                {formError && (
                  <div className="inv-error-alert">
                    <AlertCircle size={16} /> {formError}
                  </div>
                )}

                <div className="inv-form-group">
                  <label className="inv-form-label">Target Warehouse *</label>
                  <select
                    className="inv-form-input"
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    required
                  >
                    <option value="">Select Warehouse Location</option>
                    {warehouses.map((wh) => (
                      <option key={wh._id} value={wh._id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="inv-form-row">
                  <div className="inv-form-group">
                    <label className="inv-form-label">SKU Code *</label>
                    <input
                      type="text"
                      className="inv-form-input"
                      placeholder="e.g. SRV-800"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                    />
                  </div>

                  <div className="inv-form-group">
                    <label className="inv-form-label">Item Category</label>
                    <select
                      className="inv-form-input"
                      value={formData.itemCategory}
                      onChange={(e) => setFormData({ ...formData, itemCategory: e.target.value as any })}
                    >
                      <option value="finished_goods">Finished Goods</option>
                      <option value="raw_material">Raw Material</option>
                      <option value="components">Components</option>
                      <option value="packaging">Packaging</option>
                    </select>
                  </div>
                </div>

                <div className="inv-form-group">
                  <label className="inv-form-label">Item Name *</label>
                  <input
                    type="text"
                    className="inv-form-input"
                    placeholder="e.g. Brushless Servo Motor 3.5kW"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    required
                  />
                </div>

                <div className="inv-form-row">
                  <div className="inv-form-group">
                    <label className="inv-form-label">Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      className="inv-form-input"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="inv-form-group">
                    <label className="inv-form-label">Unit of Measure</label>
                    <input
                      type="text"
                      className="inv-form-input"
                      placeholder="pcs, kg, meters..."
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>

                  <div className="inv-form-group">
                    <label className="inv-form-label">Unit Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      className="inv-form-input"
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="inv-form-group">
                  <label className="inv-form-label">Reference # / PO / SO</label>
                  <input
                    type="text"
                    className="inv-form-input"
                    placeholder="e.g. PO-RECEIPT-9081"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  />
                </div>

                <div className="inv-form-group">
                  <label className="inv-form-label">Reason / Purpose</label>
                  <input
                    type="text"
                    className="inv-form-input"
                    placeholder="e.g. Supplier Purchase Delivery"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="diws-modal-footer">
                <button
                  type="button"
                  className="diws-btn diws-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="diws-btn diws-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Recording..." : "Confirm & Save Movement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
