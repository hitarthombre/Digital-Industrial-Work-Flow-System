import React from "react";
import { Modal } from "../Modal";
import SupplierForm from "./SupplierForm";
import type { ISupplier } from "../../types/supplier";

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: Partial<ISupplier>;
  mode: "create" | "edit";
  onSubmit: (formData: any) => Promise<void>;
  submitting: boolean;
  error?: string | null;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  initialValues,
  mode,
  onSubmit,
  submitting,
  error,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Register New Vendor / Supplier" : `Edit Supplier: ${initialValues?.name || ""}`}
      maxWidth="lg"
    >
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        <SupplierForm
          mode={mode}
          initialValues={initialValues}
          onSubmit={onSubmit}
          submitting={submitting}
          error={error}
          onCancel={onClose}
        />
      </div>
    </Modal>
  );
};

export default SupplierFormModal;
