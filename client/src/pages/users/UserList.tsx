import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import type { IUser, UserStatus } from "../../types/user";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import InviteUserModal from "../../components/users/InviteUserModal";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Plus,
  Send,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Clock,
  Shield,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import "./UserPages.css";

export const UserList: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Filters & Pagination
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [statusModalUser, setStatusModalUser] = useState<IUser | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<IUser | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const fetchUsers = async (searchQuery = search) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 12,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (roleFilter && roleFilter !== "ALL") {
        params.role = roleFilter;
      }
      if (statusFilter && statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      const response = await api.get<{
        success: boolean;
        data: IUser[];
        pagination: { total: number; page: number; totalPages: number };
      }>("/users", { params });

      if (response.data) {
        setUsers(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          const totalCount = response.pagination.total || response.data.length;
          const activeCount = response.data.filter((u) => u.status === "active").length;
          const inactiveCount = response.data.filter((u) => u.status === "inactive").length;

          setStats({
            total: totalCount,
            active: activeCount,
            inactive: inactiveCount,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load user directory.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(search);
  };

  const handleToggleStatusConfirm = async () => {
    if (!statusModalUser) return;
    setUpdatingStatus(true);
    try {
      const newStatus: UserStatus = statusModalUser.status === "active" ? "inactive" : "active";
      await api.patch(`/users/${statusModalUser._id}/status`, { status: newStatus });
      
      setUsers((prev) =>
        prev.map((u) => (u._id === statusModalUser._id ? { ...u, status: newStatus } : u))
      );
      setStatusModalUser(null);
    } catch (err: any) {
      alert(err.message || "Failed to update user status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalUser) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteModalUser._id}`);
      setDeleteModalUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    const f = firstName ? firstName.charAt(0).toUpperCase() : "";
    const l = lastName ? lastName.charAt(0).toUpperCase() : "";
    return `${f}${l}` || "U";
  };

  const getRoleBadgeColor = (role?: string) => {
    const r = (role || "").toLowerCase();
    if (r.includes("admin")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (r.includes("manager")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (r.includes("supervisor")) return "bg-amber-100 text-amber-800 border-amber-200";
    if (r.includes("operator")) return "bg-teal-100 text-teal-800 border-teal-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <div className="user-page-container">
      {/* Page Header */}
      <div className="user-page-header">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Module 7</span>
            <span>•</span>
            <span>Digital Industrial System</span>
          </div>
          <h1 className="user-page-title">
            <Users className="text-amber-600 inline mr-2" size={28} />
            User Management
          </h1>
          <p className="user-page-subtitle">
            Manage company workspace accounts, RBAC assigned roles, invitation links, and user activity history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={<Send size={16} />}
            onClick={() => setIsInviteModalOpen(true)}
          >
            Invite Member
          </Button>
          <Button
            variant="copper"
            icon={<Plus size={18} />}
            onClick={() => navigate("/app/users/new")}
          >
            Add User
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="user-stats-grid">
        <div className="user-stat-card">
          <div className="user-stat-icon copper">
            <Users size={22} />
          </div>
          <div>
            <div className="user-stat-val">{stats.total}</div>
            <div className="user-stat-lbl">Total Users</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon emerald">
            <UserCheck size={22} />
          </div>
          <div>
            <div className="user-stat-val">{stats.active}</div>
            <div className="user-stat-lbl">Active Accounts</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon rose">
            <UserX size={22} />
          </div>
          <div>
            <div className="user-stat-val">{stats.inactive}</div>
            <div className="user-stat-lbl">Deactivated</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon purple">
            <Shield size={22} />
          </div>
          <div>
            <div className="user-stat-val">RBAC</div>
            <div className="user-stat-lbl">Role Control</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters & View Toggle */}
      <div className="user-control-bar">
        <form onSubmit={handleSearchSubmit} className="user-search-form">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by user name or email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="user-search-input"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="user-filters-group">
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="user-select-filter"
            >
              <option value="ALL">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Operator">Operator</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="user-select-filter"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="user-view-toggle">
            <button
              className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid Card View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2 mb-4">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => fetchUsers()} className="underline ml-auto font-semibold text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="user-loading-box">
          <RefreshCw className="animate-spin text-amber-600 mb-2" size={32} />
          <p className="text-slate-600 font-medium">Loading workspace users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="user-empty-box">
          <Users size={48} className="text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Users Found</h3>
          <p className="text-slate-500 text-sm max-w-md text-center mt-1 mb-4">
            {search || roleFilter !== "ALL" || statusFilter !== "ALL"
              ? "No team members match your active search filters."
              : "Get started by inviting or adding your first user account."}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Send size={16} />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Invite Member
            </Button>
            <Button
              variant="copper"
              icon={<Plus size={16} />}
              onClick={() => navigate("/app/users/new")}
            >
              Add User
            </Button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Card View */
        <div className="user-grid">
          {users.map((user) => (
            <div key={user._id} className="user-card">
              <div className="user-card-header">
                <div className="user-avatar">
                  {getInitials(user.firstName, user.lastName)}
                </div>
                <div className="overflow-hidden">
                  <h3
                    className="user-card-name hover:text-amber-600 cursor-pointer truncate"
                    onClick={() => navigate(`/app/users/${user._id}`)}
                  >
                    {user.firstName} {user.lastName}
                  </h3>
                  <div className="user-card-email truncate">{user.email}</div>
                </div>
              </div>

              <div className="user-card-body">
                <div className="user-meta-row">
                  <span className="text-slate-400 flex items-center gap-1 text-xs">
                    <Shield size={14} /> Role:
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                    {user.role || "Employee"}
                  </span>
                </div>

                <div className="user-meta-row">
                  <span className="text-slate-400 flex items-center gap-1 text-xs">
                    <Clock size={14} /> Status:
                  </span>
                  <Badge
                    variant={user.status === "active" ? "active" : "inactive"}
                    size="sm"
                  >
                    {user.status}
                  </Badge>
                </div>

                {user.phone && (
                  <div className="user-meta-row">
                    <span className="text-slate-400 flex items-center gap-1 text-xs">Phone:</span>
                    <span className="font-mono text-slate-700 text-xs">{user.phone}</span>
                  </div>
                )}
              </div>

              <div className="user-card-footer">
                <button
                  className="card-action-btn primary"
                  onClick={() => navigate(`/app/users/${user._id}`)}
                  title="View User Profile"
                >
                  <Eye size={15} />
                  <span>View</span>
                </button>

                <button
                  className="card-action-btn"
                  onClick={() => navigate(`/app/users/${user._id}/edit`)}
                  title="Edit User"
                >
                  <Edit size={15} />
                  <span>Edit</span>
                </button>

                <button
                  className="card-action-btn"
                  onClick={() => setStatusModalUser(user)}
                  title="Toggle Active/Inactive"
                >
                  {user.status === "active" ? <ToggleRight size={15} className="text-emerald-600" /> : <ToggleLeft size={15} className="text-slate-400" />}
                  <span>Status</span>
                </button>

                <button
                  className="card-action-btn danger"
                  onClick={() => setDeleteModalUser(user)}
                  title="Delete Account"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="user-table-card">
          <table className="diws-table">
            <thead>
              <tr>
                <th>User Profile</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Phone</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="user-avatar text-xs w-8 h-8">
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div>
                        <div
                          className="font-bold text-slate-900 hover:text-amber-600 cursor-pointer"
                          onClick={() => navigate(`/app/users/${user._id}`)}
                        >
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-slate-700 text-sm font-mono">{user.email}</span>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                      {user.role || "Employee"}
                    </span>
                  </td>
                  <td>
                    <Badge variant={user.status === "active" ? "active" : "inactive"} size="sm">
                      {user.status}
                    </Badge>
                  </td>
                  <td>
                    <span className="text-xs text-slate-600 font-mono">{user.phone || "—"}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="table-action-icon"
                        onClick={() => navigate(`/app/users/${user._id}`)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="table-action-icon"
                        onClick={() => navigate(`/app/users/${user._id}/edit`)}
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="table-action-icon"
                        onClick={() => setStatusModalUser(user)}
                        title="Toggle Status"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        className="table-action-icon text-rose-600 hover:bg-rose-50"
                        onClick={() => setDeleteModalUser(user)}
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages} ({stats.total} total members)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => fetchUsers()}
      />

      {/* Status Toggle Modal */}
      {statusModalUser && (
        <Modal
          isOpen={!!statusModalUser}
          onClose={() => setStatusModalUser(null)}
          title="Update Account Status"
          maxWidth="sm"
          footer={
            <div className="flex justify-end gap-3 w-full">
              <Button
                variant="outline"
                type="button"
                onClick={() => setStatusModalUser(null)}
                disabled={updatingStatus}
              >
                Cancel
              </Button>
              <Button
                variant="copper"
                type="button"
                onClick={handleToggleStatusConfirm}
                loading={updatingStatus}
              >
                Confirm Status Update
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-700">
              Change account status for <strong>{statusModalUser.firstName} {statusModalUser.lastName}</strong> from{" "}
              <span className="font-semibold">{statusModalUser.status}</span> to{" "}
              <span className="font-bold text-amber-700">
                {statusModalUser.status === "active" ? "inactive" : "active"}
              </span>?
            </p>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalUser && (
        <Modal
          isOpen={!!deleteModalUser}
          onClose={() => setDeleteModalUser(null)}
          title="Delete User Account"
          maxWidth="sm"
          footer={
            <div className="flex justify-end gap-3 w-full">
              <Button
                variant="outline"
                type="button"
                onClick={() => setDeleteModalUser(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                type="button"
                onClick={handleDeleteConfirm}
                loading={deleting}
              >
                Confirm Delete
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-700">
              Are you sure you want to delete <strong>{deleteModalUser.firstName} {deleteModalUser.lastName}</strong> ({deleteModalUser.email})?
            </p>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              Warning: Deleting this user account will revoke access to the workspace immediately.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserList;
