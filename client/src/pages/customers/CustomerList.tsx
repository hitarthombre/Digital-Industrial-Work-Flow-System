import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ICustomer, CustomerStatus } from "../../types/customer";
import { customerService } from "../../services/customerService";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import {
  Users,
  Plus,
  Search,
  Grid,
  List as ListIcon,
  Building2,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import "./CustomerPages.css";

export const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and View mode
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getCustomers();
      if (res.data) {
        setCustomers(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load customers list");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate customer account "${name}"?`)) {
      return;
    }

    try {
      await customerService.deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c._id !== id));
    } catch (err: any) {
      alert("Failed to delete customer: " + err.message);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "vip":
        return <Badge variant="active">★ VIP Client</Badge>;
      case "on_hold":
        return <Badge variant="warning">On Hold</Badge>;
      case "lead":
        return <Badge variant="primary">Lead / Prospect</Badge>;
      case "inactive":
        return <Badge variant="neutral">Inactive</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Credit Status Badge Helper
  const getCreditBadge = (status?: string) => {
    switch (status) {
      case "excellent":
        return <span className="diws-chip chip-success">Credit: Excellent</span>;
      case "good":
        return <span className="diws-chip chip-info">Credit: Good</span>;
      case "warning":
        return <span className="diws-chip chip-warning">Credit: Warning</span>;
      case "credit_hold":
        return <span className="diws-chip chip-danger">Credit Hold</span>;
      case "suspended":
        return <span className="diws-chip chip-danger">Suspended</span>;
      default:
        return <span className="diws-chip chip-info">Credit Standing</span>;
    }
  };

  // Filtered List
  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.primaryContact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.primaryContact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || cust.status === statusFilter;
    const matchesType = typeFilter === "ALL" || cust.customerType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // KPI Metrics Calculation
  const totalAccounts = customers.length;
  const activeAccounts = customers.filter((c) => c.status === "active" || c.status === "vip").length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
  const totalCreditIssued = customers.reduce((sum, c) => sum + (c.creditStanding?.limit || 0), 0);

  return (
    <div className="customer-page-container">
      {/* Page Title & Header */}
      <div className="customer-page-header">
        <div className="customer-page-title">
          <h1>Customer Directory & Accounts</h1>
          <p>Manage client relationships, billing addresses, credit limits, and order histories.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate("/app/customers/new")}
          icon={<Plus size={18} />}
        >
          Add New Customer
        </Button>
      </div>

      {/* KPI Metrics Banner */}
      <div className="customer-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box bg-blue-100 text-blue-600">
            <Users size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{totalAccounts}</span>
            <span className="metric-label">Total Registered Accounts</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-emerald-100 text-emerald-600">
            <UserCheck size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{activeAccounts}</span>
            <span className="metric-label">Active Client Accounts</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-purple-100 text-purple-600">
            <TrendingUp size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-value">${totalRevenue.toLocaleString()}</span>
            <span className="metric-label">Cumulative Sales Value</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-amber-100 text-amber-600">
            <CreditCard size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-value">${totalCreditIssued.toLocaleString()}</span>
            <span className="metric-label">Total Credit Facility</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Search Controls */}
      <div className="customer-toolbar">
        <div className="toolbar-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by company name, code, contact person, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="active">Active</option>
            <option value="vip">★ VIP Client</option>
            <option value="on_hold">On Hold</option>
            <option value="lead">Lead / Prospect</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Account Types</option>
            <option value="corporate">Corporate</option>
            <option value="enterprise">Enterprise</option>
            <option value="government">Government</option>
            <option value="distributor">Distributor</option>
            <option value="individual">Individual</option>
          </select>

          <div className="view-toggle-btns">
            <button
              className={`view-toggle-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Cards View"
            >
              <Grid size={16} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <ListIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering: Loading / Error / Empty / Cards / Table */}
      {loading ? (
        <div className="loading-state" style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner"></div>
          <p>Loading customer directory...</p>
        </div>
      ) : error ? (
        <div className="form-error-alert">{error}</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="empty-orders-state">
          <Building2 size={48} className="empty-icon" />
          <h4>No Customers Found</h4>
          <p>No customer records matched your query or filter criteria.</p>
          <Button
            variant="secondary"
            onClick={() => navigate("/app/customers/new")}
            icon={<Plus size={16} />}
            style={{ marginTop: "12px" }}
          >
            Add New Customer
          </Button>
        </div>
      ) : viewMode === "cards" ? (
        <div className="customer-cards-grid">
          {filteredCustomers.map((cust) => {
            const limit = cust.creditStanding?.limit || 50000;
            const used = cust.creditStanding?.usedCredit || 0;
            const percentage = Math.min(Math.round((used / limit) * 100), 100);

            return (
              <div key={cust._id} className="customer-card">
                <div className="card-top">
                  <div className="card-title">
                    <span className="card-code">{cust.code}</span>
                    <h3>{cust.name}</h3>
                  </div>
                  {getStatusBadge(cust.status)}
                </div>

                <div className="card-contact">
                  <div className="contact-row">
                    <Users size={14} className="text-muted" />
                    <span className="font-medium">{cust.primaryContact.name}</span>
                    {cust.primaryContact.role && (
                      <span className="text-muted">({cust.primaryContact.role})</span>
                    )}
                  </div>
                  <div className="contact-row">
                    <Mail size={14} className="text-muted" />
                    <span>{cust.primaryContact.email}</span>
                  </div>
                  {cust.primaryContact.phone && (
                    <div className="contact-row">
                      <Phone size={14} className="text-muted" />
                      <span>{cust.primaryContact.phone}</span>
                    </div>
                  )}
                </div>

                {/* Credit Standing Progress Bar */}
                <div className="credit-bar-section">
                  <div className="credit-bar-header">
                    <span>Credit Utilization ({percentage}%)</span>
                    <span>
                      ${used.toLocaleString()} / ${limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="credit-bar-track">
                    <div
                      className="credit-bar-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor:
                          percentage > 85 ? "#ef4444" : percentage > 60 ? "#f59e0b" : "#10b981",
                      }}
                    ></div>
                  </div>
                </div>

                {/* Tags */}
                {cust.tags && cust.tags.length > 0 && (
                  <div className="card-tags">
                    {cust.tags.map((tag, idx) => (
                      <span key={idx} className="card-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="card-footer-actions">
                  {getCreditBadge(cust.creditStanding?.status)}
                  <div className="inline-flex gap-2">
                    <button
                      className="btn-icon-secondary"
                      title="View Customer Overview"
                      onClick={() => navigate(`/app/customers/${cust._id}`)}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className="btn-icon-secondary"
                      title="Edit Account Details"
                      onClick={() => navigate(`/app/customers/${cust._id}/edit`)}
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      className="btn-icon-danger"
                      title="Delete Customer Account"
                      onClick={() => handleDelete(cust._id, cust.name)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View Mode */
        <div className="table-responsive bg-white rounded-xl border border-slate-200">
          <table className="diws-data-table">
            <thead>
              <tr>
                <th>Customer Code & Name</th>
                <th>Type</th>
                <th>Primary Contact</th>
                <th>Credit Limit</th>
                <th>Credit Standing</th>
                <th>Account Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust) => (
                <tr key={cust._id}>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{cust.name}</span>
                      <span className="text-xs text-slate-500 font-mono">{cust.code}</span>
                    </div>
                  </td>
                  <td className="capitalize text-slate-700">{cust.customerType}</td>
                  <td>
                    <div className="flex flex-col text-xs">
                      <span className="font-medium text-slate-900">{cust.primaryContact.name}</span>
                      <span className="text-slate-500">{cust.primaryContact.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-semibold text-slate-900">
                      ${(cust.creditStanding?.limit || 0).toLocaleString()}
                    </span>
                  </td>
                  <td>{getCreditBadge(cust.creditStanding?.status)}</td>
                  <td>{getStatusBadge(cust.status)}</td>
                  <td style={{ textAlign: "right" }}>
                    <div className="inline-flex gap-2 justify-end">
                      <button
                        className="btn-icon-secondary"
                        onClick={() => navigate(`/app/customers/${cust._id}`)}
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="btn-icon-secondary"
                        onClick={() => navigate(`/app/customers/${cust._id}/edit`)}
                        title="Edit Account"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        className="btn-icon-danger"
                        onClick={() => handleDelete(cust._id, cust.name)}
                        title="Delete Account"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
