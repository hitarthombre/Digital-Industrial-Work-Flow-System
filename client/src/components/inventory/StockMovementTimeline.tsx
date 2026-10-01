import React, { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Search,
  List,
  GitCommit,
  User,
} from "lucide-react";
import type { IStockMovementItem } from "../../services/inventoryService";

interface StockMovementTimelineProps {
  movements: IStockMovementItem[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedType: string;
  onTypeChange: (t: string) => void;
  selectedCategory: string;
  onCategoryChange: (c: string) => void;
  warehouses: any[];
  selectedWarehouse: string;
  onWarehouseChange: (w: string) => void;
}

export const StockMovementTimeline: React.FC<StockMovementTimelineProps> = ({
  movements,
  loading,
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  warehouses,
  selectedWarehouse,
  onWarehouseChange,
}) => {
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  const getIcon = (type: string) => {
    switch (type) {
      case "stock_in":
        return <ArrowDownLeft size={16} className="text-emerald-600" />;
      case "stock_out":
        return <ArrowUpRight size={16} className="text-red-600" />;
      case "transfer":
        return <ArrowLeftRight size={16} className="text-blue-600" />;
      case "adjustment":
        return <SlidersHorizontal size={16} className="text-amber-600" />;
      default:
        return <GitCommit size={16} className="text-slate-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "stock_in":
        return "Stock In";
      case "stock_out":
        return "Stock Out";
      case "transfer":
        return "Transfer";
      case "adjustment":
        return "Adjustment";
      default:
        return type;
    }
  };

  return (
    <div className="inv-timeline-container">
      {/* FILTER TOOLBAR & VIEW TOGGLE */}
      <div className="inv-toolbar">
        <div className="inv-search-form">
          <Search size={18} className="inv-search-icon" />
          <input
            type="text"
            className="inv-search-input"
            placeholder="Search movement audit history by SKU, item name, ref #, or reason..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="inv-filters-row">
          <select
            className="inv-filter-select"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="ALL">All Movement Types</option>
            <option value="stock_in">Stock In (Receipts)</option>
            <option value="stock_out">Stock Out (Dispatches)</option>
            <option value="transfer">Stock Transfer</option>
            <option value="adjustment">Stock Adjustment</option>
          </select>

          <select
            className="inv-filter-select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="raw_material">Raw Materials</option>
            <option value="finished_goods">Finished Goods</option>
            <option value="components">Components</option>
            <option value="packaging">Packaging</option>
          </select>

          {warehouses && warehouses.length > 0 && (
            <select
              className="inv-filter-select"
              value={selectedWarehouse}
              onChange={(e) => onWarehouseChange(e.target.value)}
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh._id} value={wh._id}>
                  {wh.name}
                </option>
              ))}
            </select>
          )}

          {/* VIEW SWITCHER */}
          <div className="inv-view-toggle">
            <button
              type="button"
              className={`inv-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Audit Table View"
            >
              <List size={16} /> Table
            </button>
            <button
              type="button"
              className={`inv-toggle-btn ${viewMode === "timeline" ? "active" : ""}`}
              onClick={() => setViewMode("timeline")}
              title="Timeline Graph View"
            >
              <GitCommit size={16} /> Timeline
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="diws-spinner" style={{ margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary)" }}>Loading movement history logs...</p>
        </div>
      ) : movements.length === 0 ? (
        <div className="inv-table-card" style={{ padding: "3rem", textAlign: "center" }}>
          <GitCommit size={40} color="#94A3B8" style={{ margin: "0 auto 0.5rem" }} />
          <p style={{ color: "#64748B", fontWeight: 600 }}>No stock movement records found.</p>
          <p style={{ color: "#94A3B8", fontSize: "0.85rem" }}>Try clearing search or changing category/type filters.</p>
        </div>
      ) : viewMode === "table" ? (
        /* AUDIT TABLE VIEW */
        <div className="inv-table-card">
          <table className="inv-data-table">
            <thead>
              <tr>
                <th>Timestamp & User</th>
                <th>Type</th>
                <th>SKU & Item Name</th>
                <th>Quantity</th>
                <th>Reference #</th>
                <th>Reason / Destination</th>
                <th>Valuation Impact</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((mov) => {
                const userName =
                  mov.performedBy?.firstName
                    ? `${mov.performedBy.firstName} ${mov.performedBy.lastName || ""}`
                    : "System User";

                return (
                  <tr key={mov._id}>
                    <td>
                      <div className="font-semibold text-slate-800 text-xs">
                        {new Date(mov.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(mov.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <User size={11} /> {userName}
                      </div>
                    </td>
                    <td>
                      <span className={`inv-type-badge ${mov.type}`}>
                        {getIcon(mov.type)} {getTypeLabel(mov.type)}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-800">{mov.itemName}</div>
                      <span className="inv-code-tag">{mov.sku}</span>
                    </td>
                    <td>
                      <strong
                        className={`text-sm ${
                          mov.type === "stock_in"
                            ? "text-emerald-700"
                            : mov.type === "stock_out"
                            ? "text-red-700"
                            : "text-blue-700"
                        }`}
                      >
                        {mov.type === "stock_in" ? "+" : mov.type === "stock_out" ? "-" : ""}{mov.quantity} {mov.unit}
                      </strong>
                    </td>
                    <td>
                      <span className="inv-ref-tag">{mov.referenceNumber}</span>
                    </td>
                    <td>
                      <div className="text-sm font-medium">{mov.reason || "Inventory Movement"}</div>
                      {mov.notes && <div className="text-xs text-slate-400 italic">{mov.notes}</div>}
                    </td>
                    <td>
                      <strong className="text-slate-800 font-semibold">
                        ${(mov.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* VISUAL TIMELINE VIEW */
        <div className="inv-timeline-wrapper">
          <div className="inv-timeline-track">
            {movements.map((mov) => {
              const userName =
                mov.performedBy?.firstName
                  ? `${mov.performedBy.firstName} ${mov.performedBy.lastName || ""}`
                  : "System User";

              return (
                <div key={mov._id} className="inv-timeline-item">
                  <div className={`inv-timeline-node ${mov.type}`}>
                    {getIcon(mov.type)}
                  </div>
                  <div className="inv-timeline-card">
                    <div className="inv-timeline-header">
                      <div className="flex items-center gap-2">
                        <span className={`inv-type-badge ${mov.type}`}>
                          {getTypeLabel(mov.type)}
                        </span>
                        <span className="inv-ref-tag">{mov.referenceNumber}</span>
                      </div>
                      <span className="inv-timeline-time">
                        {new Date(mov.createdAt).toLocaleDateString()} at{" "}
                        {new Date(mov.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="inv-timeline-body">
                      <div className="inv-timeline-item-title">
                        <h4>{mov.itemName}</h4>
                        <span className="inv-code-tag">{mov.sku}</span>
                      </div>

                      <div className="inv-timeline-metrics">
                        <div className="inv-tl-metric">
                          <span>Quantity Transacted</span>
                          <strong
                            className={
                              mov.type === "stock_in"
                                ? "text-emerald-700"
                                : mov.type === "stock_out"
                                ? "text-red-700"
                                : "text-blue-700"
                            }
                          >
                            {mov.type === "stock_in" ? "+" : mov.type === "stock_out" ? "-" : ""}{mov.quantity} {mov.unit}
                          </strong>
                        </div>

                        <div className="inv-tl-metric">
                          <span>Valuation Impact</span>
                          <strong>
                            ${(mov.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </div>

                      <div className="inv-timeline-reason">
                        <p>{mov.reason || "Operational Inventory Transaction"}</p>
                        {mov.notes && <span className="inv-tl-notes">Notes: {mov.notes}</span>}
                      </div>
                    </div>

                    <div className="inv-timeline-footer">
                      <span className="flex items-center gap-1 text-slate-500 text-xs">
                        <User size={12} /> Executed by: {userName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
