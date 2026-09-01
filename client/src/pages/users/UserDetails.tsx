import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import type { IUser } from "../../types/user";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import UserActivityTimeline from "../../components/users/UserActivityTimeline";
import {
  User,
  ArrowLeft,
  Shield,
  Edit,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Activity,
  Key,
} from "lucide-react";
import "./UserPages.css";

export const UserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{
        success: boolean;
        data: IUser;
      }>(`/users/${id}`);

      if (response.data) {
        setUser(response.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load user details.");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName ? firstName.charAt(0).toUpperCase() : "";
    const l = lastName ? lastName.charAt(0).toUpperCase() : "";
    return `${f}${l}` || "U";
  };

  if (loading) {
    return (
      <div className="user-page-container flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="animate-spin text-amber-600 mb-3" size={36} />
        <p className="text-slate-600 font-medium text-sm">Fetching user account profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="user-page-container">
        <button
          onClick={() => navigate("/app/users")}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-amber-700 mb-4 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Users Directory
        </button>
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex flex-col items-center text-center">
          <AlertTriangle size={36} className="mb-2 text-rose-600" />
          <h3 className="font-bold text-lg">User Profile Not Found</h3>
          <p className="text-xs text-rose-600 mt-1 mb-4">{error || "User record does not exist or access is restricted."}</p>
          <Button variant="copper" onClick={() => navigate("/app/users")}>
            Return to User Directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-page-container">
      {/* Top Navigation */}
      <button
        onClick={() => navigate("/app/users")}
        className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-amber-700 mb-4 cursor-pointer transition"
      >
        <ArrowLeft size={14} /> Back to Users Directory
      </button>

      {/* Main Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {getInitials(user.firstName, user.lastName)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900">
                {user.firstName} {user.lastName}
              </h1>
              <Badge variant={user.status === "active" ? "active" : "inactive"} size="md">
                {user.status}
              </Badge>
            </div>
            <p className="text-slate-500 text-sm font-mono mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={<Edit size={16} />}
            onClick={() => navigate(`/app/users/${user._id}/edit`)}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer ${
            activeTab === "overview"
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Account Overview
        </button>
        <button
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === "activity"
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("activity")}
        >
          <Activity size={14} />
          Activity & Audit Logs
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 & 2: Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <User size={14} className="text-amber-600" /> Member Identity & Contact Info
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block uppercase">First Name</span>
                  <span className="font-bold text-slate-800">{user.firstName}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block uppercase">Last Name</span>
                  <span className="font-bold text-slate-800">{user.lastName}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block uppercase">Email Address</span>
                  <span className="font-mono text-slate-800">{user.email}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block uppercase">Phone Contact</span>
                  <span className="font-mono text-slate-800">{user.phone || "Not specified"}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Shield size={14} className="text-amber-600" /> Governance & Security Scope
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block uppercase">Assigned Role</span>
                  <span className="inline-block mt-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md font-bold text-amber-800 text-xs">
                    {user.role || "Employee"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block uppercase">Department Assignment</span>
                  <span className="font-medium text-slate-800">
                    {typeof user.departmentId === "object" && user.departmentId
                      ? user.departmentId.name
                      : user.departmentId || "General Workspace"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block uppercase">Email Verification</span>
                  <span className="flex items-center gap-1 font-semibold text-xs mt-1 text-emerald-700">
                    <CheckCircle2 size={14} /> Verified Account
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block uppercase">Member Since</span>
                  <span className="font-mono text-slate-700 text-xs">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Quick Stats & Card */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                <Key size={14} /> Account Status
              </h4>
              <p className="text-xs text-slate-300 mb-4">
                User holds active credentials under role <strong>{user.role || "Employee"}</strong>.
              </p>
              <div className="pt-3 border-t border-slate-700 text-xs text-slate-400">
                Workspace Isolation: <span className="text-white font-semibold">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Activity Log */}
      {activeTab === "activity" && id && (
        <UserActivityTimeline userId={id} />
      )}
    </div>
  );
};

export default UserDetails;
