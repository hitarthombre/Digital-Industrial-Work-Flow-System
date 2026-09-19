import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ICustomer, CreditStanding } from "../../types/customer";
import { customerService } from "../../services/customerService";
import { CustomerOrderHistory } from "../../components/customers/CustomerOrderHistory";
import { CustomerDocumentVault } from "../../components/customers/CustomerDocumentVault";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import {
  Building2,
  ArrowLeft,
  Edit,
  CreditCard,
  ShoppingCart,
  FileText,
  Activity,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import "./CustomerPages.css";

export const CustomerDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "documents" | "activity">("overview");

  useEffect(() => {
    if (id) {
      fetchCustomerDetails(id);
    }
  }, [id]);

  const fetchCustomerDetails = async (customerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomerById(customerId);
      setCustomer(data);
    } catch (err: any) {
      setError(err.message || "Failed to load customer profile.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="customer-page-container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading customer profile and credit history...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="customer-page-container">
        <div className="error-banner mb-4">
          <span>{error || "Customer profile not found."}</span>
        </div>
        <Button variant="secondary" onClick={() => navigate("/app/customers")}>
          Back to Directory
        </Button>
      </div>
    );
  }

  const getCreditBadge = (standing: CreditStanding) => {
    switch (standing) {
      case "GOOD":
        return <Badge variant="success">Good Credit Standing</Badge>;
      case "WARNING":
        return <Badge variant="warning">Credit Warning</Badge>;
      case "BLOCKED":
        return <Badge variant="danger">Credit Blocked</Badge>;
      case "ON_HOLD":
        return <Badge variant="secondary">On Hold</Badge>;
      default:
        return <Badge variant="secondary">{standing}</Badge>;
    }
  };

  const usedCreditPercent = Math.min(
    100,
    Math.round((customer.outstandingBalance / (customer.creditLimit || 1)) * 100)
  );

  return (
    <div className="customer-page-container">
      {/* Top Header & Breadcrumb */}
      <div className="customer-page-header">
        <div>
          <button
            type="button"
            onClick={() => navigate("/app/customers")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-2 font-medium"
          >
            <ArrowLeft size={16} />
            Back to Customer Directory
          </button>

          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
              {customer.code}
            </span>
            <h1 className="customer-page-title">{customer.name}</h1>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {customer.segment}
            </span>
            <div>{getCreditBadge(customer.creditStanding)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/app/customers/${customer._id}/edit`)}
            className="gap-1.5"
          >
            <Edit size={16} />
            Edit Customer
          </Button>
        </div>
      </div>

      {/* Credit Utilization Gauge Meter */}
      <div className="credit-meter-container">
        <div className="credit-meter-header">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-slate-600" />
            <span className="font-bold text-slate-900 text-sm">Credit Line Utilization</span>
            <span className="text-xs font-bold text-slate-500">({usedCreditPercent}% Used)</span>
          </div>

          <div className="text-xs font-semibold text-slate-600">
            Available Credit:{" "}
            <span className="text-emerald-600 font-bold">
              ${(customer.availableCredit ?? (customer.creditLimit - customer.outstandingBalance)).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="credit-meter-bar-track h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`credit-meter-bar-fill h-full transition-all duration-500 ${
              usedCreditPercent >= 90
                ? "bg-rose-500"
                : usedCreditPercent >= 75
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${usedCreditPercent}%` }}
          />
        </div>

        <div className="credit-meter-stats">
          <span>
            Outstanding Invoices: <strong>${customer.outstandingBalance.toLocaleString()}</strong>
          </span>
          <span>
            Approved Credit Limit: <strong>${customer.creditLimit.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          type="button"
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          <Building2 size={16} />
          Account Overview
        </button>

        <button
          type="button"
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "orders"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          <ShoppingCart size={16} />
          Order History
        </button>

        <button
          type="button"
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "documents"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("documents")}
        >
          <FileText size={16} />
          Document Vault
        </button>

        <button
          type="button"
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "activity"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("activity")}
        >
          <Activity size={16} />
          Activity Log
        </button>
      </div>

      {/* Tab 1: Account Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Contact & Communication Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Contact Person</span>
                  <span className="text-sm font-bold text-slate-900 block">
                    {customer.contactPerson?.name || "Not specified"}
                  </span>
                  <span className="text-xs text-slate-500 block">{customer.contactPerson?.role || "Primary Contact"}</span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Email Address</span>
                  <a href={`mailto:${customer.email}`} className="text-sm text-blue-600 hover:underline font-medium">
                    {customer.email || "No email listed"}
                  </a>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Phone Number</span>
                  <span className="text-sm text-slate-800 font-medium">{customer.phone || "N/A"}</span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Website URL</span>
                  {customer.website ? (
                    <a href={customer.website} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline font-medium">
                      {customer.website}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-500">N/A</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Addresses & Tax Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">Billing Address</span>
                  {customer.billingAddress?.street ? (
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {customer.billingAddress.street}
                      <br />
                      {customer.billingAddress.city}, {customer.billingAddress.state}{" "}
                      {customer.billingAddress.postalCode}
                      <br />
                      {customer.billingAddress.country}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No billing address on file.</p>
                  )}
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">Shipping Address</span>
                  {customer.shippingAddress?.street ? (
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {customer.shippingAddress.street}
                      <br />
                      {customer.shippingAddress.city}, {customer.shippingAddress.state}{" "}
                      {customer.shippingAddress.postalCode}
                      <br />
                      {customer.shippingAddress.country}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Same as billing address.</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Tax Registration ID</span>
                <span className="text-sm font-mono font-semibold text-slate-900">{customer.taxId || "Not Registered"}</span>
              </div>
            </div>

            {customer.notes && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <h3 className="text-base font-bold text-slate-900">Internal Account Notes</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar Metadata Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Account Metadata
              </h3>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Account Manager</span>
                  <div className="flex items-center gap-2 mt-1">
                    <UserCheck size={16} className="text-blue-600" />
                    <span className="text-sm font-bold text-slate-800">
                      {customer.accountManager?.name || "Unassigned"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Lifetime Sales Volume</span>
                  <span className="text-xl font-extrabold text-slate-900 block mt-0.5">
                    ${customer.lifetimeSales.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Active Open Orders</span>
                  <span className="text-sm font-bold text-slate-800 block mt-0.5">
                    {customer.activeOrdersCount} open orders
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Onboarding Date</span>
                  <span className="text-sm text-slate-600 block mt-0.5">
                    {customer.createdAt
                      ? new Date(customer.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Order History */}
      {activeTab === "orders" && (
        <CustomerOrderHistory customerId={customer._id} customerName={customer.name} />
      )}

      {/* Tab 3: Document Vault */}
      {activeTab === "documents" && <CustomerDocumentVault customerId={customer._id} />}

      {/* Tab 4: Activity Log */}
      {activeTab === "activity" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Customer Relationship Audit Log
          </h3>

          <div className="space-y-4">
            <div className="flex gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">Customer Account Profile Synchronized</span>
                <span className="text-xs text-slate-500">Updated by Sales Representative</span>
              </div>
            </div>

            <div className="flex gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShoppingCart size={16} />
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">Purchase Order Received (#ORD-2026-8801)</span>
                <span className="text-xs text-slate-500">Totaling $145,000 for high-pressure turbine casings</span>
              </div>
            </div>

            <div className="flex gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">Master Supply Agreement Uploaded</span>
                <span className="text-xs text-slate-500">Attached to document vault with 3-year term</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetails;
