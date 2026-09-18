import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import type { IWarehouse, WarehouseSingleResponse } from "../../types/warehouse";
import WarehouseForm from "../../components/warehouses/WarehouseForm";
import { ArrowLeft, Check, RefreshCw, AlertTriangle } from "lucide-react";
import "./WarehousePages.css";

export const EditWarehouse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState<IWarehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchWarehouse(id);
    }
  }, [id]);

  const fetchWarehouse = async (whId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<WarehouseSingleResponse>(`/warehouses/${whId}`);
      if (response.data) {
        setWarehouse(response.data);
      } else {
        setError("Warehouse record not found.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load warehouse details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload: any) => {
    if (!id) return;
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      await api.put(`/warehouses/${id}`, payload);
      setSuccessMsg("Warehouse updated successfully! Redirecting...");
      setTimeout(() => {
        navigate("/app/warehouses");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to update warehouse details.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="wh-page-container">
        <div className="wh-loading-box">
          <RefreshCw className="animate-spin text-amber-600 mb-2" size={32} />
          <p className="text-slate-600 font-medium">Loading warehouse form data...</p>
        </div>
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div className="wh-page-container">
        <button
          onClick={() => navigate("/app/warehouses")}
          className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Warehouse List</span>
        </button>
        <div className="wh-alert error">
          <AlertTriangle size={18} />
          <span>{error || "Warehouse location not found."}</span>
        </div>
      </div>
    );
  }

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
            <span>Back to Warehouse List</span>
          </button>
          <h1 className="wh-page-title">Edit Warehouse Facility</h1>
          <p className="wh-page-subtitle">
            Update metadata, status, GPS coordinates, capacity quotas, or assigned manager for <strong>{warehouse.name}</strong> ({warehouse.code}).
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
        mode="edit"
        initialValues={warehouse}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
        onCancel={() => navigate("/app/warehouses")}
      />
    </div>
  );
};

export default EditWarehouse;
