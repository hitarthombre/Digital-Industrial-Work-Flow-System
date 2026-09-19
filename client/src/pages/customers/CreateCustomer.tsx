import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CreateCustomerInput, CustomerSegment, CustomerStatus, CreditStanding } from "../../types/customer";
import { customerService } from "../../services/customerService";
import { Button } from "../../components/Button";
import { ArrowLeft, Save, Building2, User, MapPin, CreditCard } from "lucide-react";
import "./CustomerPages.css";

export const CreateCustomer: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: "",
    code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
    segment: "SMB",
    status: "ACTIVE",
    creditStanding: "GOOD",
    contactPerson: {
      name: "",
      email: "",
      phone: "",
      role: "",
    },
    email: "",
    phone: "",
    website: "",
    billingAddress: {
      street: "",
      city: "",
      state: "",
      country: "USA",
      postalCode: "",
    },
    shippingAddress: {
      street: "",
      city: "",
      state: "",
      country: "USA",
      postalCode: "",
    },
    taxId: "",
    creditLimit: 25000,
    notes: "",
  });

  const [copyBillingToShipping, setCopyBillingToShipping] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setError("Customer Name and Customer Code are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...formData };
      if (copyBillingToShipping && formData.billingAddress) {
        payload.shippingAddress = { ...formData.billingAddress };
      }

      const created = await customerService.createCustomer(payload);
      navigate(`/app/customers/${created._id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create customer record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="customer-page-container">
      {/* Top Header */}
      <div className="customer-page-header">
        <div>
          <button
            type="button"
            onClick={() => navigate("/app/customers")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-2 font-medium"
          >
            <ArrowLeft size={16} />
            Back to Directory
          </button>
          <h1 className="customer-page-title">Create New Customer Account</h1>
          <p className="customer-page-subtitle">Register a new client profile, credit terms, and billing details</p>
        </div>
      </div>

      {error && (
        <div className="error-banner mb-4">
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic & Classification Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold">
            <Building2 size={18} className="text-blue-600" />
            <span>Company & Profile Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Customer Company Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Apex Industrial Solutions"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Customer Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. CUST-1008"
                className="form-input font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="form-label">Customer Tier / Segment *</label>
              <select
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value as CustomerSegment })}
                className="form-input"
              >
                <option value="ENTERPRISE">Enterprise</option>
                <option value="SMB">SMB (Small/Medium Business)</option>
                <option value="VIP">VIP Account</option>
                <option value="RETAIL">Retail Customer</option>
              </select>
            </div>

            <div>
              <label className="form-label">Account Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                className="form-input"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="LEAD">Prospect / Lead</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Contact Person */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold">
            <User size={18} className="text-blue-600" />
            <span>Primary Contact Person</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Contact Full Name</label>
              <input
                type="text"
                value={formData.contactPerson?.name || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactPerson: { ...formData.contactPerson, name: e.target.value },
                  })
                }
                placeholder="e.g. Sarah Jenkins"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Contact Role / Designation</label>
              <input
                type="text"
                value={formData.contactPerson?.role || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactPerson: { ...formData.contactPerson, role: e.target.value },
                  })
                }
                placeholder="e.g. Procurement Lead"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. orders@company.com"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +1 (555) 000-0000"
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Billing Address */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold">
            <MapPin size={18} className="text-blue-600" />
            <span>Billing & Shipping Address</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Street Address</label>
              <input
                type="text"
                value={formData.billingAddress?.street || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, street: e.target.value },
                  })
                }
                placeholder="100 Industrial Parkway, Suite 400"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">City</label>
              <input
                type="text"
                value={formData.billingAddress?.city || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, city: e.target.value },
                  })
                }
                placeholder="Chicago"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">State / Province</label>
              <input
                type="text"
                value={formData.billingAddress?.state || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, state: e.target.value },
                  })
                }
                placeholder="IL"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Country</label>
              <input
                type="text"
                value={formData.billingAddress?.country || "USA"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, country: e.target.value },
                  })
                }
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Postal Code</label>
              <input
                type="text"
                value={formData.billingAddress?.postalCode || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, postalCode: e.target.value },
                  })
                }
                placeholder="60601"
                className="form-input"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={copyBillingToShipping}
                onChange={(e) => setCopyBillingToShipping(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Use Billing Address for Shipping Address</span>
            </label>
          </div>
        </div>

        {/* Section 4: Credit Standing & Tax */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold">
            <CreditCard size={18} className="text-blue-600" />
            <span>Financial & Credit Standing</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Tax Registration ID</label>
              <input
                type="text"
                value={formData.taxId || ""}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="US99-8473620"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Approved Credit Limit ($) *</label>
              <input
                type="number"
                value={formData.creditLimit || 0}
                onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                placeholder="25000"
                className="form-input"
                min={0}
                required
              />
            </div>

            <div>
              <label className="form-label">Initial Credit Standing *</label>
              <select
                value={formData.creditStanding}
                onChange={(e) => setFormData({ ...formData, creditStanding: e.target.value as CreditStanding })}
                className="form-input"
              >
                <option value="GOOD">Good Standing</option>
                <option value="WARNING">Warning / Under Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Account Notes / Credit Terms</label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add payment terms (e.g. Net 30), discount agreements, or special delivery notes..."
              className="form-input"
              rows={3}
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate("/app/customers")}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting} className="gap-2">
            <Save size={18} />
            {submitting ? "Saving Customer..." : "Save Customer Account"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateCustomer;
