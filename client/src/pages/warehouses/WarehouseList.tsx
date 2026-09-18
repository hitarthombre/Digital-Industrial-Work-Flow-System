import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import type { IWarehouse, WarehouseStatus, GetWarehousesResponse } from "../../types/warehouse";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import TransferModal from "../../components/warehouses/TransferModal";
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Users,
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Boxes,
  ArrowRightLeft,
  AlertTriangle,
  Snowflake,
  CheckCircle2,
  Wrench,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import "./WarehousePages.css";

export const WarehouseList: React.FC = () => {
  const navigate = useNavigate();

  // Data state
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [transferModalSourceId, setTransferModalSourceId] = useState<string | null>(null);
  const [deleteModalWarehouse, setDeleteModalWarehouse] = useState<IWarehouse | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, [page, statusFilter, typeFilter]);

  const fetchWarehouses = async (searchQuery = search) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 12,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (statusFilter && statusFilter !== "ALL") {
        params.status = statusFilter;
      }
      if (typeFilter && typeFilter !== "ALL") {
        params.type = typeFilter;
      }

      const response = await api.get<GetWarehousesResponse>("/warehouses", { params });

      if (response.data) {
        setWarehouses(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalCount(response.pagination.total || response.data.length);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch warehouses.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchWarehouses(search);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalWarehouse) return;
    setDeleting(true);
    try {
      await api.delete(`/warehouses/${deleteModalWarehouse._id}`);
      setDeleteModalWarehouse(null);
      fetchWarehouses();
    } catch (err: any) {
      alert(err.message || "Failed to delete warehouse");
    } finally {
      setDeleting(false);
    }
  };

  // Summary Metrics calculations
  const totalWarehouses = totalCount || warehouses.length;
  const activeCount = warehouses.filter((w) => w.status === "active").length;
  const totalCap = warehouses.reduce((acc, w) => acc + (w.capacity || 0), 0);
  const totalUsed = warehouses.reduce((acc, w) => acc + (w.currentUsage || 0), 0);
  const overallUtilPct = totalCap > 0 ? Math.round((totalUsed / totalCap) * 100) : 0;
  const coldStorageCount = warehouses.filter((w) => w.type === "cold_storage").length;

  const getStatusBadgeVariant = (status: WarehouseStatus) => {
    switch (status) {
      case "active":
        return "active";
      case "maintenance":
        return "maintenance";
      case "full":
        return "closed";
      case "inactive":
        return "inactive";
      case "closed":
        return "closed";
      default:
        return "neutral";
    }
  };

  const getStatusIcon = (status: WarehouseStatus) => {
    switch (status) {
      case "active":
        return <CheckCircle2 size={13} />;
      case "maintenance":
        return <Wrench size={13} />;
      case "full":
        return <AlertTriangle size={13} />;
      case "inactive":
        return <Clock size={13} />;
      case "closed":
        return <XCircle size={13} />;
    }
  };

  const formatLocationSummary = (loc?: IWarehouse["location"]) => {
    if (!loc) return "Location Not Specified";
    const parts = [loc.city, loc.state, loc.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : loc.address || "Location set";
  };

  const getManagerName = (manager?: IWarehouse["managerId"]) => {
    if (!manager) return "Unassigned";
    if (typeof manager === "object") {
      return `${manager.firstName} ${manager.lastName}`;
    }
    return "Assigned Manager";
  };

  return (
    <div className="wh-page-container">
      {/* Top Header */}
      <div className="wh-page-header">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Operations & Supply Chain</span>
            <span>•</span>
            <span>DIWS Platform</span>
          </div>
          <h1 className="wh-page-title">
            <WarehouseIcon className="text-amber-600 inline mr-2" size={28} />
            Warehouse & Logistics Management
          </h1>
          <p className="wh-page-subtitle">
            Monitor real-time storage capacities, manage regional depots, and execute stock transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={<ArrowRightLeft size={16} />}
            onClick={() => setTransferModalSourceId(warehouses[0]?._id || "")}
            disabled={warehouses.length < 2}
          >
            Transfer Stock
          </Button>
          <Button
            variant="copper"
            icon={<Plus size={18} />}
            onClick={() => navigate("/app/warehouses/new")}
          >
            Add Warehouse
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="wh-stats-grid">
        <div className="wh-stat-card">
          <div className="wh-stat-icon-wrapper amber">
            <WarehouseIcon size={24} />
          </div>
          <div className="wh-stat-info">
            <span className="wh-stat-label">Total Warehouses</span>
            <span className="wh-stat-value">{totalWarehouses} Sites</span>
            <span className="wh-stat-desc">{activeCount} Currently Active</span>
          </div>
        </div>

        <div className="wh-stat-card">
          <div className="wh-stat-icon-wrapper emerald">
            <Boxes size={24} />
          </div>
          <div className="wh-stat-info">
            <span className="wh-stat-label">Total Storage Capacity</span>
            <span className="wh-stat-value">{totalCap.toLocaleString()} Units</span>
            <span className="wh-stat-desc">{totalUsed.toLocaleString()} Currently Occupied</span>
          </div>
        </div>

        <div className="wh-stat-card">
          <div className="wh-stat-icon-wrapper blue">
            <TrendingUp size={24} />
          </div>
          <div className="wh-stat-info">
            <span className="wh-stat-label">Avg Utilization</span>
            <span className="wh-stat-value">{overallUtilPct}% Occupied</span>
            <span className="wh-stat-desc">
              {totalCap - totalUsed > 0
                ? `${(totalCap - totalUsed).toLocaleString()} Available`
                : "At Full Capacity"}
            </span>
          </div>
        </div>

        <div className="wh-stat-card">
          <div className="wh-stat-icon-wrapper indigo">
            <Snowflake size={24} />
          </div>
          <div className="wh-stat-info">
            <span className="wh-stat-label">Specialized Storage</span>
            <span className="wh-stat-value">{coldStorageCount} Cold Sites</span>
            <span className="wh-stat-desc">Refrigerated Logistics</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="wh-control-bar">
        <form onSubmit={handleSearchSubmit} className="wh-search-form">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by warehouse name, code, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="wh-search-input"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="wh-filters-group">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="wh-select-filter"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="full">Full</option>
              <option value="inactive">Inactive</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="wh-select-filter"
            >
              <option value="ALL">All Facility Types</option>
              <option value="general">General</option>
              <option value="raw_material">Raw Materials</option>
              <option value="finished_goods">Finished Goods</option>
              <option value="distribution">Distribution</option>
              <option value="cold_storage">Cold Storage</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="wh-view-toggle">
            <button
              className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid Card View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="wh-alert error mb-4">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => fetchWarehouses()} className="underline ml-auto font-medium text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="wh-loading-box">
          <RefreshCw className="animate-spin text-amber-600 mb-2" size={32} />
          <p className="text-slate-600 font-medium">Loading warehouse network data...</p>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="wh-empty-box">
          <WarehouseIcon size={48} className="text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Warehouses Found</h3>
          <p className="text-slate-500 text-sm max-w-md text-center mt-1 mb-4">
            {search || statusFilter !== "ALL" || typeFilter !== "ALL"
              ? "No warehouse locations match your active filter criteria."
              : "Get started by adding your first logistics warehouse or storage facility."}
          </p>
          <Button
            variant="copper"
            icon={<Plus size={16} />}
            onClick={() => navigate("/app/warehouses/new")}
          >
            Create First Warehouse
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Card View */
        <div className="wh-grid">
          {warehouses.map((wh) => {
            const cap = wh.capacity || 0;
            const usage = wh.currentUsage || 0;
            const pct = wh.utilizationPercentage !== undefined
              ? wh.utilizationPercentage
              : cap > 0
              ? Math.min(Math.round((usage / cap) * 100), 100)
              : 0;

            const managerName = getManagerName(wh.managerId);
            const isManagerAssigned = managerName !== "Unassigned";

            return (
              <div key={wh._id} className="wh-card">
                {/* Header */}
                <div className="wh-card-header">
                  <div className="flex items-center gap-2">
                    <span className="wh-code-badge">{wh.code}</span>
                    <span className={`wh-type-badge ${wh.type}`}>{wh.type.replace("_", " ")}</span>
                  </div>
                  <Badge
                    variant={getStatusBadgeVariant(wh.status)}
                    size="sm"
                    icon={getStatusIcon(wh.status)}
                  >
                    {wh.status}
                  </Badge>
                </div>

                {/* Body */}
                <div className="wh-card-body">
                  <h3
                    className="wh-card-title hover:text-amber-600 cursor-pointer"
                    onClick={() => navigate(`/app/warehouses/${wh._id}`)}
                  >
                    {wh.name}
                  </h3>

                  <div className="wh-card-meta">
                    <div className="meta-item">
                      <MapPin size={15} className="meta-icon" />
                      <span className="truncate">{formatLocationSummary(wh.location)}</span>
                    </div>

                    <div className="meta-item">
                      <Users size={15} className="meta-icon" />
                      <span
                        className={
                          isManagerAssigned ? "font-medium text-slate-800" : "text-slate-400 italic"
                        }
                      >
                        {managerName}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Progress Bar */}
                  <div className="wh-capacity-bar-container">
                    <div className="wh-capacity-labels">
                      <span className="font-semibold text-slate-600">Storage Occupancy</span>
                      <span className="font-bold text-slate-900">
                        {usage.toLocaleString()} / {cap.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="wh-progress-bg">
                      <div
                        className={`wh-progress-fill ${
                          pct >= 90 ? "danger" : pct >= 75 ? "warning" : "normal"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="wh-card-footer">
                  <button
                    className="card-action-btn primary"
                    onClick={() => navigate(`/app/warehouses/${wh._id}`)}
                    title="View Details"
                  >
                    <Eye size={15} />
                    <span>View</span>
                  </button>

                  <button
                    className="card-action-btn"
                    onClick={() => navigate(`/app/warehouses/${wh._id}/edit`)}
                    title="Edit Details"
                  >
                    <Edit size={15} />
                    <span>Edit</span>
                  </button>

                  <button
                    className="card-action-btn transfer"
                    onClick={() => setTransferModalSourceId(wh._id)}
                    title="Transfer Stock"
                  >
                    <ArrowRightLeft size={15} />
                    <span>Transfer</span>
                  </button>

                  <button
                    className="card-action-btn danger"
                    onClick={() => setDeleteModalWarehouse(wh)}
                    title="Delete Warehouse"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="wh-table-card">
          <table className="diws-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Warehouse Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Location</th>
                <th>Occupancy / Capacity</th>
                <th>Manager</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((wh) => {
                const cap = wh.capacity || 0;
                const usage = wh.currentUsage || 0;
                const pct = wh.utilizationPercentage !== undefined
                  ? wh.utilizationPercentage
                  : cap > 0
                  ? Math.min(Math.round((usage / cap) * 100), 100)
                  : 0;

                return (
                  <tr key={wh._id}>
                    <td>
                      <span className="font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs">
                        {wh.code}
                      </span>
                    </td>
                    <td>
                      <div
                        className="font-bold text-slate-900 hover:text-amber-600 cursor-pointer"
                        onClick={() => navigate(`/app/warehouses/${wh._id}`)}
                      >
                        {wh.name}
                      </div>
                      {wh.contactEmail && (
                        <div className="text-xs text-slate-500">{wh.contactEmail}</div>
                      )}
                    </td>
                    <td>
                      <span className={`wh-type-badge ${wh.type}`}>
                        {wh.type.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <Badge
                        variant={getStatusBadgeVariant(wh.status)}
                        size="sm"
                        icon={getStatusIcon(wh.status)}
                      >
                        {wh.status}
                      </Badge>
                    </td>
                    <td>
                      <span className="text-sm text-slate-700">
                        {formatLocationSummary(wh.location)}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 min-w-[140px]">
                        <span className="text-xs font-bold text-slate-800">
                          {usage.toLocaleString()} / {cap.toLocaleString()} ({pct}%)
                        </span>
                        <div className="wh-progress-bg">
                          <div
                            className={`wh-progress-fill ${
                              pct >= 90 ? "danger" : pct >= 75 ? "warning" : "normal"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-slate-800 font-medium">
                        {getManagerName(wh.managerId)}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="table-action-icon"
                          onClick={() => navigate(`/app/warehouses/${wh._id}`)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="table-action-icon"
                          onClick={() => navigate(`/app/warehouses/${wh._id}/edit`)}
                          title="Edit Warehouse"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="table-action-icon text-blue-600 hover:bg-blue-50"
                          onClick={() => setTransferModalSourceId(wh._id)}
                          title="Stock Transfer"
                        >
                          <ArrowRightLeft size={16} />
                        </button>
                        <button
                          className="table-action-icon text-rose-600 hover:bg-rose-50"
                          onClick={() => setDeleteModalWarehouse(wh)}
                          title="Delete Warehouse"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="wh-pagination">
          <span className="text-xs text-slate-500">
            Showing page {page} of {totalPages} ({totalCount} total warehouses)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {transferModalSourceId !== null && (
        <TransferModal
          isOpen={transferModalSourceId !== null}
          onClose={() => setTransferModalSourceId(null)}
          warehouses={warehouses}
          initialSourceId={transferModalSourceId}
          onSuccess={() => fetchWarehouses()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalWarehouse && (
        <Modal
          isOpen={!!deleteModalWarehouse}
          onClose={() => setDeleteModalWarehouse(null)}
          title="Deactivate / Delete Warehouse"
          maxWidth="sm"
          footer={
            <div className="flex justify-end gap-3 w-full">
              <Button
                variant="outline"
                type="button"
                onClick={() => setDeleteModalWarehouse(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                type="button"
                onClick={handleDeleteConfirm}
                loading={deleting}
              >
                Confirm Delete
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-700">
              Are you sure you want to delete warehouse <strong>{deleteModalWarehouse.name}</strong> ({deleteModalWarehouse.code})?
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              This action will deactivate the facility location. Recorded transfers and inventory audit logs will be retained.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WarehouseList;
