import React, { useState, useEffect } from "react";
import { Modal } from "../Modal";
import { Button } from "../Button";
import { api } from "../../services/api";
import type { IFactory, IFactoryUser } from "../../types/factory";
import { Users, Search, UserCheck, AlertCircle, Shield, Mail } from "lucide-react";
import "./FactoryModals.css";

interface AssignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  factory: IFactory | null;
  onSuccess?: (updated: IFactory) => void;
}

export const AssignManagerModal: React.FC<AssignManagerModalProps> = ({
  isOpen,
  onClose,
  factory,
  onSuccess,
}) => {
  const [users, setUsers] = useState<IFactoryUser[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (factory && isOpen) {
      const currentId =
        typeof factory.managerId === "object" && factory.managerId
          ? factory.managerId._id
          : typeof factory.managerId === "string"
          ? factory.managerId
          : null;
      setSelectedManagerId(currentId);
      setError(null);
      fetchUsers();
    }
  }, [factory, isOpen]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get<{ success: boolean; data: IFactoryUser[] }>("/users");
      if (response.data) {
        setUsers(response.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load company users list.");
    } finally {
      setLoadingUsers(false);
    }
  };

  if (!factory) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await api.patch<{ success: boolean; data: IFactory; message?: string }>(
        `/factories/${factory._id}/manager`,
        { managerId: selectedManagerId || null }
      );

      if (response.data && onSuccess) {
        onSuccess(response.data);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update factory manager assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Users className="text-amber-600" size={20} />
          <span>Assign Factory Manager</span>
        </div>
      }
      maxWidth="lg"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="copper" type="button" onClick={handleSubmit} loading={submitting}>
            Save Assignment
          </Button>
        </div>
      }
    >
      <div className="factory-modal-content">
        <p className="text-sm text-slate-600 mb-3">
          Select an authorized plant manager or site supervisor for <strong>{factory.name}</strong>.
        </p>

        {error && (
          <div className="factory-modal-error mb-3">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Search input */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* User Selection List */}
        <div className="manager-selection-list">
          {/* Option for Unassign */}
          <div
            className={`manager-user-card ${selectedManagerId === null ? "selected" : ""}`}
            onClick={() => setSelectedManagerId(null)}
          >
            <div className="user-avatar unassigned">
              <Users size={18} />
            </div>
            <div className="user-info">
              <span className="user-name">Unassigned</span>
              <span className="user-email text-xs text-slate-500">Leave this factory site without an assigned manager</span>
            </div>
            {selectedManagerId === null && <UserCheck size={18} className="text-amber-600 ml-auto" />}
          </div>

          {loadingUsers ? (
            <div className="py-6 text-center text-sm text-slate-500">Loading users catalog...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">No matching users found.</div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedManagerId === user._id;
              const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
              return (
                <div
                  key={user._id}
                  className={`manager-user-card ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedManagerId(user._id)}
                >
                  <div className="user-avatar">{initials}</div>
                  <div className="user-info">
                    <span className="user-name">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="user-email">
                      <Mail size={12} className="inline mr-1" />
                      {user.email}
                    </span>
                  </div>
                  {user.role && (
                    <span className="user-role-tag">
                      <Shield size={10} className="inline mr-1" />
                      {user.role}
                    </span>
                  )}
                  {isSelected && <UserCheck size={18} className="text-amber-600 ml-auto" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AssignManagerModal;
