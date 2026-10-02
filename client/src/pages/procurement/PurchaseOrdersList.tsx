import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  usePurchaseOrders,
  usePOTracking,
  useProcurementMutations,
} from "../../hooks/useProcurement";
import type { IPurchaseOrder, POStatus } from "../../types/procurement";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { PurchaseOrderModal } from "../../components/procurement/PurchaseOrderModal";
import { GRNFormModal } from "../../components/procurement/GRNFormModal";
import { PurchaseReturnModal } from "../../components/procurement/PurchaseReturnModal";
import { POLiveTracker } from "../../components/procurement/POLiveTracker";
import {
  FileCheck,
  Plus,
  Search,
  RefreshCw,
  Truck,
  PackageCheck,
  RotateCcw,
  Eye,
  Building2,
  Calendar,
  X,
} from "lucide-react";
import "./ProcurementPages.css";

export const PurchaseOrdersList: React.FC = () => {
  const navigate = useNavigate();

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false);
  const [trackingPO, setTrackingPO] = useState<IPurchaseOrder | null>(null);
  const [grnPO, setGrnPO] = useState<IPurchaseOrder | null>(null);
  const [returnPO, setReturnPO] = useState<IPurchaseOrder | null>(null);

  const { orders, loading, refetch } = usePurchaseOrders({
    status: activeTab === "ALL" ? undefined : activeTab,
  });

  const { tracking, refetch: refetchTracking } = usePOTracking(trackingPO?._id);

  const { submitting, createPO, updatePOStatus, createGRN, createReturn } =
    useProcurementMutations();

  // Filtered orders list
  const filteredOrders = orders.filter((po) => {
    if (activeTab !== "ALL" && po.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = po.poNumber.toLowerCase().includes(q);
      const supplierName =
        typeof po.supplierId === "object" ? po.supplierId?.name || "" : String(po.supplierId);
      const matchSupplier = supplierName.toLowerCase().includes(q);
      const warehouseName =
        typeof po.warehouseId === "object" ? po.warehouseId?.name || "" : String(po.warehouseId);
      const matchWarehouse = warehouseName.toLowerCase().includes(q);

      if (!matchNumber && !matchSupplier && !matchWarehouse) return false;
    }
    return true;
  });

  const getStatusBadgeVariant = (status: POStatus) => {
    switch (status) {
      case "Closed":
      case "Goods Received":
        return "active";
      case "In Transit":
      case "Issued":
        return "maintenance";
      case "Approved":
      case "Submitted":
        return "neutral";
      case "Draft":
        return "inactive";
      case "Cancelled":
        return "closed";
      default:
        return "neutral";
    }
  };

  return (
    <div className="proc-page-container">
      {/* Top Header */}
      <div className="proc-header">
        <div>
          <h1 className="proc-page-title">
            <FileCheck className="text-amber-600" size={28} />
            Purchase Order Management (PO)
          </h1>
          <p className="proc-page-subtitle">
            Issue, track live shipments, inspect incoming goods notes (GRN), and process purchase returns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => setIsCreatePOModalOpen(true)}
          >
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* Sub-nav Status Tabs */}
      <div className="proc-tabs-bar">
        {[
          "ALL",
          "Issued",
          "In Transit",
          "Goods Received",
          "Approved",
          "Draft",
          "Closed",
          "Cancelled",
        ].map((tab) => (
          <button
            key={tab}
            className={`proc-tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            <span>{tab === "ALL" ? "All Orders" : tab}</span>
            <span className="ml-1 text-[11px] bg-slate-100 px-1.5 py-0.2 rounded-full font-bold">
              {tab === "ALL" ? orders.length : orders.filter((o) => o.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="proc-filter-bar">
        <div className="proc-search-box">
          <Search size={16} className="proc-search-icon" />
          <input
            type="text"
            placeholder="Search by PO number, supplier vendor name, or destination warehouse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="proc-search-input"
          />
        </div>
      </div>

      {/* Orders Management Table */}
      <div className="proc-card p-0 overflow-hidden">
        {loading ? (
          <div className="proc-loading-box">
            <RefreshCw className="animate-spin text-amber-600 mb-2" size={28} />
            <p className="text-xs text-slate-500">Loading purchase orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="proc-empty-box">
            <FileCheck size={40} className="text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Purchase Orders Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              There are no purchase orders matching your selected status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="proc-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Supplier Vendor</th>
                  <th>Warehouse Facility</th>
                  <th>Expected Delivery</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th className="text-right">Operations & Tracking Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((po) => {
                  const supplierName =
                    typeof po.supplierId === "object"
                      ? po.supplierId?.name || "Vendor"
                      : "Vendor";
                  const warehouseName =
                    typeof po.warehouseId === "object"
                      ? po.warehouseId?.name || "Warehouse"
                      : "Warehouse";

                  return (
                    <tr key={po._id}>
                      <td>
                        <span className="proc-code-tag">{po.poNumber}</span>
                      </td>

                      <td>
                        <div className="font-bold text-slate-900">{supplierName}</div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {po.paymentTerms || "Net 30"}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <Building2 size={14} className="text-amber-600" />
                          <span>{warehouseName}</span>
                        </div>
                      </td>

                      <td className="text-xs text-slate-600">
                        {po.expectedDeliveryDate ? (
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <Calendar size={13} className="text-slate-400" />
                            {new Date(po.expectedDeliveryDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      <td>
                        <span className="font-mono font-extrabold text-slate-900 text-sm">
                          ${(po.grandTotal || 0).toLocaleString()}
                        </span>
                      </td>

                      <td>
                        <Badge variant={getStatusBadgeVariant(po.status)} size="sm">
                          {po.status}
                        </Badge>
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Truck size={14} className="text-amber-600" />}
                            onClick={() => setTrackingPO(po)}
                          >
                            Live Track
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            icon={<PackageCheck size={14} className="text-emerald-600" />}
                            onClick={() => setGrnPO(po)}
                          >
                            GRN Inspect
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            icon={<RotateCcw size={14} className="text-rose-600" />}
                            onClick={() => setReturnPO(po)}
                          >
                            Return
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Eye size={14} />}
                            onClick={() => navigate(`/app/procurement/orders/${po._id}`)}
                          >
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Purchase Order Modal */}
      {isCreatePOModalOpen && (
        <PurchaseOrderModal
          isOpen={isCreatePOModalOpen}
          onClose={() => setIsCreatePOModalOpen(false)}
          isSubmitting={submitting}
          onSubmit={async (payload) => {
            await createPO(payload);
            setIsCreatePOModalOpen(false);
            refetch();
          }}
        />
      )}

      {/* Goods Receipt Note (GRN) Form Modal */}
      {grnPO && (
        <GRNFormModal
          isOpen={!!grnPO}
          purchaseOrder={grnPO}
          onClose={() => setGrnPO(null)}
          isSubmitting={submitting}
          onSubmit={async (payload) => {
            await createGRN(payload);
            setGrnPO(null);
            refetch();
          }}
        />
      )}

      {/* Purchase Return Modal */}
      {returnPO && (
        <PurchaseReturnModal
          isOpen={!!returnPO}
          purchaseOrder={returnPO}
          onClose={() => setReturnPO(null)}
          isSubmitting={submitting}
          onSubmit={async (payload) => {
            await createReturn(payload);
            setReturnPO(null);
            refetch();
          }}
        />
      )}

      {/* Live PO Tracker Modal */}
      {trackingPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Truck size={20} className="text-amber-600" />
                Live Purchase Order Tracking & Lifecycle
              </h3>
              <button onClick={() => setTrackingPO(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {tracking ? (
                <POLiveTracker
                  tracking={tracking}
                  onUpdateStatus={async (newStatus, comment) => {
                    await updatePOStatus(trackingPO._id, { status: newStatus, comment });
                    refetchTracking();
                    refetch();
                  }}
                  isUpdating={submitting}
                />
              ) : (
                <div className="proc-loading-box">
                  <RefreshCw className="animate-spin text-amber-600 mb-2" size={24} />
                  <p className="text-xs text-slate-500">Retrieving tracking telemetry...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrdersList;
