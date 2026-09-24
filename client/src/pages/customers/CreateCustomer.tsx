import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerForm from "../../components/customers/CustomerForm";
import { customerService } from "../../services/customerService";
import type { ICustomer } from "../../types/customer";
import { ArrowLeft } from "lucide-react";
import "./CustomerPages.css";

export const CreateCustomer: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (customerData: Partial<ICustomer>) => {
    setSubmitting(true);
    try {
      const res = await customerService.createCustomer(customerData);
      if (res.data) {
        navigate(`/app/customers/${res.data._id}`);
      } else {
        navigate("/app/customers");
      }
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
            onClick={() => navigate("/app/customers")}
            className="btn-link-back flex items-center text-slate-500 hover:text-slate-800 mb-2 font-medium text-sm"
            style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Customer Directory
          </button>
          <h1>Create New Customer Account</h1>
          <p>Register a new client enterprise, billing contacts, and credit parameters.</p>
        </div>
      </div>

      {/* Customer Form Component */}
      <CustomerForm
        onSubmit={handleSubmit}
        isLoading={submitting}
        submitButtonText="Create Customer Account"
        onCancel={() => navigate("/app/customers")}
      />
    </div>
  );
};

export default CreateCustomer;
