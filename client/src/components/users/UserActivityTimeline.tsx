import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import type { IUserActivity } from "../../types/user";
import {
  Clock,
  UserCheck,
  UserX,
  Edit,
  Shield,
  LogIn,
  Send,
  Activity,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface UserActivityTimelineProps {
  userId: string;
}

export const UserActivityTimeline: React.FC<UserActivityTimelineProps> = ({ userId }) => {
  const [activities, setActivities] = useState<IUserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchActivityHistory();
    }
  }, [userId, page]);

  const fetchActivityHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{
        success: boolean;
        data: IUserActivity[];
        pagination?: { total: number; page: number; totalPages: number };
      }>(`/users/${userId}/activity`, {
        params: { page, limit: 10 },
      });

      if (response.data) {
        setActivities(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalCount(response.pagination.total || response.data.length);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load user activity timeline.");
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("login") || act.includes("auth")) {
      return <LogIn size={16} className="text-emerald-600" />;
    }
    if (act.includes("invite")) {
      return <Send size={16} className="text-blue-600" />;
    }
    if (act.includes("status")) {
      return <RefreshCw size={16} className="text-amber-600" />;
    }
    if (act.includes("role") || act.includes("permission")) {
      return <Shield size={16} className="text-purple-600" />;
    }
    if (act.includes("update") || act.includes("edit")) {
      return <Edit size={16} className="text-cyan-600" />;
    }
    if (act.includes("activate")) {
      return <UserCheck size={16} className="text-emerald-600" />;
    }
    if (act.includes("deactivate") || act.includes("delete")) {
      return <UserX size={16} className="text-rose-600" />;
    }
    return <Activity size={16} className="text-slate-600" />;
  };

  const formatActionTitle = (action: string) => {
    const parts = action.split(":");
    if (parts.length > 1) {
      return `${parts[0].toUpperCase()} - ${parts[1].replace(/_/g, " ").toUpperCase()}`;
    }
    return action.replace(/_/g, " ").toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
    } catch (_) {
      return { date: dateStr, time: "" };
    }
  };

  return (
    <div className="user-timeline-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Clock size={16} className="text-amber-600" />
          Activity & Audit Log
        </h3>
        <button
          onClick={() => fetchActivityHistory()}
          className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">
          <RefreshCw size={24} className="animate-spin text-amber-600 mx-auto mb-2" />
          Loading audit events...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Activity size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-slate-600">No activity logs recorded yet</p>
          <p className="text-xs text-slate-400 mt-1">Actions performed by or on this user will appear here.</p>
        </div>
      ) : (
        <div className="timeline-list">
          {activities.map((act) => {
            const { date, time } = formatDate(act.createdAt);
            return (
              <div key={act._id} className="timeline-item">
                <div className="timeline-badge">{getActionIcon(act.action)}</div>
                <div className="timeline-content">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{formatActionTitle(act.action)}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {date} at {time}
                    </span>
                  </div>

                  {act.module && (
                    <span className="inline-block mt-1 text-[10px] uppercase font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      Module: {act.module}
                    </span>
                  )}

                  {act.after && Object.keys(act.after).length > 0 && (
                    <div className="mt-2 text-xs bg-slate-50 p-2 rounded border border-slate-200 text-slate-600 font-mono">
                      {Object.entries(act.after).map(([k, v]) => (
                        <div key={k} className="truncate">
                          <span className="text-slate-400">{k}:</span> {typeof v === "object" ? JSON.stringify(v) : String(v)}
                        </div>
                      ))}
                    </div>
                  )}

                  {act.ipAddress && (
                    <div className="mt-1 text-[11px] text-slate-400">
                      IP: <span className="font-mono">{act.ipAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Page {page} of {totalPages} ({totalCount} items)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium disabled:opacity-50 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserActivityTimeline;
