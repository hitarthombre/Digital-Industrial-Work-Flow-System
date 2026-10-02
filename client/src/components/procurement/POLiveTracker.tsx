import React, { useState } from "react";
import type { IPOLiveTracking, POStatus } from "../../types/procurement";
import { Badge } from "../Badge";
import { Button } from "../Button";
import {
  Truck,
  CheckCircle2,
  Clock,
  Package,
  FileCheck,
  Send,
  AlertCircle,
  MapPin,
  Calendar,
  Building2,
  Warehouse,
  ShieldCheck,
  Edit,
} from "lucide-react";

interface POLiveTrackerProps {
  tracking: IPOLiveTracking;
  onUpdateStatus?: (newStatus: POStatus, comment?: string) => Promise<void>;
  isUpdating?: boolean;
}

const PO_STAGES: Array<{ status: POStatus; label: string; icon: React.ReactNode }> = [
  { status: "Draft", label: "Draft Order", icon: <Clock size={16} /> },
  { status: "Submitted", label: "Submitted", icon: <Send size={16} /> },
  { status: "Approved", label: "Approved", icon: <FileCheck size={16} /> },
  { status: "Issued", label: "PO Issued", icon: <ShieldCheck size={16} /> },
  { status: "In Transit", label: "In Transit", icon: <Truck size={16} /> },
  { status: "Goods Received", label: "Goods Received", icon: <Package size={16} /> },
  { status: "Closed", label: "Closed & Settled", icon: <CheckCircle2 size={16} /> },
];

export const POLiveTracker: React.FC<POLiveTrackerProps> = ({
  tracking,
  onUpdateStatus,
  isUpdating = false,
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<POStatus>(tracking.currentStatus);
  const [comment, setComment] = useState("");

  const getStageIndex = (status: POStatus): number => {
    switch (status) {
      case "Draft":
        return 0;
      case "Submitted":
        return 1;
      case "Approved":
      case "PO Created":
        return 2;
      case "Issued":
        return 3;
      case "In Transit":
        return 4;
      case "Partial Delivery":
      case "Goods Received":
        return 5;
      case "Closed":
        return 6;
      case "Cancelled":
        return -1;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(tracking.currentStatus);
  const isCancelled = tracking.currentStatus === "Cancelled";

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateStatus) {
      await onUpdateStatus(selectedStatus, comment);
      setShowStatusModal(false);
      setComment("");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6">
      {/* Header Info */}
      <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
              {tracking.poNumber}
            </h2>
            <Badge
              variant={
                tracking.currentStatus === "Goods Received" || tracking.currentStatus === "Closed"
                  ? "active"
                  : tracking.currentStatus === "In Transit"
                  ? "maintenance"
                  : tracking.currentStatus === "Cancelled"
                  ? "closed"
                  : "inactive"
              }
              size="md"
            >
              {tracking.currentStatus}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <Building2 size={14} className="text-amber-600" /> Vendor:{" "}
              <strong className="text-slate-800">{tracking.supplierName}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 font-medium">
              <Warehouse size={14} className="text-amber-600" /> Destination:{" "}
              <strong className="text-slate-800">{tracking.warehouseName}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {tracking.estimatedArrival && (
            <div className="text-right bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <span className="text-[11px] uppercase font-bold text-amber-800 block">
                Est. Delivery Arrival
              </span>
              <div className="text-sm font-extrabold text-amber-900 flex items-center gap-1">
                <Calendar size={14} />
                {new Date(tracking.estimatedArrival).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          )}

          {onUpdateStatus && (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit size={14} />}
              onClick={() => setShowStatusModal(true)}
            >
              Update Status
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar & Stages Stepper */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Fulfillment Progress Lifecycle
          </span>
          <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            {isCancelled ? "Order Cancelled" : `${tracking.progressPercentage}% Completed`}
          </span>
        </div>

        {/* Progress bar line */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6 relative">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isCancelled
                ? "bg-rose-500"
                : tracking.progressPercentage === 100
                ? "bg-emerald-500"
                : "bg-gradient-to-r from-amber-500 to-amber-600"
            }`}
            style={{ width: isCancelled ? "100%" : `${tracking.progressPercentage}%` }}
          />
        </div>

        {/* Stepper nodes */}
        {!isCancelled ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {PO_STAGES.map((stage, idx) => {
              const isCompleted = idx <= currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div
                  key={stage.status}
                  className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all ${
                    isCurrent
                      ? "bg-amber-50 border-amber-400 ring-2 ring-amber-200"
                      : isCompleted
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs font-bold ${
                      isCurrent
                        ? "bg-amber-600 text-white shadow-sm"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {stage.icon}
                  </div>
                  <span
                    className={`text-[11px] font-bold ${
                      isCurrent
                        ? "text-amber-900"
                        : isCompleted
                        ? "text-emerald-800"
                        : "text-slate-500"
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-800">
            <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-sm block">Purchase Order Status: CANCELLED</span>
              <p className="text-xs text-rose-700">
                This purchase order has been marked as cancelled. No further tracking or GRN actions can be recorded.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Carrier & Waybill details card */}
      {(tracking.carrierName || tracking.trackingNumber) && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase block">
                Carrier Freight & Waybill
              </span>
              <div className="text-sm font-bold text-slate-900">
                {tracking.carrierName || "Logistics Freight Partner"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            {tracking.trackingNumber && (
              <div className="bg-white px-3 py-1.5 rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-sans">
                  Waybill / Tracking #
                </span>
                <strong className="text-slate-800 font-bold">{tracking.trackingNumber}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Timeline Logs */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-amber-600" />
          Fulfillment Timeline Audit Log
        </h3>

        <div className="relative border-l-2 border-slate-200 ml-3 pl-4 space-y-4 py-1">
          {tracking.timeline && tracking.timeline.length > 0 ? (
            tracking.timeline.map((evt, idx) => (
              <div key={idx} className="relative group">
                {/* Node circle */}
                <div
                  className={`absolute -left-[23px] top-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    idx === tracking.timeline.length - 1 ? "bg-amber-600 ring-4 ring-amber-100" : "bg-emerald-600"
                  }`}
                />

                <div className="flex justify-between items-start flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {evt.status}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {new Date(evt.timestamp).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {evt.location && (
                  <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold mt-1">
                    <MapPin size={12} className="text-amber-600" />
                    <span>{evt.location}</span>
                  </div>
                )}

                {evt.notes && (
                  <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-100 font-sans">
                    {evt.notes}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">No timeline entries logged yet.</p>
          )}
        </div>
      </div>

      {/* Modal for updating PO status */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Edit size={18} className="text-amber-600" />
              Update Order Status
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Select the new status for Purchase Order <strong className="font-mono text-amber-800">{tracking.poNumber}</strong>.
            </p>

            <form onSubmit={handleStatusSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as POStatus)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Issued">Issued</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Partial Delivery">Partial Delivery</option>
                  <option value="Goods Received">Goods Received</option>
                  <option value="Closed">Closed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Audit Comment / Location Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Shipment dispatched via express courier from vendor logistics hub..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={isUpdating}>
                  Save Status
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default POLiveTracker;
