import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, RefreshCw, Trash2, AlarmClock } from "lucide-react";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, LoadingBox, EmptyBox, ErrorBanner, Pager, TabBar } from "../../components/ops/OpsUI";
import { useApiQuery, useMutation } from "../../hooks/useApiQuery";
import { notificationApi } from "../../services/operationsService";
import type { INotification } from "../../types/operations";
import { formatDateTime, humanize } from "../../utils/format";
import "../procurement/ProcurementPages.css";

const TYPES = [
  { key: "", label: "All" },
  { key: "order_status", label: "Order status" },
  { key: "task_reminder", label: "Reminders" },
  { key: "low_stock", label: "Low stock" },
  { key: "dispatch_update", label: "Dispatch" },
  { key: "production_update", label: "Production" },
];

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [type, setType] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const action = useMutation();

  const params = { type: type || undefined, status: unreadOnly ? "unread" : undefined, page, limit: 20 };
  const list = useApiQuery(() => notificationApi.list(params), [params]);
  const isAdmin = user?.role === "Company Owner" || user?.role === "Company Admin";

  const open = async (n: INotification) => {
    if (n.status === "unread") await notificationApi.markRead(n._id).catch(() => undefined);
    if (n.link) navigate(n.link);
    else list.refetch();
  };

  const runReminders = async () => {
    const res = await action.mutate(() => notificationApi.runReminders()).catch(() => null);
    if (res) {
      setNotice(`Checked ${res.data.checked} open item(s); sent ${res.data.sent} new reminder(s).`);
      list.refetch();
    }
  };

  return (
    <div className="proc-page-container">
      <PageHeader
        icon={<Bell className="text-amber-600" size={28} />}
        title="Notifications"
        subtitle="Order status alerts, task reminders and system notices."
        actions={
          <>
            {isAdmin && (
              <Button variant="outline" size="sm" icon={<AlarmClock size={14} />} onClick={runReminders} loading={action.submitting}>
                Check Reminders Now
              </Button>
            )}
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={list.refetch}>
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCheck size={14} />}
              onClick={async () => {
                await action.mutate(() => notificationApi.markAllRead()).catch(() => undefined);
                list.refetch();
              }}
              disabled={!list.data?.unread}
            >
              Mark All Read
            </Button>
          </>
        }
      />

      <TabBar
        active={type}
        onChange={(k) => {
          setType(k);
          setPage(1);
        }}
        tabs={TYPES.map((t) => ({ key: t.key, label: t.label }))}
      />

      <label className="flex items-center gap-2 text-xs text-slate-600 mb-3">
        <input type="checkbox" checked={unreadOnly} onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1); }} />
        Unread only {list.data ? `(${list.data.unread} unread)` : ""}
      </label>

      {notice && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs mb-4">{notice}</div>}
      <ErrorBanner message={list.error || action.error} onRetry={list.refetch} />

      <div className="proc-card p-0 overflow-hidden">
        {list.loading && !list.data ? (
          <LoadingBox label="Loading notifications..." />
        ) : !list.data?.data.length ? (
          <EmptyBox icon={<Bell size={40} />} title="No notifications" message="Order updates and reminders will appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.data.data.map((n) => (
              <li key={n._id} className={`flex items-start gap-3 px-4 py-3 ${n.status === "unread" ? "bg-amber-50/40" : ""}`}>
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.status === "unread" ? "bg-amber-500" : "bg-slate-200"}`} />
                <button type="button" className="flex-1 text-left min-w-0" onClick={() => open(n)}>
                  <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                  <div className="text-xs text-slate-600">{n.message}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {humanize(n.type)} · {formatDateTime(n.createdAt)}
                  </div>
                </button>
                <button
                  type="button"
                  className="p-1.5 text-slate-300 hover:text-rose-600"
                  title="Dismiss"
                  onClick={async () => {
                    await notificationApi.dismiss(n._id).catch(() => undefined);
                    list.refetch();
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {list.data?.pagination && <Pager {...list.data.pagination} page={page} onChange={setPage} />}
      </div>
    </div>
  );
};

export default NotificationsPage;
