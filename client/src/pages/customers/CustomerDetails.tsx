import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ICustomer, CustomerStatus } from "../../types/customer";
import { customerService } from "../../services/customerService";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import CustomerOrderHistory from "../../components/customers/CustomerOrderHistory";
import CustomerDocumentVault from "../../components/customers/CustomerDocumentVault";
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  MapPin,
  CreditCard,
  Building2,
  ShieldCheck,
  FileText,
  ShoppingCart,
} from "lucide-react";
import "./CustomerPages.css";

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "documents">("overview");

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getCustomerById(id!);
      if (res.data) {
        setCustomer(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    if (!window.confirm(`Deactivate customer account "${customer.name}"?`)) return;

    try {
      await customerService.deleteCustomer(customer._id);
      navigate("/app/customers");
    } catch (err: any) {
      alert("Failed to delete account: " + err.message);
    }
  };

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active Account</Badge>;
      case "vip":
        return <Badge variant="active">★ VIP Client</Badge>;
      case "on_hold":
        return <Badge variant="warning">On Credit Hold</Badge>;
      case "lead":
        return <Badge variant="primary">Lead / Prospect</Badge>;
      case "inactive":
        return <Badge variant="neutral">Inactive Account</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

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
      default:
        return <span className="diws-chip chip-info">Active Credit</span>;
    }
  };

  if (loading) {
    return (
      <div className="customer-page-container">
        <div className="loading-state" style={{ textAlign: "center", padding: "4rem" }}>
          <div className="spinner"></div>
          <p>Retrieving customer account details...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="customer-page-container">
        <button
          onClick={() => navigate("/app/customers")}
          className="btn-link-back flex items-center text-slate-500 hover:text-slate-800 mb-4 font-medium text-sm"
          style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Customer Directory
        </button>
        <div className="form-error-alert">{error || "Customer account not found."}</div>
      </div>
    );
  }

  const limit = customer.creditStanding?.limit || 50000;
  const used = customer.creditStanding?.usedCredit || 0;
  const available = customer.creditStanding?.availableCredit ?? Math.max(limit - used, 0);

  return (
    <div className="customer-page-container">
      {/* Back Button & Top Banner */}
      <button
        onClick={() => navigate("/app/customers")}
        className="btn-link-back flex items-center text-slate-500 hover:text-slate-800 mb-3 font-medium text-sm"
        style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}
      >
        <ArrowLeft size={16} className="mr-1" /> Back to Customer Directory
      </button>

      <div className="details-header-card">
        <div className="details-main-info">
          <div className="details-title-group">
            <div className="details-sub-row">
              <span className="card-code">{customer.code}</span>
              {getStatusBadge(customer.status)}
              {getCreditBadge(customer.creditStanding?.status)}
              <span className="text-xs font-semibold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {customer.customerType}
              </span>
            </div>
            <h2 className="mt-1">{customer.name}</h2>
          </div>

          <div className="details-actions">
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/customers/${customer._id}/edit`)}
              icon={<Edit size={16} />}
            >
              Edit Account
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              icon={<Trash2 size={16} />}
            >
              Deactivate
            </Button>
          </div>
        </div>

        {/* Stats Summary Banner */}
        <div className="details-stats-banner">
          <div className="banner-item">
            <span className="label">Credit Facility Limit</span>
            <span className="value text-blue-600">${limit.toLocaleString()}</span>
          </div>
          <div className="banner-item">
            <span className="label">Used Credit Balance</span>
            <span className="value text-amber-600">${used.toLocaleString()}</span>
          </div>
          <div className="banner-item">
            <span className="label">Available Credit Line</span>
            <span className="value text-emerald-600">${available.toLocaleString()}</span>
          </div>
          <div className="banner-item">
            <span className="label">Lifetime Revenue</span>
            <span className="value text-slate-900">
              ${(customer.totalRevenue || 0).toLocaleString()}
            </span>
          </div>
          <div className="banner-item">
            <span className="label">Payment Terms</span>
            <span className="value text-slate-900">{customer.creditStanding?.paymentTerms || "Net 30"}</span>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="details-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Building2 size={16} /> Account Overview
        </button>

        <button
          className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <ShoppingCart size={16} /> Order History ({customer.orders?.length || customer.totalOrdersCount || 0})
        </button>

        <button
          className={`tab-btn ${activeTab === "documents" ? "active" : ""}`}
          onClick={() => setActiveTab("documents")}
        >
          <FileText size={16} /> Document Vault ({customer.documents?.length || 0})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="overview-grid">
          {/* Card 1: Primary Contact */}
          <div className="info-card">
            <div className="info-card-header">
              <User size={18} className="text-primary" />
              <h3>Primary Contact Information</h3>
            </div>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Contact Name</span>
                <span className="info-val">{customer.primaryContact.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email Address</span>
                <span className="info-val text-primary">{customer.primaryContact.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone Number</span>
                <span className="info-val">{customer.primaryContact.phone || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Role / Position</span>
                <span className="info-val">{customer.primaryContact.role || "Primary Contact"}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Billing & Shipping Address */}
          <div className="info-card">
            <div className="info-card-header">
              <MapPin size={18} className="text-primary" />
              <h3>Billing & Shipping Address</h3>
            </div>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Billing Street</span>
                <span className="info-val">{customer.billingAddress.street || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">City, State</span>
                <span className="info-val">
                  {customer.billingAddress.city
                    ? `${customer.billingAddress.city}, ${customer.billingAddress.state || ""}`
                    : "N/A"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Country & Zip</span>
                <span className="info-val">
                  {customer.billingAddress.country || "USA"}{" "}
                  {customer.billingAddress.postalCode ? `(${customer.billingAddress.postalCode})` : ""}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Shipping Destination</span>
                <span className="info-val">
                  {customer.shippingAddress?.street
                    ? `${customer.shippingAddress.street}, ${customer.shippingAddress.city}`
                    : "Same as Billing Address"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Credit Standing & Financial Details */}
          <div className="info-card">
            <div className="info-card-header">
              <CreditCard size={18} className="text-primary" />
              <h3>Credit Standing & Financial Risk</h3>
            </div>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Credit Status Rating</span>
                <span className="info-val">{getCreditBadge(customer.creditStanding?.status)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Financial Credit Score</span>
                <span className="info-val">{customer.creditStanding?.score || 85} / 100</span>
              </div>
              <div className="info-item">
                <span className="info-label">Approved Payment Terms</span>
                <span className="info-val">{customer.creditStanding?.paymentTerms || "Net 30"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Tax ID / VAT Registration</span>
                <span className="info-val">{customer.taxId || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Account Manager & Tags */}
          <div className="info-card">
            <div className="info-card-header">
              <ShieldCheck size={18} className="text-primary" />
              <h3>Account Relationship</h3>
            </div>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Assigned Sales Rep</span>
                <span className="info-val">
                  {customer.accountManager?.name || "Unassigned"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Account Created Date</span>
                <span className="info-val">
                  {customer.createdAt
                    ? new Date(customer.createdAt).toLocaleDateString()
                    : "2026-01-01"}
                </span>
              </div>
              {customer.tags && customer.tags.length > 0 && (
                <div className="info-item" style={{ flexDirection: "column", gap: "0.35rem" }}>
                  <span className="info-label">Tags & Categorization</span>
                  <div className="card-tags">
                    {customer.tags.map((t, i) => (
                      <span key={i} className="card-tag">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {customer.notes && (
                <div className="info-item" style={{ flexDirection: "column", gap: "0.25rem" }}>
                  <span className="info-label">Internal Account Notes</span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDER HISTORY */}
      {activeTab === "orders" && <CustomerOrderHistory customerId={customer._id} />}

      {/* TAB 3: DOCUMENT VAULT */}
      {activeTab === "documents" && (
        <CustomerDocumentVault
          customerId={customer._id}
          documents={customer.documents}
          onDocumentChange={fetchCustomer}
        />
      )}
    </div>
  );
};

export default CustomerDetails;
