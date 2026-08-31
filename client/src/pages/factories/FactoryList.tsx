import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import type { IFactory, FactoryStatus } from "../../types/factory";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import FactoryStatusModal from "../../components/factories/FactoryStatusModal";
import AssignManagerModal from "../../components/factories/AssignManagerModal";
import {
  Factory,
  MapPin,
  Users,
  Gauge,
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  Wrench,
  XCircle,
  AlertTriangle,
  Layers,
} from "lucide-react";
import "./FactoryPages.css";

export const FactoryList: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [factories, setFactories] = useState<IFactory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [statusModalFactory, setStatusModalFactory] = useState<IFactory | null>(null);
  const [managerModalFactory, setManagerModalFactory] = useState<IFactory | null>(null);
  const [deleteModalFactory, setDeleteModalFactory] = useState<IFactory | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFactories();
  }, [page, statusFilter]);

  const fetchFactories = async (searchQuery = search) => {
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

      const response = await api.get<{
        success: boolean;
        data: IFactory[];
        pagination: { total: number; page: number; totalPages: number };
      }>("/factories", { params });

      if (response.data) {
        setFactories(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalCount(response.pagination.total || response.data.length);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load factory facilities.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFactories(search);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalFactory) return;
    setDeleting(true);
    try {
      await api.delete(`/factories/${deleteModalFactory._id}`);
      setDeleteModalFactory(null);
      fetchFactories();
    } catch (err: any) {
      alert(err.message || "Failed to delete factory");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateSuccess = (updated: IFactory) => {
    setFactories((prev) =>
      prev.map((f) => (f._id === updated._id ? { ...f, ...updated } : f))
    );
  };

  const getStatusBadgeVariant = (status: FactoryStatus) => {
    switch (status) {
      case "active":
        return "active";
      case "maintenance":
        return "maintenance";
      case "inactive":
        return "inactive";
      case "closed":
        return "closed";
      default:
        return "neutral";
    }
  };

  const getStatusIcon = (status: FactoryStatus) => {
    switch (status) {
      case "active":
        return <CheckCircle2 size={13} />;
      case "maintenance":
        return <Wrench size={13} />;
      case "inactive":
        return <Clock size={13} />;
      case "closed":
        return <XCircle size={13} />;
    }
  };

  const formatLocationSummary = (loc?: IFactory["location"]) => {
    if (!loc) return "Address Not Specified";
    const parts = [loc.city, loc.state, loc.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : loc.address || "Location set";
  };

  const getManagerName = (manager?: IFactory["managerId"]) => {
    if (!manager) return "Unassigned";
    if (typeof manager === "object") {
      return `${manager.firstName} ${manager.lastName}`;
    }
    return "Assigned Manager";
  };

  return (
    <div className="factory-page-container">
      {/* Page Header */}
      <div className="factory-page-header">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Module 8</span>
            <span>•</span>
            <span>Digital Industrial System</span>
          </div>
          <h1 className="factory-page-title">
            <Factory className="text-amber-600 inline mr-2" size={28} />
            Factory Management
          </h1>
          <p className="factory-page-subtitle">
            Manage operational plant sites, daily capacity limits, manager assignments, and GPS locations.
          </p>
        </div>

        <Button
          variant="copper"
          icon={<Plus size={18} />}
          onClick={() => navigate("/app/factories/new")}
        >
          Add Factory
        </Button>
      </div>

      {/* Control Bar: Search, Filters & View Toggle */}
      <div className="factory-control-bar">
        <form onSubmit={handleSearchSubmit} className="factory-search-form">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by factory name, code, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="factory-search-input"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="factory-filters-group">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="factory-select-filter"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="factory-view-toggle">
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
        <div className="factory-alert error mb-4">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => fetchFactories()} className="underline ml-auto font-medium text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="factory-loading-box">
          <RefreshCw className="animate-spin text-amber-600 mb-2" size={32} />
          <p className="text-slate-600 font-medium">Fetching factory network data...</p>
        </div>
      ) : factories.length === 0 ? (
        <div className="factory-empty-box">
          <Factory size={48} className="text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Factories Found</h3>
          <p className="text-slate-500 text-sm max-w-md text-center mt-1 mb-4">
            {search || statusFilter !== "ALL"
              ? "No plant sites match your active search criteria or status filter."
              : "Get started by adding your first production facility or industrial plant."}
          </p>
          <Button
            variant="copper"
            icon={<Plus size={16} />}
            onClick={() => navigate("/app/factories/new")}
          >
            Create First Factory
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Card View */
        <div className="factory-grid">
          {factories.map((factory) => {
            const managerName = getManagerName(factory.managerId);
            const isManagerAssigned = managerName !== "Unassigned";

            return (
              <div key={factory._id} className="factory-card">
                {/* Card Top Banner */}
                <div className="factory-card-header">
                  <div className="flex items-center gap-2">
                    <span className="factory-code-badge">{factory.code}</span>
                    <Badge
                      variant={getStatusBadgeVariant(factory.status)}
                      size="sm"
                      icon={getStatusIcon(factory.status)}
                    >
                      {factory.status}
                    </Badge>
                  </div>
                </div>

                {/* Main Content */}
                <div className="factory-card-body">
                  <h3
                    className="factory-card-name hover:text-amber-600 cursor-pointer"
                    onClick={() => navigate(`/app/factories/${factory._id}`)}
                  >
                    {factory.name}
                  </h3>

                  <div className="factory-card-meta">
                    <div className="meta-item">
                      <MapPin size={15} className="meta-icon" />
                      <span className="truncate">{formatLocationSummary(factory.location)}</span>
                    </div>

                    <div className="meta-item">
                      <Users size={15} className="meta-icon" />
                      <span className={isManagerAssigned ? "font-medium text-slate-800" : "text-slate-400 italic"}>
                        {managerName}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="factory-metrics-row">
                    <div className="metric-col">
                      <span className="metric-label">
                        <Gauge size={12} className="inline mr-1 text-amber-600" />
                        Daily Quota
                      </span>
                      <span className="metric-value">
                        {factory.capacity ? `${factory.capacity.toLocaleString()} Units` : "N/A"}
                      </span>
                    </div>

                    <div className="metric-col">
                      <span className="metric-label">
                        <Layers size={12} className="inline mr-1 text-amber-600" />
                        Plant Area
                      </span>
                      <span className="metric-value">
                        {factory.totalSqFt ? `${factory.totalSqFt.toLocaleString()} sq ft` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Quick Action Footer */}
                <div className="factory-card-footer">
                  <button
                    className="card-action-btn primary"
                    onClick={() => navigate(`/app/factories/${factory._id}`)}
                    title="View Details"
                  >
                    <Eye size={15} />
                    <span>View</span>
                  </button>

                  <button
                    className="card-action-btn"
                    onClick={() => navigate(`/app/factories/${factory._id}/edit`)}
                    title="Edit Details"
                  >
                    <Edit size={15} />
                    <span>Edit</span>
                  </button>

                  <button
                    className="card-action-btn"
                    onClick={() => setStatusModalFactory(factory)}
                    title="Change Status"
                  >
                    <RefreshCw size={15} />
                    <span>Status</span>
                  </button>

                  <button
                    className="card-action-btn danger"
                    onClick={() => setDeleteModalFactory(factory)}
                    title="Delete Factory"
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
        <div className="factory-table-card">
          <table className="diws-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Factory Name</th>
                <th>Status</th>
                <th>Location</th>
                <th>Manager</th>
                <th>Daily Capacity</th>
                <th>Shifts</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {factories.map((factory) => (
                <tr key={factory._id}>
                  <td>
                    <span className="font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs">
                      {factory.code}
                    </span>
                  </td>
                  <td>
                    <div
                      className="font-bold text-slate-900 hover:text-amber-600 cursor-pointer"
                      onClick={() => navigate(`/app/factories/${factory._id}`)}
                    >
                      {factory.name}
                    </div>
                    {factory.contactEmail && (
                      <div className="text-xs text-slate-500">{factory.contactEmail}</div>
                    )}
                  </td>
                  <td>
                    <Badge
                      variant={getStatusBadgeVariant(factory.status)}
                      size="sm"
                      icon={getStatusIcon(factory.status)}
                    >
                      {factory.status}
                    </Badge>
                  </td>
                  <td>
                    <span className="text-sm text-slate-700">
                      {formatLocationSummary(factory.location)}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-slate-800 font-medium">
                      {getManagerName(factory.managerId)}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold text-slate-800 text-sm">
                      {factory.capacity ? factory.capacity.toLocaleString() : "—"}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                      {factory.shiftCount ? `${factory.shiftCount} shifts/day` : "1 shift"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="table-action-icon"
                        onClick={() => navigate(`/app/factories/${factory._id}`)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="table-action-icon"
                        onClick={() => navigate(`/app/factories/${factory._id}/edit`)}
                        title="Edit Factory"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="table-action-icon"
                        onClick={() => setStatusModalFactory(factory)}
                        title="Change Operational Status"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        className="table-action-icon text-rose-600 hover:bg-rose-50"
                        onClick={() => setDeleteModalFactory(factory)}
                        title="Delete Factory"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="factory-pagination">
          <span className="text-xs text-slate-500">
            Showing page {page} of {totalPages} ({totalCount} total sites)
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

      {/* Status Change Modal */}
      {statusModalFactory && (
        <FactoryStatusModal
          isOpen={!!statusModalFactory}
          onClose={() => setStatusModalFactory(null)}
          factory={statusModalFactory}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* Manager Assignment Modal */}
      {managerModalFactory && (
        <AssignManagerModal
          isOpen={!!managerModalFactory}
          onClose={() => setManagerModalFactory(null)}
          factory={managerModalFactory}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalFactory && (
        <Modal
          isOpen={!!deleteModalFactory}
          onClose={() => setDeleteModalFactory(null)}
          title="Deactivate / Delete Factory"
          maxWidth="sm"
          footer={
            <div className="flex justify-end gap-3 w-full">
              <Button
                variant="outline"
                type="button"
                onClick={() => setDeleteModalFactory(null)}
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
              Are you sure you want to delete <strong>{deleteModalFactory.name}</strong> ({deleteModalFactory.code})?
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              Deactivating this site will remove it from active allocation. Existing historical records will be archived.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FactoryList;
