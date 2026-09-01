import React, { useState, useEffect } from "react";
import { Modal } from "../Modal";
import { Button } from "../Button";
import { Badge } from "../Badge";
import { api } from "../../services/api";
import type { FactoryStatus, IFactory } from "../../types/factory";
import { CheckCircle2, Clock, Wrench, XCircle, AlertCircle } from "lucide-react";
import "./FactoryModals.css";

interface FactoryStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  factory: IFactory | null;
  onSuccess?: (updated: IFactory) => void;
}

const STATUS_OPTIONS: {
  value: FactoryStatus;
  label: string;
  badgeVariant: "active" | "inactive" | "maintenance" | "closed";
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: "active",
    label: "Active",
    badgeVariant: "active",
    icon: <CheckCircle2 size={18} className="text-emerald-600" />,
    description: "Fully operational site executing work orders and receiving raw materials.",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    badgeVariant: "maintenance",
    icon: <Wrench size={18} className="text-amber-600" />,
    description: "Scheduled servicing or equipment upgrades in progress. Limited operations.",
  },
  {
    value: "inactive",
    label: "Inactive",
    badgeVariant: "inactive",
    icon: <Clock size={18} className="text-slate-600" />,
    description: "Temporarily paused operations. Machinery in standby state.",
  },
  {
    value: "closed",
    label: "Closed",
    badgeVariant: "closed",
    icon: <XCircle size={18} className="text-rose-600" />,
    description: "Decommissioned or permanently shutdown site. No work orders permitted.",
  },
];

export const FactoryStatusModal: React.FC<FactoryStatusModalProps> = ({
  isOpen,
  onClose,
  factory,
  onSuccess,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<FactoryStatus>("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (factory) {
      setSelectedStatus(factory.status);
      setError(null);
    }
  }, [factory, isOpen]);

  if (!factory) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factory || selectedStatus === factory.status) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.patch<{ success: boolean; data: IFactory; message?: string }>(
        `/factories/${factory._id}/status`,
        { status: selectedStatus }
      );

      if (response.data) {
        if (onSuccess) onSuccess(response.data);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update factory status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Change Operational Status</span>
        </div>
      }
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="copper" type="button" onClick={handleSubmit} loading={loading}>
            Update Status
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="factory-modal-content">
        <div className="factory-modal-info">
          <p className="text-sm text-slate-600">
            Updating operational status for <strong className="text-slate-900">{factory.name}</strong> ({factory.code}).
          </p>
        </div>

        {error && (
          <div className="factory-modal-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="status-options-grid">
          {STATUS_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`status-option-card ${selectedStatus === opt.value ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="status"
                value={opt.value}
                checked={selectedStatus === opt.value}
                onChange={() => setSelectedStatus(opt.value)}
                className="sr-only"
              />
              <div className="status-option-header">
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span className="font-semibold text-slate-800">{opt.label}</span>
                </div>
                <Badge variant={opt.badgeVariant} size="sm">
                  {opt.label}
                </Badge>
              </div>
              <p className="status-option-desc">{opt.description}</p>
            </label>
          ))}
        </div>
      </form>
    </Modal>
  );
};

export default FactoryStatusModal;
