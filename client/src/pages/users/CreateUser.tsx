import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { Button } from "../../components/Button";
import {
  UserPlus,
  ArrowLeft,
  Mail,
  Lock,
  Phone,
  Shield,
  Building,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import "./UserPages.css";

export const CreateUser: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "Employee",
    departmentId: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setError("First name, last name, and email address are required.");
      return;
    }

    if (formData.phone && formData.phone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        departmentId: formData.departmentId.trim() || undefined,
      };

      await api.post("/users", payload);
      navigate("/app/users");
    } catch (err: any) {
      setError(err.message || "Failed to create user account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="user-page-container">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/app/users")}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-amber-700 mb-2 cursor-pointer transition"
          >
            <ArrowLeft size={14} /> Back to Users Directory
          </button>
          <h1 className="user-page-title">
            <UserPlus className="text-amber-600 inline mr-2" size={28} />
            Add New User Account
          </h1>
          <p className="user-page-subtitle">
            Manually create a new team member account with credentials and workspace role.
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="user-form-card">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2 mb-6">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Personal Details */}
          <div className="user-form-section">
            <div className="user-section-header">
              <User size={15} className="user-section-icon" />
              <span>Personal Identity</span>
            </div>

            <div className="user-form-grid">
              <div className="user-form-group">
                <label className="user-form-label required">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="e.g. John"
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
                  placeholder="e.g. Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="user-form-input"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Authentication */}
          <div className="user-form-section">
            <div className="user-section-header">
              <Mail size={15} className="user-section-icon" />
              <span>Contact & Access Credentials</span>
            </div>

            <div className="user-form-grid">
              <div className="user-form-group">
                <label className="user-form-label required">Email Address</label>
                <div className="user-input-wrapper">
                  <span className="user-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="john.doe@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="user-form-input has-icon"
                  />
                </div>
              </div>

              <div className="user-form-group">
                <label className="user-form-label">Phone Number (Optional)</label>
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

            <div className="user-form-group" style={{ marginTop: "1.25rem" }}>
              <label className="user-form-label">Initial Password (Optional)</label>
              <div className="user-input-wrapper">
                <span className="user-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  name="password"
                  placeholder="Leave empty for default password (DIWSDefault123!)"
                  value={formData.password}
                  onChange={handleChange}
                  className="user-form-input has-icon"
                />
              </div>
              <p className="user-helper-text">
                If omitted, the user can reset password using their email.
              </p>
            </div>
          </div>

          {/* Section 3: Role & Department Assignment */}
          <div className="user-form-section">
            <div className="user-section-header">
              <Shield size={15} className="user-section-icon" />
              <span>Role & Department Scope</span>
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
                    <option value="Admin">Admin (Full Access)</option>
                    <option value="Manager">Manager (Operational Control)</option>
                    <option value="Supervisor">Supervisor (Line Control)</option>
                    <option value="Operator">Operator (Floor Exec)</option>
                    <option value="Employee">Employee (Basic Access)</option>
                  </select>
                </div>
              </div>

              <div className="user-form-group">
                <label className="user-form-label">Department ID / Code (Optional)</label>
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

          {/* Buttons */}
          <div className="user-form-footer">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/app/users")}
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
              Create Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
