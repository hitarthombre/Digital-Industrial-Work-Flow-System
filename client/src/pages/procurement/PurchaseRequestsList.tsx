import React, { useState } from "react";
import { usePurchaseRequests, useProcurementMutations } from "../../hooks/useProcurement";
import type { IPurchaseRequest, PRStatus, PRPriority } from "../../types/procurement";
import { PurchaseRequestModal } from "../../components/procurement/PurchaseRequestModal";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileCheck,
  Eye,
  Building2,
} from "lucide-react";
import "./ProcurementPages.css";

export const PurchaseRequestsList: React.FC = () => {
  const { user } = useAuth();

  // Filter States
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPRToView, setSelectedPRToView] = useState<IPurchaseRequest | null>(null);

  const { requests, loading, refetch } = usePurchaseRequests({
    status: activeTab === "ALL" ? undefined : activeTab,
  });

  const { submitting, createPR, approvePR } = useProcurementMutations();

  // RBAC Permission Check for Approval Controls
  const userRole = (user?.role || "").toLowerCase();
  const canApprovePR =
    userRole.includes("admin") ||
    userRole.includes("manager") ||
    userRole.includes("procurement") ||
    userRole.includes("approver") ||
    userRole === ""; // Demo open access

  // Filter logic
  const filteredRequests = requests.filter((pr) => {
    if (activeTab !== "ALL" && pr.status !== activeTab) return false;
    if (priorityFilter !== "ALL" && pr.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = pr.prNumber.toLowerCase().includes(q);
      const matchUser =
        typeof pr.requestedBy === "object"
          ? `${pr.requestedBy?.firstName} ${pr.requestedBy?.lastName}`.toLowerCase().includes(q)
          : String(pr.requestedBy).toLowerCase().includes(q);
      const matchDept = (pr.department || "").toLowerCase().includes(q);
      if (!matchNumber && !matchUser && !matchDept) return false;
    }
    return true;
  });

  const getStatusBadgeVariant = (status: PRStatus) => {
    switch (status) {
      case "Approved":
        return "active";
      case "Submitted":
        return "maintenance";
      case "Draft":
        return "inactive";
      case "Rejected":
        return "closed";
      default:
        return "neutral";
    }
  };

  const getPriorityBadgeClass = (priority: PRPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-100 text-rose-800 border-rose-300 font-extrabold";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300 font-bold";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-300 font-semibold";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="proc-page-container">
      {/* Top Header */}
      <div className="proc-header">
        <div>
          <h1 className="proc-page-title">
            <ShoppingCart className="text-amber-600" size={28} />
            Purchase Requests (PR)
          </h1>
          <p className="proc-page-subtitle">
            Manage material requisitions, track approval workflows, and convert approved requests into POs.
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
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Purchase Request
          </Button>
        </div>
      </div>

      {/* Sub-nav Status Tabs */}
      <div className="proc-tabs-bar">
        {["ALL", "Submitted", "Approved", "Draft", "Rejected"].map((tab) => (
          <button
            key={tab}
            className={`proc-tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            <span>{tab === "ALL" ? "All Requisitions" : tab}</span>
            <span className="ml-1 text-[11px] bg-slate-100 px-1.5 py-0.2 rounded-full font-bold">
              {tab === "ALL" ? requests.length : requests.filter((r) => r.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter Controls */}
      <div className="proc-filter-bar">
        <div className="proc-search-box">
          <Search size={16} className="proc-search-icon" />
          <input
            type="text"
            placeholder="Search by PR number, requester, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="proc-search-input"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-600 uppercase">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="proc-select-filter"
            >
              <option value="ALL">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requisitions List Table */}
      <div className="proc-card p-0 overflow-hidden">
        {loading ? (
          <div className="proc-loading-box">
            <RefreshCw className="animate-spin text-amber-600 mb-2" size={28} />
            <p className="text-xs text-slate-500">Loading purchase requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="proc-empty-box">
            <ShoppingCart size={40} className="text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Purchase Requests Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              There are no purchase requests matching your selected filters. Create a new request to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="proc-table">
              <thead>
                <tr>
                  <th>PR #</th>
                  <th>Requester & Dept</th>
                  <th>Destination Warehouse</th>
                  <th>Priority</th>
                  <th>Total Est. Cost</th>
                  <th>Status</th>
                  <th>Required Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((pr) => {
                  const requesterName =
                    typeof pr.requestedBy === "object"
                      ? `${pr.requestedBy?.firstName || ""} ${pr.requestedBy?.lastName || ""}`.trim()
                      : pr.requestedBy || "User";

                  const warehouseName =
                    typeof pr.warehouseId === "object"
                      ? pr.warehouseId?.name
                      : "Warehouse";

                  return (
                    <tr key={pr._id}>
                      <td>
                        <span className="proc-code-tag">{pr.prNumber}</span>
                      </td>

                      <td>
                        <div className="font-bold text-slate-900">{requesterName}</div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {pr.department || "General Procurement"}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <Building2 size={14} className="text-amber-600" />
                          <span>{warehouseName}</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getPriorityBadgeClass(
                            pr.priority
                          )}`}
                        >
                          {pr.priority}
                        </span>
                      </td>

                      <td>
                        <span className="font-mono font-extrabold text-slate-900 text-sm">
                          ${(pr.totalEstimatedCost || 0).toLocaleString()}
                        </span>
                      </td>

                      <td>
                        <Badge variant={getStatusBadgeVariant(pr.status)} size="sm">
                          {pr.status}
                        </Badge>
                      </td>

                      <td className="text-xs text-slate-600">
                        {pr.requiredByDate
                          ? new Date(pr.requiredByDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Eye size={14} />}
                            onClick={() => setSelectedPRToView(pr)}
                          >
                            View & Review
                          </Button>

                          {canApprovePR && pr.status === "Submitted" && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<FileCheck size={14} />}
                              onClick={() => setSelectedPRToView(pr)}
                            >
                              Approve
                            </Button>
                          )}
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

      {/* Create Purchase Request Modal */}
      {isCreateModalOpen && (
        <PurchaseRequestModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          isSubmitting={submitting}
          onCreateSubmit={async (payload) => {
            await createPR(payload);
            setIsCreateModalOpen(false);
            refetch();
          }}
        />
      )}

      {/* View & Review Purchase Request Modal */}
      {selectedPRToView && (
        <PurchaseRequestModal
          isOpen={!!selectedPRToView}
          requestToView={selectedPRToView}
          onClose={() => setSelectedPRToView(null)}
          isSubmitting={submitting}
          onApproveSubmit={async (id, payload) => {
            await approvePR(id, payload);
            setSelectedPRToView(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default PurchaseRequestsList;
