import React, { useState, useEffect } from "react";
import type {
  IPurchaseRequest,
  CreatePRPayload,
  ApprovePRPayload,
  ItemCategory,
  PRPriority,
} from "../../types/procurement";
import { Button } from "../Button";
import { Badge } from "../Badge";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
} from "lucide-react";

interface PurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestToView?: IPurchaseRequest | null;
  onCreateSubmit?: (payload: CreatePRPayload) => Promise<void>;
  onApproveSubmit?: (id: string, payload: ApprovePRPayload) => Promise<void>;
  isSubmitting?: boolean;
}

interface PRItemRow {
  itemName: string;
  sku: string;
  itemCategory: ItemCategory;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  notes: string;
}

export const PurchaseRequestModal: React.FC<PurchaseRequestModalProps> = ({
  isOpen,
  onClose,
  requestToView,
  onCreateSubmit,
  onApproveSubmit,
  isSubmitting = false,
}) => {
  const { user } = useAuth();

  // Check RBAC permission for approving PRs
  const userRole = (user?.role || "").toLowerCase();
  const canApprove =
    userRole.includes("admin") ||
    userRole.includes("manager") ||
    userRole.includes("procurement") ||
    userRole.includes("approver") ||
    userRole === ""; // Default demo access if roles are open

  const isViewMode = !!requestToView;

  // Warehouse list for dropdown selection
  const [warehouses, setWarehouses] = useState<Array<{ _id: string; name: string; code?: string }>>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [department, setDepartment] = useState("Production & Stores");
  const [priority, setPriority] = useState<PRPriority>("medium");
  const [requiredByDate, setRequiredByDate] = useState("");
  const [justification, setJustification] = useState("");

  const [items, setItems] = useState<PRItemRow[]>([
    {
      itemName: "",
      sku: "",
      itemCategory: "raw_material",
      quantity: 1,
      unit: "units",
      estimatedUnitPrice: 0,
      notes: "",
    },
  ]);

  // Approval state
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchWarehouses();
    }
  }, [isOpen]);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get<any>("/warehouses");
      if (res.data && Array.isArray(res.data)) {
        setWarehouses(res.data);
        if (res.data.length > 0) setWarehouseId(res.data[0]._id);
      }
    } catch (_) {
      setWarehouses([
        { _id: "wh-1", name: "Central Distribution Center", code: "CDC-01" },
        { _id: "wh-2", name: "East Coast Assembly Hub", code: "ECA-02" },
      ]);
      setWarehouseId("wh-1");
    }
  };

  if (!isOpen) return null;

  const addItemRow = () => {
    setItems([
      ...items,
      {
        itemName: "",
        sku: "",
        itemCategory: "raw_material",
        quantity: 1,
        unit: "units",
        estimatedUnitPrice: 0,
        notes: "",
      },
    ]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof PRItemRow, val: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = val;
    setItems(updated);
  };

  const calculateTotalEstimated = () => {
    return items.reduce((acc, item) => acc + (item.quantity || 0) * (item.estimatedUnitPrice || 0), 0);
  };

  const handleCreateFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!warehouseId) {
      setValidationError("Warehouse selection is required.");
      return;
    }

    if (items.length === 0) {
      setValidationError("At least one request item is required.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemName.trim()) {
        setValidationError(`Item #${i + 1}: Item name is required.`);
        return;
      }
      if (items[i].quantity <= 0) {
        setValidationError(`Item #${i + 1}: Quantity must be at least 1.`);
        return;
      }
    }

    const payload: CreatePRPayload = {
      warehouseId,
      department,
      priority,
      requiredByDate,
      justification,
      status: "Submitted",
      items: items.map((item) => ({
        itemName: item.itemName,
        sku: item.sku,
        itemCategory: item.itemCategory,
        quantity: item.quantity,
        unit: item.unit,
        estimatedUnitPrice: item.estimatedUnitPrice,
        notes: item.notes,
      })),
    };

    if (onCreateSubmit) {
      try {
        await onCreateSubmit(payload);
      } catch (err: any) {
        setValidationError(err.message || "Failed to create purchase request.");
      }
    }
  };

  const handleApprovalSubmit = async (status: "Approved" | "Rejected") => {
    if (!requestToView || !onApproveSubmit) return;
    setValidationError(null);

    if (status === "Rejected" && !rejectionReason.trim()) {
      setValidationError("Rejection reason is required when rejecting a purchase request.");
      return;
    }

    const payload: ApprovePRPayload = {
      status,
      approvalNotes,
      rejectionReason,
    };

    try {
      await onApproveSubmit(requestToView._id, payload);
    } catch (err: any) {
      setValidationError(err.message || "Failed to process approval action.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="text-amber-600" size={24} />
              {isViewMode ? `Purchase Request ${requestToView.prNumber}` : "New Purchase Request (PR)"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isViewMode
                ? `Requested by ${
                    typeof requestToView.requestedBy === "object"
                      ? `${requestToView.requestedBy?.firstName} ${requestToView.requestedBy?.lastName}`
                      : "User"
                  } • ${new Date(requestToView.createdAt).toLocaleDateString()}`
                : "Create a formal requisition for raw materials or industrial components"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>

        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* View & Approval Mode */}
        {isViewMode ? (
          <div className="flex flex-col flex-1 overflow-y-auto space-y-6 pr-1">
            {/* PR Header Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-bold uppercase block text-[10px]">Status</span>
                <Badge
                  variant={
                    requestToView.status === "Approved"
                      ? "active"
                      : requestToView.status === "Rejected"
                      ? "closed"
                      : "maintenance"
                  }
                  size="sm"
                >
                  {requestToView.status}
                </Badge>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block text-[10px]">Priority</span>
                <span className="font-extrabold uppercase text-amber-700">{requestToView.priority}</span>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block text-[10px]">Department</span>
                <span className="font-semibold text-slate-800">{requestToView.department || "N/A"}</span>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block text-[10px]">Total Est. Cost</span>
                <span className="font-extrabold text-slate-900 text-sm font-mono">
                  ${(requestToView.totalEstimatedCost || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {requestToView.justification && (
              <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                <span className="font-bold uppercase text-[10px] text-amber-800 block mb-0.5">
                  Business Justification
                </span>
                <p>{requestToView.justification}</p>
              </div>
            )}

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-700 mb-2">Requisition Line Items</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-600 uppercase border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-3">Item / Description</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Est. Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {requestToView.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{item.itemName}</td>
                        <td className="p-3 font-mono text-slate-600">{item.sku || "N/A"}</td>
                        <td className="p-3 text-slate-700 uppercase text-[11px]">{item.itemCategory || "raw_material"}</td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          ${(item.estimatedUnitPrice || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RBAC Interactive Approval Controls Section */}
            {canApprove && requestToView.status === "Submitted" && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="text-amber-700" size={20} />
                  <h4 className="text-sm font-extrabold text-amber-900">
                    RBAC Manager Approval Decision
                  </h4>
                </div>
                <p className="text-xs text-amber-800">
                  As an authorized Procurement Approver, review the requisition lines above and record your approval or rejection notes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">
                      Approval Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Budget pre-approved for Q4 production."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">
                      Rejection Reason (If rejecting)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Exceeds monthly allocation limits."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="danger"
                    size="sm"
                    loading={isSubmitting}
                    icon={<XCircle size={16} />}
                    onClick={() => handleApprovalSubmit("Rejected")}
                  >
                    Reject PR
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isSubmitting}
                    icon={<CheckCircle2 size={16} />}
                    onClick={() => handleApprovalSubmit("Approved")}
                  >
                    Approve PR
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Create Form Mode */
          <form onSubmit={handleCreateFormSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Destination Warehouse <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800"
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PRPriority)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Required By Date
                  </label>
                  <input
                    type="date"
                    value={requiredByDate}
                    onChange={(e) => setRequiredByDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Requisition Justification / Purpose
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe why these materials are required..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              {/* Dynamic Line Items Builder */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold uppercase text-slate-700">Request Line Items</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    icon={<Plus size={14} />}
                    onClick={addItemRow}
                  >
                    Add Line Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Item Name *"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-semibold text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="SKU Code"
                          value={item.sku}
                          onChange={(e) => handleItemChange(idx, "sku", e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <select
                          value={item.itemCategory}
                          onChange={(e) => handleItemChange(idx, "itemCategory", e.target.value as ItemCategory)}
                          className="w-full bg-white border border-slate-300 rounded p-1.5 text-[11px]"
                        >
                          <option value="raw_material">Raw Material</option>
                          <option value="components">Components</option>
                          <option value="packaging">Packaging</option>
                          <option value="finished_goods">Finished Goods</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty *"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-bold text-center"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Est Price $"
                          value={item.estimatedUnitPrice}
                          onChange={(e) => handleItemChange(idx, "estimatedUnitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-right"
                        />
                      </div>

                      <div className="sm:col-span-1 text-right">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-right text-xs font-bold text-slate-800 mt-2">
                  Total Estimated Cost:{" "}
                  <span className="text-amber-800 font-mono text-sm">${calculateTotalEstimated().toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <Button variant="outline" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={isSubmitting} icon={<CheckCircle2 size={16} />}>
                Submit Purchase Request
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PurchaseRequestModal;
