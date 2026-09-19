import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ICustomer, CustomerSegment, CustomerStatus, CreditStanding } from "../../types/customer";
import { customerService } from "../../services/customerService";
import { Button } from "../../components/Button";
import { ArrowLeft, Save, Building2, User, MapPin, CreditCard } from "lucide-react";
import "./CustomerPages.css";

export const EditCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ICustomer>>({});

  useEffect(() => {
    if (id) {
      loadCustomer(id);
    }
  }, [id]);

  const loadCustomer = async (customerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const cust = await customerService.getCustomerById(customerId);
      setFormData(cust);
    } catch (err: any) {
      setError(err.message || "Failed to load customer details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData.name?.trim()) {
      setError("Customer name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await customerService.updateCustomer(id, formData);
      navigate(`/app/customers/${id}`);
    } catch (err: any) {
      setError(err.message || "Failed to update customer account.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="customer-page-container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading customer profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-page-container">
      {/* Top Header */}
      <div className="customer-page-header">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/app/customers/${id}`)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-2 font-medium"
          >
            <ArrowLeft size={16} />
            Back to Customer Details
          </button>
          <h1 className="customer-page-title">Edit Customer Profile</h1>
          <p className="customer-page-subtitle">Update company records, contact info, and credit standing</p>
        </div>
      </div>

      {error && (
        <div className="error-banner mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Profile */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold">
            <Building2 size={18} className="text-blue-600" />
            <span>Company Profile</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Customer Company Name *</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Customer Code *</label>
              <input
                type="text"
                value={formData.code || ""}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="form-input font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="form-label">Customer Tier / Segment</label>
              <select
                value={formData.segment || "SMB"}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value as CustomerSegment })}
                className="form-input"
              >
                <option value="ENTERPRISE">Enterprise</option>
                <option value="SMB">SMB</option>
                <option value="VIP">VIP Account</option>
                <option value="RETAIL">Retail Customer</option>
              </select>
            </div>

            <div>
              <label className="form-label">Account Status</label>
              <select
                value={formData.status || "ACTIVE"}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                className="form-input"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="LEAD">Lead / Prospect</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Contact */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold">
            <User size={18} className="text-blue-600" />
            <span>Contact Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Contact Person Name</label>
              <input
                type="text"
                value={formData.contactPerson?.name || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactPerson: { ...formData.contactPerson, name: e.target.value },
                  })
                }
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Contact Role</label>
              <input
                type="text"
                value={formData.contactPerson?.role || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactPerson: { ...formData.contactPerson, role: e.target.value },
                  })
                }
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Phone</label>
              <input
                type="text"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">State</label>
              <input
                type="text"
                value={formData.billingAddress?.state || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, state: e.target.value },
                  })
                }
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Country</label>
              <input
                type="text"
                value={formData.billingAddress?.country || ""}
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
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Credit & Financials */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold">
            <CreditCard size={18} className="text-blue-600" />
            <span>Credit Limit & Standing</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Tax ID</label>
              <input
                type="text"
                value={formData.taxId || ""}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Credit Limit ($)</label>
              <input
                type="number"
                value={formData.creditLimit || 0}
                onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                className="form-input"
                min={0}
              />
            </div>

            <div>
              <label className="form-label">Credit Standing</label>
              <select
                value={formData.creditStanding || "GOOD"}
                onChange={(e) => setFormData({ ...formData, creditStanding: e.target.value as CreditStanding })}
                className="form-input"
              >
                <option value="GOOD">Good Standing</option>
                <option value="WARNING">Warning</option>
                <option value="BLOCKED">Blocked</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Internal Account Notes</label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-input"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(`/app/customers/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting} className="gap-2">
            <Save size={18} />
            {submitting ? "Saving Changes..." : "Save Profile Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditCustomer;
