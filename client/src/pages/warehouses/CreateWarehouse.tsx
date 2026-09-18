import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import WarehouseForm from "../../components/warehouses/WarehouseForm";
import { ArrowLeft, Check } from "lucide-react";
import "./WarehousePages.css";

export const CreateWarehouse: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (payload: any) => {
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      await api.post("/warehouses", payload);
      setSuccessMsg("Warehouse created successfully! Redirecting...");
      setTimeout(() => {
        navigate("/app/warehouses");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to create warehouse location.");
      setSubmitting(false);
    }
  };

  return (
    <div className="wh-page-container">
      {/* Top Header */}
      <div className="wh-page-header">
        <div>
          <button
            onClick={() => navigate("/app/warehouses")}
            className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Warehouse Logistics</span>
          </button>
          <h1 className="wh-page-title">Register New Warehouse Location</h1>
          <p className="wh-page-subtitle">
            Configure warehouse facility type, GPS pin coordinates, total storage capacity limits, and assign site manager.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="wh-alert success mb-4">
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <WarehouseForm
        mode="create"
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
        onCancel={() => navigate("/app/warehouses")}
      />
    </div>
  );
};

export default CreateWarehouse;
