import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { notificationApi } from "../services/operationsService";
import type { INotification } from "../types/operations";
import { timeAgo } from "../utils/format";

const POLL_MS = 60000;

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<INotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refreshCount = useCallback(() => {
    notificationApi
      .unreadCount()
      .then((res) => setUnread(res.data.count))
      .catch(() => undefined);
  }, []);

  const loadLatest = useCallback(() => {
    notificationApi
      .list({ limit: 8 })
      .then((res) => {
        setItems(res.data);
        setUnread(res.unread);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    if (open) loadLatest();
  }, [open, loadLatest]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openItem = async (n: INotification) => {
    if (n.status === "unread") {
      await notificationApi.markRead(n._id).catch(() => undefined);
      setUnread((u) => Math.max(u - 1, 0));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    await notificationApi.markAllRead().catch(() => undefined);
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, status: "read" })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="diws-header-icon-btn relative"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-900">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {error ? (
              <p className="text-xs text-rose-600 p-4">{error}</p>
            ) : items.length === 0 ? (
              <p className="text-xs text-slate-500 p-6 text-center">You're all caught up.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => openItem(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 flex gap-2 ${n.status === "unread" ? "bg-amber-50/50" : ""}`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.status === "unread" ? "bg-amber-500" : "bg-transparent"}`} />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-900">{n.title}</span>
                    <span className="block text-[11px] text-slate-600 line-clamp-2">{n.message}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <Link to="/app/notifications" onClick={() => setOpen(false)} className="block text-center text-xs font-bold text-amber-700 py-2.5 border-t border-slate-100 hover:bg-slate-50">
            View notification history
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
