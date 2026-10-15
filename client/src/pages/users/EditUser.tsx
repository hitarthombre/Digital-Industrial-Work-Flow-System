import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import type { IUser } from "../../types/user";
import { Button } from "../../components/Button";
import {
  Edit,
  ArrowLeft,
  Phone,
  Shield,
  Building,
  User,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import "./UserPages.css";

export const EditUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    role: "Employee",
    departmentId: "",
    email: "",
  });

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{
        success: boolean;
        data: IUser;
      }>(`/users/${id}`);

      if (response.data) {
        const u = response.data;
        setFormData({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          phone: u.phone || "",
          role: u.role || "Employee",
          departmentId: typeof u.departmentId === "string" ? u.departmentId : u.departmentId?._id || "",
          email: u.email || "",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load user profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      // Allow only digits and limit to 10 numbers
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        phone: digitsOnly,
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    if (formData.phone && formData.phone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.put(`/users/${id}`, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        departmentId: formData.departmentId.trim() || undefined,
      });

      navigate(`/app/users/${id}`);
    } catch (err: any) {
      setError(err.message || "Failed to update user profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="user-page-container flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="animate-spin text-amber-600 mb-3" size={36} />
        <p className="text-slate-600 font-medium text-sm">Loading user account for editing...</p>
      </div>
    );
  }

  return (
    <div className="user-page-container">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(`/app/users/${id}`)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-amber-700 mb-2 cursor-pointer transition"
          >
            <ArrowLeft size={14} /> Cancel & Return to Details
          </button>
          <h1 className="user-page-title">
            <Edit className="text-amber-600 inline mr-2" size={28} />
            Edit User Profile
          </h1>
          <p className="user-page-subtitle">
            Update account information, contact phone, assigned role, and department scope.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="user-form-card">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2 mb-6">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Identity */}
          <div className="user-form-section">
            <div className="user-section-header">
              <User size={15} className="user-section-icon" />
              <span>Identity Information</span>
            </div>

            <div className="user-form-grid">
              <div className="user-form-group">
                <label className="user-form-label required">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="user-form-input"
                />
              </div>

              <div className="user-form-group">
                <label className="user-form-label required">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="user-form-input"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="user-form-section">
            <div className="user-section-header">
              <Phone size={15} className="user-section-icon" />
              <span>Contact Details</span>
            </div>

            <div className="user-form-grid">
              <div className="user-form-group">
                <label className="user-form-label">Email Address (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="user-form-input"
                />
              </div>

              <div className="user-form-group">
                <label className="user-form-label">Phone Number</label>
                <div className="user-input-wrapper">
                  <span className="user-input-icon">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    className="user-form-input has-icon"
                  />
                </div>
                {formData.phone && formData.phone.length < 10 && (
                  <p className="user-helper-text" style={{ color: "#d97706" }}>
                    {10 - formData.phone.length} more digit{10 - formData.phone.length > 1 ? "s" : ""} required (10 digits total)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Role & Department */}
          <div className="user-form-section">
            <div className="user-section-header">
              <Shield size={15} className="user-section-icon" />
              <span>Role & Access Level</span>
            </div>

            <div className="user-form-grid">
              <div className="user-form-group">
                <label className="user-form-label required">Assigned Role</label>
                <div className="user-input-wrapper">
                  <span className="user-input-icon">
                    <Shield size={16} />
                  </span>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="user-form-select has-icon"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Operator">Operator</option>
                    <option value="Employee">Employee</option>
                  </select>
                </div>
              </div>

              <div className="user-form-group">
                <label className="user-form-label">Department ID / Code</label>
                <div className="user-input-wrapper">
                  <span className="user-input-icon">
                    <Building size={16} />
                  </span>
                  <input
                    type="text"
                    name="departmentId"
                    placeholder="e.g. DEPT-PLANT-01"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className="user-form-input has-icon"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="user-form-footer">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate(`/app/users/${id}`)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="copper"
              type="submit"
              loading={submitting}
              icon={<CheckCircle2 size={16} />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
