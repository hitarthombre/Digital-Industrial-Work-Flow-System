import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomerForm from "../../components/customers/CustomerForm";
import { customerService } from "../../services/customerService";
import type { ICustomer } from "../../types/customer";
import { ArrowLeft } from "lucide-react";
import "./CustomerPages.css";

export const EditCustomer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (customerData: Partial<ICustomer>) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await customerService.updateCustomer(id, customerData);
      navigate(`/app/customers/${id}`);
    } catch (err: any) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="customer-page-container">
      {/* Header Banner */}
      <div className="customer-page-header">
        <div className="customer-page-title">
          <button
            onClick={() => navigate(`/app/customers/${id || ""}`)}
            className="btn-link-back flex items-center text-slate-500 hover:text-slate-800 mb-2 font-medium text-sm"
            style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Customer Overview
          </button>
          <h1>Edit Customer Account</h1>
          <p>Update customer profile, primary contacts, credit limits, or billing address.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state" style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner"></div>
          <p>Loading customer profile...</p>
        </div>
      ) : error ? (
        <div className="form-error-alert">{error}</div>
      ) : customer ? (
        <CustomerForm
          initialValues={customer}
          onSubmit={handleSubmit}
          isLoading={submitting}
          submitButtonText="Update Account Details"
          onCancel={() => navigate(`/app/customers/${id}`)}
        />
      ) : null}
    </div>
  );
};

export default EditCustomer;
