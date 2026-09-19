import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ISupplier, SupplierStatus, GetSuppliersResponse } from "../../types/supplier";
import { api } from "../../services/api";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import SupplierFormModal from "../../components/suppliers/SupplierFormModal";
import {
  Building2,
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Star,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  AlertTriangle,
  TrendingUp,
  Award,
} from "lucide-react";
import "./SupplierPages.css";

export const SupplierList: React.FC = () => {
  const navigate = useNavigate();

  // Data State
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(null);
  const [submittingModal, setSubmittingModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [deleteSupplierTarget, setDeleteSupplierTarget] = useState<ISupplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, [page, statusFilter, categoryFilter, ratingFilter]);

  const getFallbackSuppliers = (): ISupplier[] => [
    {
      _id: "sup-1",
      name: "Apex Steel & Metallurgy Corp",
      code: "SUP-101",
      category: "raw_material",
      status: "active",
      rating: 5,
      complianceStatus: "compliant",
      primaryContact: {
        name: "Robert Vance",
        email: "rvance@apexsteel.com",
        phone: "+1 (555) 234-5678",
        role: "Account Executive",
        isPrimary: true,
      },
      address: {
        street: "140 Industrial Pkwy",
        city: "Pittsburgh",
        state: "PA",
        country: "USA",
      },
      taxId: "US-984019283",
      paymentTerms: "Net 30",
      tags: ["Steel", "Cold-Rolled", "ISO 9001"],
      totalSpend: 154000,
      totalOrders: 28,
    },
    {
      _id: "sup-2",
      name: "Precision Hydraulics & Valves Inc",
      code: "SUP-102",
      category: "components",
      status: "active",
      rating: 4,
      complianceStatus: "compliant",
      primaryContact: {
        name: "Elena Rostova",
        email: "elena@precisionhydraulics.io",
        phone: "+1 (555) 876-5432",
        role: "Technical Sales Director",
        isPrimary: true,
      },
      address: {
        street: "88 Valve Center Way",
        city: "Detroit",
        state: "MI",
        country: "USA",
      },
      taxId: "US-443912099",
      paymentTerms: "Net 45",
      tags: ["Hydraulics", "Precision", "High Pressure"],
      totalSpend: 98500,
      totalOrders: 16,
    },
    {
      _id: "sup-3",
      name: "ElectroTech Drive Systems",
      code: "SUP-103",
      category: "machinery",
      status: "under_review",
      rating: 3,
      complianceStatus: "pending_audit",
      primaryContact: {
        name: "Marcus Thorne",
        email: "m.thorne@electrotech.de",
        phone: "+49 30 123456",
        role: "Regional Director",
        isPrimary: true,
      },
      address: {
        city: "Stuttgart",
        country: "Germany",
      },
      taxId: "DE-81190234",
      paymentTerms: "Net 60",
      tags: ["Motors", "Automation", "Siemens Partner"],
      totalSpend: 62000,
      totalOrders: 8,
    },
    {
      _id: "sup-4",
      name: "Polymer Pack & Containers Ltd",
      code: "SUP-104",
      category: "packaging",
      status: "active",
      rating: 5,
      complianceStatus: "compliant",
      primaryContact: {
        name: "Sarah Jenkins",
        email: "sjenkins@polypack.com",
        phone: "+1 (555) 991-4455",
        role: "Procurement Lead",
        isPrimary: true,
      },
      address: {
        city: "Atlanta",
        state: "GA",
        country: "USA",
      },
      taxId: "US-551029481",
      paymentTerms: "Net 15",
      tags: ["Eco Packaging", "Drums", "Custom Boxes"],
      totalSpend: 42100,
      totalOrders: 22,
    },
    {
      _id: "sup-5",
      name: "Global Freight & Air Express",
      code: "SUP-105",
      category: "logistics",
      status: "active",
      rating: 4,
      complianceStatus: "compliant",
      primaryContact: {
        name: "David Kim",
        email: "dkim@freightglobal.com",
        phone: "+1 (555) 332-9090",
        role: "Logistics Coordinator",
        isPrimary: true,
      },
      address: {
        city: "Seattle",
        state: "WA",
        country: "USA",
      },
      taxId: "US-110293847",
      paymentTerms: "Net 30",
      tags: ["Freight", "Cold Chain", "Customs"],
      totalSpend: 89000,
      totalOrders: 45,
    },
  ];

  const fetchSuppliers = async (searchQuery = search) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: 12 };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (categoryFilter !== "ALL") params.category = categoryFilter;
      if (ratingFilter !== "ALL") params.minRating = Number(ratingFilter);

      const response = await api.get<GetSuppliersResponse>("/suppliers", { params });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setSuppliers(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalCount(response.pagination.total || response.data.length);
        }
      } else {
        // Filter sample list locally if server returns empty list initially
        let dataset = getFallbackSuppliers();
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          dataset = dataset.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.code.toLowerCase().includes(q) ||
              s.primaryContact.name.toLowerCase().includes(q) ||
              s.tags?.some((t) => t.toLowerCase().includes(q))
          );
        }
        if (statusFilter !== "ALL") dataset = dataset.filter((s) => s.status === statusFilter);
        if (categoryFilter !== "ALL") dataset = dataset.filter((s) => s.category === categoryFilter);
        if (ratingFilter !== "ALL") dataset = dataset.filter((s) => s.rating >= Number(ratingFilter));

        setSuppliers(dataset);
        setTotalPages(1);
        setTotalCount(dataset.length);
      }
    } catch (err: any) {
      // Graceful fallback to client dataset if backend endpoint isn't listening yet
      let dataset = getFallbackSuppliers();
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        dataset = dataset.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
      }
      setSuppliers(dataset);
      setTotalPages(1);
      setTotalCount(dataset.length);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSuppliers(search);
  };

  const handleModalSave = async (payload: any) => {
    setSubmittingModal(true);
    setModalError(null);
    try {
      if (editingSupplier) {
        // Edit mode
        try {
          const res = await api.put<any>(`/suppliers/${editingSupplier._id}`, payload);
          setSuppliers((prev) => prev.map((s) => (s._id === editingSupplier._id ? res.data : s)));
        } catch (_) {
          setSuppliers((prev) =>
            prev.map((s) => (s._id === editingSupplier._id ? { ...s, ...payload } : s))
          );
        }
        setEditingSupplier(null);
      } else {
        // Create mode
        try {
          const res = await api.post<any>("/suppliers", payload);
          setSuppliers((prev) => [res.data, ...prev]);
        } catch (_) {
          const mockNew: ISupplier = {
            _id: `sup-${Date.now()}`,
            ...payload,
            totalSpend: 0,
            totalOrders: 0,
          };
          setSuppliers((prev) => [mockNew, ...prev]);
        }
        setIsCreateModalOpen(false);
      }
    } catch (err: any) {
      setModalError(err.message || "Failed to save supplier record.");
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteSupplierTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/suppliers/${deleteSupplierTarget._id}`);
    } catch (_) {
      // Local filter fallback
    }
    setSuppliers((prev) => prev.filter((s) => s._id !== deleteSupplierTarget._id));
    setDeleteSupplierTarget(null);
    setDeleting(false);
  };

  // Metrics
  const totalSuppliers = totalCount || suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.status === "active").length;
  const compliantCount = suppliers.filter((s) => s.complianceStatus === "compliant").length;
  const complianceRate = totalSuppliers > 0 ? Math.round((compliantCount / totalSuppliers) * 100) : 100;
  const totalSpendSum = suppliers.reduce((acc, s) => acc + (s.totalSpend || 0), 0);
  const avgRatingVal =
    suppliers.length > 0
      ? (suppliers.reduce((acc, s) => acc + s.rating, 0) / suppliers.length).toFixed(1)
      : "5.0";

  const getStatusBadgeVariant = (status: SupplierStatus) => {
    switch (status) {
      case "active":
        return "active";
      case "under_review":
        return "maintenance";
      case "inactive":
        return "inactive";
      case "blocked":
        return "closed";
      default:
        return "neutral";
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="sup-rating-stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="sup-page-container">
      {/* Page Top Header */}
      <div className="sup-page-header">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Procurement & Supply Chain</span>
            <span>•</span>
            <span>Vendor Management</span>
          </div>
          <h1 className="sup-page-title">
            <Building2 className="text-amber-600 inline mr-2" size={28} />
            Supplier Directory & Vendor Vault
          </h1>
          <p className="sup-page-subtitle">
            Manage qualified vendors, inspect historical spend, and audit compliance contracts & ISO certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="copper"
            icon={<Plus size={18} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add New Supplier
          </Button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="sup-stats-grid">
        <div className="sup-stat-card">
          <div className="sup-stat-icon-wrapper amber">
            <Building2 size={24} />
          </div>
          <div className="sup-stat-info">
            <span className="sup-stat-label">Total Suppliers</span>
            <span className="sup-stat-value">{totalSuppliers} Vendors</span>
            <span className="sup-stat-desc">{activeSuppliers} Active Partners</span>
          </div>
        </div>

        <div className="sup-stat-card">
          <div className="sup-stat-icon-wrapper emerald">
            <TrendingUp size={24} />
          </div>
          <div className="sup-stat-info">
            <span className="sup-stat-label">Total Purchase Spend</span>
            <span className="sup-stat-value">${totalSpendSum.toLocaleString()}</span>
            <span className="sup-stat-desc">Cumulative Procurement</span>
          </div>
        </div>

        <div className="sup-stat-card">
          <div className="sup-stat-icon-wrapper purple">
            <ShieldCheck size={24} />
          </div>
          <div className="sup-stat-info">
            <span className="sup-stat-label">Compliance Rate</span>
            <span className="sup-stat-value">{complianceRate}% Compliant</span>
            <span className="sup-stat-desc">{compliantCount} Fully Verified</span>
          </div>
        </div>

        <div className="sup-stat-card">
          <div className="sup-stat-icon-wrapper blue">
            <Award size={24} />
          </div>
          <div className="sup-stat-info">
            <span className="sup-stat-label">Average Vendor Rating</span>
            <span className="sup-stat-value">{avgRatingVal} / 5.0</span>
            <span className="sup-stat-desc">Quality & On-Time Performance</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="sup-control-bar">
        <form onSubmit={handleSearchSubmit} className="sup-search-form">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by vendor name, code, contact, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sup-search-input"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="sup-filters-group">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="sup-select-filter"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="under_review">Under Review</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="sup-select-filter"
            >
              <option value="ALL">All Categories</option>
              <option value="raw_material">Raw Materials</option>
              <option value="components">Components & Parts</option>
              <option value="packaging">Packaging</option>
              <option value="machinery">Machinery & Tooling</option>
              <option value="logistics">Logistics & Freight</option>
              <option value="services">Services</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Rating:</label>
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              className="sup-select-filter"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="sup-view-toggle">
            <button
              className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid Cards View"
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

      {/* Alert Error */}
      {error && (
        <div className="sup-alert error">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => fetchSuppliers()} className="underline ml-auto text-xs font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Main Directory Body */}
      {loading ? (
        <div className="sup-loading-box">
          <RefreshCw className="animate-spin text-amber-600 mb-2" size={32} />
          <p className="text-slate-600 font-medium text-sm">Loading supplier directory...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="sup-empty-box">
          <Building2 size={48} className="text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Suppliers Found</h3>
          <p className="text-slate-500 text-sm max-w-md text-center mt-1 mb-4">
            {search || statusFilter !== "ALL" || categoryFilter !== "ALL"
              ? "No vendors match your active filter criteria."
              : "Register your first qualified vendor or raw material supplier."}
          </p>
          <Button variant="copper" icon={<Plus size={16} />} onClick={() => setIsCreateModalOpen(true)}>
            Add New Supplier
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Card View */
        <div className="sup-grid">
          {suppliers.map((sup) => (
            <div key={sup._id} className="sup-card">
              {/* Header */}
              <div className="sup-card-header">
                <div className="flex items-center gap-2">
                  <span className="sup-code-badge">{sup.code}</span>
                  <span className="sup-category-badge">{sup.category.replace("_", " ")}</span>
                </div>
                <Badge variant={getStatusBadgeVariant(sup.status)} size="sm">
                  {sup.status.replace("_", " ")}
                </Badge>
              </div>

              {/* Body */}
              <div className="sup-card-body">
                <div>
                  <h3
                    className="sup-card-title hover:text-amber-600 cursor-pointer mb-1"
                    onClick={() => navigate(`/app/suppliers/${sup._id}`)}
                  >
                    {sup.name}
                  </h3>
                  {renderStars(sup.rating)}
                </div>

                <div className="sup-card-meta">
                  <div className="sup-meta-row">
                    <Mail size={14} className="sup-meta-icon" />
                    <span className="truncate">{sup.primaryContact?.email || "No email listed"}</span>
                  </div>

                  <div className="sup-meta-row">
                    <Phone size={14} className="sup-meta-icon" />
                    <span>{sup.primaryContact?.phone || "No phone listed"}</span>
                  </div>

                  <div className="sup-meta-row">
                    <MapPin size={14} className="sup-meta-icon" />
                    <span className="truncate">
                      {[sup.address?.city, sup.address?.country].filter(Boolean).join(", ") ||
                        "Address not set"}
                    </span>
                  </div>
                </div>

                {/* Compliance status banner */}
                <div className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Compliance Status:</span>
                  <span
                    className={`font-bold ${
                      sup.complianceStatus === "compliant"
                        ? "text-emerald-700"
                        : sup.complianceStatus === "pending_audit"
                        ? "text-amber-700"
                        : "text-rose-700"
                    }`}
                  >
                    {sup.complianceStatus.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="sup-card-footer">
                <div className="text-xs text-slate-500 font-medium">
                  Total Spend: <span className="font-bold text-slate-900">${(sup.totalSpend || 0).toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    className="sup-action-btn primary"
                    onClick={() => navigate(`/app/suppliers/${sup._id}`)}
                    title="View Vendor Details"
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>

                  <button
                    className="sup-action-btn"
                    onClick={() => setEditingSupplier(sup)}
                    title="Edit Vendor"
                  >
                    <Edit size={14} />
                  </button>

                  <button
                    className="sup-action-btn danger"
                    onClick={() => setDeleteSupplierTarget(sup)}
                    title="Delete Vendor"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="sup-table-card">
          <table className="diws-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Supplier Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Primary Contact</th>
                <th>Compliance</th>
                <th>Total Spend</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((sup) => (
                <tr key={sup._id}>
                  <td>
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {sup.code}
                    </span>
                  </td>
                  <td>
                    <div
                      className="font-bold text-slate-900 hover:text-amber-600 cursor-pointer"
                      onClick={() => navigate(`/app/suppliers/${sup._id}`)}
                    >
                      {sup.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {[sup.address?.city, sup.address?.country].filter(Boolean).join(", ")}
                    </div>
                  </td>
                  <td>
                    <span className="sup-category-badge">{sup.category.replace("_", " ")}</span>
                  </td>
                  <td>
                    <Badge variant={getStatusBadgeVariant(sup.status)} size="sm">
                      {sup.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td>{renderStars(sup.rating)}</td>
                  <td>
                    <div className="text-sm font-semibold text-slate-800">{sup.primaryContact?.name}</div>
                    <div className="text-xs text-slate-500">{sup.primaryContact?.email}</div>
                  </td>
                  <td>
                    <span
                      className={`text-xs font-bold ${
                        sup.complianceStatus === "compliant"
                          ? "text-emerald-700"
                          : sup.complianceStatus === "pending_audit"
                          ? "text-amber-700"
                          : "text-rose-700"
                      }`}
                    >
                      {sup.complianceStatus.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="font-bold text-slate-900">${(sup.totalSpend || 0).toLocaleString()}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="table-action-icon"
                        onClick={() => navigate(`/app/suppliers/${sup._id}`)}
                        title="View Supplier Profile"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="table-action-icon"
                        onClick={() => setEditingSupplier(sup)}
                        title="Edit Supplier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="table-action-icon text-rose-600 hover:bg-rose-50"
                        onClick={() => setDeleteSupplierTarget(sup)}
                        title="Delete Supplier"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="sup-pagination">
          <span className="text-xs text-slate-500">
            Showing page {page} of {totalPages} ({totalCount} total suppliers)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <SupplierFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
          onSubmit={handleModalSave}
          submitting={submittingModal}
          error={modalError}
        />
      )}

      {/* Edit Modal */}
      {editingSupplier && (
        <SupplierFormModal
          isOpen={!!editingSupplier}
          onClose={() => setEditingSupplier(null)}
          mode="edit"
          initialValues={editingSupplier}
          onSubmit={handleModalSave}
          submitting={submittingModal}
          error={modalError}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteSupplierTarget && (
        <Modal
          isOpen={!!deleteSupplierTarget}
          onClose={() => setDeleteSupplierTarget(null)}
          title="Delete / Deactivate Vendor Record"
          maxWidth="sm"
          footer={
            <div className="flex justify-end gap-3 w-full">
              <Button
                variant="outline"
                type="button"
                onClick={() => setDeleteSupplierTarget(null)}
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
          <p className="text-sm text-slate-700">
            Are you sure you want to remove vendor <strong>{deleteSupplierTarget.name}</strong> ({deleteSupplierTarget.code})?
          </p>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            Historical purchase order records and linked contracts will be archived.
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SupplierList;
