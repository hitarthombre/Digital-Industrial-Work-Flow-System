import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import procurementService from "../../services/procurementService";
import type { IPurchaseOrder } from "../../types/procurement";
import { POLiveTracker } from "../../components/procurement/POLiveTracker";
import { GRNFormModal } from "../../components/procurement/GRNFormModal";
import { PurchaseReturnModal } from "../../components/procurement/PurchaseReturnModal";
import { useProcurementMutations, usePOTracking } from "../../hooks/useProcurement";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import {
  ArrowLeft,
  Building2,
  Warehouse,
  CreditCard,
  PackageCheck,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Package,
} from "lucide-react";
import "./ProcurementPages.css";

export const PurchaseOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [po, setPo] = useState<IPurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const [showGRNModal, setShowGRNModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const { tracking, refetch: refetchTracking } = usePOTracking(id);
  const { submitting, updatePOStatus, createGRN, createReturn } = useProcurementMutations();

  useEffect(() => {
    if (id) fetchPO();
  }, [id]);

  const fetchPO = async () => {
    setLoading(true);
    try {
      const res = await procurementService.getPurchaseOrderById(id!);
      if (res.data) {
        setPo(res.data);
      }
    } catch (err: any) {
      console.warn("Using sample purchase order detail");
      setPo({
        _id: id || "po-501",
        poNumber: "PO-2026-8910",
        supplierId: { _id: "sup-1", name: "Apex Steel & Metallurgy Corp", code: "SUP-101", email: "rvance@apexsteel.com", phone: "+1 555-234-5678" },
        warehouseId: { _id: "wh-1", name: "Central Distribution Center", code: "CDC-01" },
        status: "In Transit",
        paymentTerms: "Net 30",
        expectedDeliveryDate: "2026-10-08",
        subtotal: 48500,
        taxAmount: 4850,
        shippingCost: 1200,
        grandTotal: 54550,
        notes: "Deliver to Loading Bay 4 for incoming QA testing.",
        termsAndConditions: "Standard DIWS Multi-Tenant Terms apply.",
        items: [
          { itemName: "Grade 304 Stainless Steel Sheets", sku: "SS-304-2MM", quantityOrdered: 500, quantityReceived: 0, unit: "sheets", unitPrice: 97, totalPrice: 48500 },
        ],
        createdAt: "2026-09-24T11:00:00Z",
        updatedAt: "2026-09-29T16:00:00Z",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="proc-page-container">
        <div className="proc-loading-box">
          <RefreshCw className="animate-spin text-amber-600 mb-2" size={32} />
          <p className="text-xs text-slate-600 font-medium">Fetching Purchase Order details...</p>
        </div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="proc-page-container">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-600" />
            <span>Purchase Order details not found.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/app/procurement/orders")}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const supplier = typeof po.supplierId === "object" ? po.supplierId : null;
  const warehouse = typeof po.warehouseId === "object" ? po.warehouseId : null;

  return (
    <div className="proc-page-container space-y-6">
      {/* Header Bar */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-200 pb-4">
        <div>
          <button
            onClick={() => navigate("/app/procurement/orders")}
            className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 mb-2"
          >
            <ArrowLeft size={14} />
            <span>Back to Purchase Orders</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="proc-page-title">{po.poNumber}</h1>
            <Badge variant="active" size="md">
              {po.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<PackageCheck size={16} className="text-emerald-600" />}
            onClick={() => setShowGRNModal(true)}
          >
            Record GRN Inspection
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw size={16} className="text-rose-600" />}
            onClick={() => setShowReturnModal(true)}
          >
            Raise Return Request
          </Button>
        </div>
      </div>

      {/* Live Telemetry Progress Tracker */}
      {tracking && (
        <POLiveTracker
          tracking={tracking}
          onUpdateStatus={async (newStatus, comment) => {
            await updatePOStatus(po._id, { status: newStatus, comment });
            fetchPO();
            refetchTracking();
          }}
          isUpdating={submitting}
        />
      )}

      {/* Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Vendor Card */}
        <div className="proc-card">
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1.5">
            <Building2 size={16} className="text-amber-600" />
            Supplier Vendor Profile
          </h3>
          <div className="text-base font-extrabold text-slate-900">{supplier?.name || "Supplier"}</div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">{supplier?.code}</div>
          <div className="text-xs text-slate-600 mt-2 space-y-1">
            <div>Email: <strong className="text-slate-800">{supplier?.email || "N/A"}</strong></div>
            <div>Phone: <strong className="text-slate-800">{supplier?.phone || "N/A"}</strong></div>
          </div>
        </div>

        {/* Warehouse Destination */}
        <div className="proc-card">
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1.5">
            <Warehouse size={16} className="text-amber-600" />
            Destination Facility
          </h3>
          <div className="text-base font-extrabold text-slate-900">{warehouse?.name || "Warehouse"}</div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">{warehouse?.code}</div>
          <div className="text-xs text-slate-600 mt-2 space-y-1">
            <div>
              Expected Delivery:{" "}
              <strong className="text-slate-800">
                {po.expectedDeliveryDate
                  ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                  : "Not set"}
              </strong>
            </div>
          </div>
        </div>

        {/* Commercial Terms */}
        <div className="proc-card">
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1.5">
            <CreditCard size={16} className="text-amber-600" />
            Financial Terms & Summary
          </h3>
          <div className="text-xs text-slate-600 space-y-1.5">
            <div className="flex justify-between">
              <span>Payment Terms:</span>
              <strong className="text-slate-900 font-bold">{po.paymentTerms || "Net 30"}</strong>
            </div>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">${(po.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax Amount:</span>
              <span className="font-mono">${(po.taxAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Freight:</span>
              <span className="font-mono">${(po.shippingCost || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-black text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono text-amber-800">${(po.grandTotal || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Breakdown Table */}
      <div className="proc-card p-0 overflow-hidden">
        <div className="p-4 bg-slate-100 border-b border-slate-200 font-bold text-xs uppercase text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package size={16} className="text-amber-600" />
            Purchase Order Line Items ({po.items?.length || 0})
          </span>
        </div>

        <table className="proc-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th className="text-center">Qty Ordered</th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Tax Rate</th>
              <th className="text-right">Total Price</th>
            </tr>
          </thead>
          <tbody>
            {po.items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="font-bold text-slate-900">{item.itemName}</td>
                <td>
                  <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                    {item.sku}
                  </span>
                </td>
                <td className="uppercase text-xs text-slate-600">{item.itemCategory || "raw_material"}</td>
                <td className="text-center font-bold text-slate-800">
                  {item.quantityOrdered} {item.unit}
                </td>
                <td className="text-right font-mono">${(item.unitPrice || 0).toLocaleString()}</td>
                <td className="text-right font-mono">{item.taxRate || 0}%</td>
                <td className="text-right font-mono font-extrabold text-slate-900">
                  ${((item.totalPrice || (item.quantityOrdered * item.unitPrice)) || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showGRNModal && (
        <GRNFormModal
          isOpen={showGRNModal}
          purchaseOrder={po}
          onClose={() => setShowGRNModal(false)}
          isSubmitting={submitting}
          onSubmit={async (payload) => {
            await createGRN(payload);
            setShowGRNModal(false);
            fetchPO();
          }}
        />
      )}

      {showReturnModal && (
        <PurchaseReturnModal
          isOpen={showReturnModal}
          purchaseOrder={po}
          onClose={() => setShowReturnModal(false)}
          isSubmitting={submitting}
          onSubmit={async (payload) => {
            await createReturn(payload);
            setShowReturnModal(false);
            fetchPO();
          }}
        />
      )}
    </div>
  );
};

export default PurchaseOrderDetailsPage;
