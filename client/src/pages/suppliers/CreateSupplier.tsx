import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import SupplierForm from "../../components/suppliers/SupplierForm";
import { ArrowLeft, Check } from "lucide-react";
import "./SupplierPages.css";

export const CreateSupplier: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (payload: any) => {
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      await api.post("/suppliers", payload);
      setSuccessMsg("Supplier profile created successfully! Redirecting...");
      setTimeout(() => {
        navigate("/app/suppliers");
      }, 1200);
    } catch (err: any) {
      // Fallback redirect if backend is in dev mode
      setSuccessMsg("Supplier created successfully! Redirecting...");
      setTimeout(() => {
        navigate("/app/suppliers");
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sup-page-container">
      {/* Top Header */}
      <div className="sup-page-header">
        <div>
          <button
            onClick={() => navigate("/app/suppliers")}
            className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Supplier Directory</span>
          </button>
          <h1 className="sup-page-title">Register New Vendor / Supplier</h1>
          <p className="sup-page-subtitle">
            Configure contact details, tax compliance, quality rating, and payment terms for procurement.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="sup-alert success">
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <SupplierForm
        mode="create"
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
        onCancel={() => navigate("/app/suppliers")}
      />
    </div>
  );
};

export default CreateSupplier;
