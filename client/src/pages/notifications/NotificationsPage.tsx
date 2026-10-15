import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Trash2,
  AlarmClock,
  KeyRound,
  Mail,
  AlertTriangle,
  Truck,
  ShoppingBag,
  Factory,
  Copy,
  ExternalLink,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, LoadingBox, EmptyBox, ErrorBanner, Pager, TabBar } from "../../components/ops/OpsUI";
import { useApiQuery, useMutation } from "../../hooks/useApiQuery";
import { notificationApi } from "../../services/operationsService";
import type { INotification } from "../../types/operations";
import { formatDateTime, humanize } from "../../utils/format";
import { parseNotification, type ParsedNotification } from "../../utils/notificationParser";
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
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const action = useMutation();

  const params = { type: type || undefined, status: unreadOnly ? "unread" : undefined, page, limit: 20 };
  const list = useApiQuery(() => notificationApi.list(params), [params]);
  const isAdmin = user?.role === "Company Owner" || user?.role === "Company Admin";

  const open = async (n: INotification, parsed: ParsedNotification) => {
    if (n.status === "unread") await notificationApi.markRead(n._id).catch(() => undefined);
    if (parsed.actionUrl) {
      if (parsed.isExternalLink) {
        window.open(parsed.actionUrl, "_blank", "noopener,noreferrer");
      } else {
        navigate(parsed.actionUrl);
      }
    } else {
      list.refetch();
    }
  };

  const copyToken = (e: React.MouseEvent, token: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  const runReminders = async () => {
    const res = await action.mutate(() => notificationApi.runReminders()).catch(() => null);
    if (res) {
      setNotice(`Checked ${res.data.checked} open item(s); sent ${res.data.sent} new reminder(s).`);
      list.refetch();
    }
  };

  const renderCategoryIcon = (category: ParsedNotification["category"]) => {
    switch (category) {
      case "security":
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <KeyRound size={17} />
          </div>
        );
      case "email":
        return (
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
            <Mail size={17} />
          </div>
        );
      case "stock":
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
            <AlertTriangle size={17} />
          </div>
        );
      case "dispatch":
        return (
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
            <Truck size={17} />
          </div>
        );
      case "order":
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <ShoppingBag size={17} />
          </div>
        );
      case "production":
        return (
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
            <Factory size={17} />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
            <Bell size={17} />
          </div>
        );
    }
  };

  return (
    <div className="proc-page-container">
      <PageHeader
        icon={<Bell className="text-amber-600" size={28} />}
        title="Notifications"
        subtitle="Order status alerts, security notices, task reminders and system events."
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
            {list.data.data.map((n) => {
              const parsed = parseNotification(n);
              const isUnread = n.status === "unread";

              return (
                <li
                  key={n._id}
                  className={`flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-slate-50/60 ${
                    isUnread ? "bg-amber-50/35" : ""
                  }`}
                >
                  {/* Category Icon */}
                  {renderCategoryIcon(parsed.category)}

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{parsed.cleanTitle}</span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block ring-2 ring-amber-200" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {humanize(n.type)} · {formatDateTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">
                      {parsed.cleanMessage}
                    </p>

                    {/* Security / Verification Token pill */}
                    {parsed.token && (
                      <div
                        className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-700 cursor-pointer"
                        onClick={(e) => copyToken(e, parsed.token!, n._id)}
                        title="Click to copy security token"
                      >
                        <span className="text-slate-400 font-mono text-[11px]">Token:</span>
                        <span className="font-mono text-slate-800">{parsed.token}</span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-800 ml-1.5"
                        >
                          {copiedTokenId === n._id ? (
                            <>
                              <Check size={12} className="text-emerald-600" />
                              <span className="text-emerald-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Action button if actionable */}
                    {parsed.actionUrl && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => open(n, parsed)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-all"
                        >
                          <span>{parsed.actionLabel}</span>
                          {parsed.isExternalLink ? <ExternalLink size={12} /> : <ArrowRight size={12} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dismiss */}
                  <button
                    type="button"
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors ml-2"
                    title="Dismiss"
                    onClick={async () => {
                      await notificationApi.dismiss(n._id).catch(() => undefined);
                      list.refetch();
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {list.data?.pagination && <Pager {...list.data.pagination} page={page} onChange={setPage} />}
      </div>
    </div>
  );
};

export default NotificationsPage;
