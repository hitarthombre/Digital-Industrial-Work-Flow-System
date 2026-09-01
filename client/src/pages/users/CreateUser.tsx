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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setError("First name, last name, and email address are required.");
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
      <div className="max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2 mb-6">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Details */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <User size={14} className="text-amber-600" /> Personal Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="e.g. John"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="e.g. Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Authentication */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Mail size={14} className="text-amber-600" /> Contact & Access Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="john.doe@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="phone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Initial Password (Optional)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type="password"
                  name="password"
                  placeholder="Leave empty for default password (DIWSDefault123!)"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                If omitted, the user can reset password using their email.
              </p>
            </div>
          </div>

          {/* Section 3: Role & Department Assignment */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Shield size={14} className="text-amber-600" /> Role & Department Scope
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition cursor-pointer"
                  >
                    <option value="Admin">Admin (Full Access)</option>
                    <option value="Manager">Manager (Operational Control)</option>
                    <option value="Supervisor">Supervisor (Line Control)</option>
                    <option value="Operator">Operator (Floor Exec)</option>
                    <option value="Employee">Employee (Basic Access)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department ID / Code (Optional)
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="departmentId"
                    placeholder="e.g. DEPT-PLANT-01"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
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
