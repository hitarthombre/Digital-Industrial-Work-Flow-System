import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ICustomer, CreditStanding, CustomerStatus } from "../../types/customer";
import { customerService } from "../../services/customerService";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import {
  Users,
  Building2,
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import "./CustomerPages.css";

export const CustomerList: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [segmentFilter, setSegmentFilter] = useState<string>("ALL");
  const [creditFilter, setCreditFilter] = useState<string>("ALL");

  // Pagination
  const [page, setPage] = useState(1);

  // Summary Metrics
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalLifetimeSales: 0,
    blockedCreditCount: 0,
  });

  // Delete modal state
  const [deleteCustomerModal, setDeleteCustomerModal] = useState<ICustomer | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page, statusFilter, segmentFilter, creditFilter]);

  const fetchCustomers = async (searchQuery = search) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerService.getCustomers({
        page,
        limit: 12,
        search: searchQuery,
        status: statusFilter,
        segment: segmentFilter,
        creditStanding: creditFilter,
      });

      if (response && response.data) {
        setCustomers(response.data);
        if (response.metrics) {
          setMetrics(response.metrics);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load customer directory.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers(search);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCustomerModal) return;
    setDeleting(true);
    try {
      await customerService.deleteCustomer(deleteCustomerModal._id);
      setCustomers((prev) => prev.filter((c) => c._id !== deleteCustomerModal._id));
      setDeleteCustomerModal(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete customer record.");
    } finally {
      setDeleting(false);
    }
  };

  const getCreditBadge = (standing: CreditStanding) => {
    switch (standing) {
      case "GOOD":
        return <Badge variant="success">Good Credit</Badge>;
      case "WARNING":
        return <Badge variant="warning">Credit Warning</Badge>;
      case "BLOCKED":
        return <Badge variant="danger">Credit Blocked</Badge>;
      case "ON_HOLD":
        return <Badge variant="secondary">Credit On Hold</Badge>;
      default:
        return <Badge variant="secondary">{standing}</Badge>;
    }
  };

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>;
      case "INACTIVE":
        return <Badge variant="secondary">Inactive</Badge>;
      case "LEAD":
        return <Badge variant="primary">Lead</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="customer-page-container">
      {/* Page Header */}
      <div className="customer-page-header">
        <div>
          <h1 className="customer-page-title">
            <Users className="inline-block mr-2.5 text-blue-600" size={28} />
            Customer Directory
          </h1>
          <p className="customer-page-subtitle">
            Manage client accounts, monitor credit utilization, and review sales order history
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate("/app/customers/new")}
          className="gap-2 shrink-0"
        >
          <Plus size={18} />
          Add Customer
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="customer-summary-kpis">
        <div className="kpi-card">
          <div className="kpi-icon-box bg-blue-50 text-blue-600">
            <Building2 size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-title">Total Accounts</span>
            <span className="kpi-val">{metrics.totalCustomers || customers.length}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box bg-emerald-50 text-emerald-600">
            <Users size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-title">Active Clients</span>
            <span className="kpi-val">{metrics.activeCustomers || customers.filter(c => c.status === 'ACTIVE').length}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box bg-purple-50 text-purple-600">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-title">Portfolio Lifetime Sales</span>
            <span className="kpi-val">${(metrics.totalLifetimeSales || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box bg-rose-50 text-rose-600">
            <ShieldAlert size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-title">Credit Block Alerts</span>
            <span className="kpi-val">{metrics.blockedCreditCount || customers.filter(c => c.creditStanding === 'BLOCKED').length}</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="customer-control-bar">
        <form onSubmit={handleSearchSubmit} className="cust-search-form">
          <Search size={18} className="cust-search-icon" />
          <input
            type="text"
            placeholder="Search by customer name, code, email, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cust-search-input"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                fetchCustomers("");
              }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </form>

        <div className="cust-filters-group">
          {/* Segment Filter */}
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="cust-select-filter"
          >
            <option value="ALL">All Segments</option>
            <option value="ENTERPRISE">Enterprise</option>
            <option value="SMB">SMB</option>
            <option value="VIP">VIP</option>
            <option value="RETAIL">Retail</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cust-select-filter"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LEAD">Lead</option>
          </select>

          {/* Credit Filter */}
          <select
            value={creditFilter}
            onChange={(e) => setCreditFilter(e.target.value)}
            className="cust-select-filter"
          >
            <option value="ALL">All Credit Standing</option>
            <option value="GOOD">Good Credit</option>
            <option value="WARNING">Credit Warning</option>
            <option value="BLOCKED">Credit Blocked</option>
            <option value="ON_HOLD">On Hold</option>
          </select>

          {/* Grid / Table Toggle */}
          <div className="cust-view-toggle">
            <button
              type="button"
              className={`cust-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              type="button"
              className={`cust-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading customer accounts...</p>
        </div>
      ) : error ? (
        <div className="error-banner">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => fetchCustomers()} className="ml-auto">
            Retry
          </Button>
        </div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <Building2 size={48} className="empty-icon" />
          <h4>No Customers Found</h4>
          <p>No customer records matched your query or filter parameters.</p>
          <Button variant="primary" onClick={() => navigate("/app/customers/new")} className="mt-4 gap-2">
            <Plus size={16} />
            Add First Customer
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="cust-grid">
          {customers.map((cust) => (
            <div key={cust._id} className="cust-card">
              <div>
                <div className="cust-card-top">
                  <span className="cust-code">{cust.code}</span>
                  <div className="flex gap-1.5">{getCreditBadge(cust.creditStanding)}</div>
                </div>

                <h3 className="cust-name">{cust.name}</h3>
                <div className="cust-segment-tag uppercase tracking-wider">{cust.segment} TIER</div>

                <div className="cust-details-list">
                  {cust.contactPerson?.name && (
                    <div className="cust-detail-item">
                      <Users size={14} className="text-slate-400 shrink-0" />
                      <span>{cust.contactPerson.name} ({cust.contactPerson.role || "Contact"})</span>
                    </div>
                  )}
                  {cust.email && (
                    <div className="cust-detail-item">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}
                  {cust.phone && (
                    <div className="cust-detail-item">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span>{cust.phone}</span>
                    </div>
                  )}
                  {cust.billingAddress?.city && (
                    <div className="cust-detail-item">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span>
                        {cust.billingAddress.city}, {cust.billingAddress.country || "USA"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Credit Limit: <strong>${cust.creditLimit.toLocaleString()}</strong></span>
                    <span>Bal: <strong>${cust.outstandingBalance.toLocaleString()}</strong></span>
                  </div>
                  <div className="credit-meter-bar-track h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`credit-meter-bar-fill h-full ${
                        cust.creditStanding === "BLOCKED"
                          ? "bg-rose-500"
                          : cust.creditStanding === "WARNING"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(5, (cust.outstandingBalance / (cust.creditLimit || 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="cust-card-footer mt-4">
                <div>{getStatusBadge(cust.status)}</div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/app/customers/${cust._id}`)}
                    title="View Account Overview"
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/app/customers/${cust._id}/edit`)}
                    title="Edit Customer"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteCustomerModal(cust)}
                    title="Delete Record"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="cust-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer Name</th>
                <th>Segment</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Credit Standing</th>
                <th>Outstanding / Limit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((cust) => (
                <tr key={cust._id}>
                  <td className="font-mono text-xs font-bold text-slate-700">{cust.code}</td>
                  <td className="font-semibold text-slate-900">{cust.name}</td>
                  <td>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {cust.segment}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm font-medium text-slate-800">
                      {cust.contactPerson?.name || cust.email || "N/A"}
                    </div>
                    {cust.phone && <div className="text-xs text-slate-500">{cust.phone}</div>}
                  </td>
                  <td>{getStatusBadge(cust.status)}</td>
                  <td>{getCreditBadge(cust.creditStanding)}</td>
                  <td className="font-medium text-slate-800">
                    ${cust.outstandingBalance.toLocaleString()} / ${cust.creditLimit.toLocaleString()}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/app/customers/${cust._id}`)}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/app/customers/${cust._id}/edit`)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteCustomerModal(cust)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCustomerModal && (
        <Modal
          isOpen={!!deleteCustomerModal}
          onClose={() => setDeleteCustomerModal(null)}
          title="Confirm Delete Customer Account"
          maxWidth="sm"
        >
          <div className="p-2 text-slate-700">
            <p className="mb-2">
              Are you sure you want to delete <strong>{deleteCustomerModal.name}</strong> (
              {deleteCustomerModal.code})?
            </p>
            <p className="text-xs text-slate-500">
              This action will mark the account as deleted in the directory.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteCustomerModal(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerList;
