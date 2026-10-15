import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Check,
  KeyRound,
  Mail,
  AlertTriangle,
  Truck,
  ShoppingBag,
  Factory,
  Copy,
  ExternalLink,
  ArrowRight,
  Trash2,
  Clock,
  Sparkles,
} from "lucide-react";
import { notificationApi } from "../services/operationsService";
import type { INotification } from "../types/operations";
import { timeAgo } from "../utils/format";
import { parseNotification, type ParsedNotification } from "../utils/notificationParser";
import "./NotificationBell.css";

const POLL_MS = 60000;

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<INotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const refreshCount = useCallback(() => {
    notificationApi
      .unreadCount()
      .then((res) => setUnread(res.data.count))
      .catch(() => undefined);
  }, []);

  const loadLatest = useCallback(() => {
    setLoading(true);
    notificationApi
      .list({ limit: 12 })
      .then((res) => {
        setItems(res.data);
        setUnread(res.unread);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    if (open) {
      loadLatest();
    }
  }, [open, loadLatest]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openItem = async (n: INotification, parsed: ParsedNotification) => {
    if (n.status === "unread") {
      await notificationApi.markRead(n._id).catch(() => undefined);
      setUnread((u) => Math.max(u - 1, 0));
      setItems((prev) =>
        prev.map((item) => (item._id === n._id ? { ...item, status: "read" } : item))
      );
    }
    setOpen(false);

    if (parsed.actionUrl) {
      if (parsed.isExternalLink) {
        window.open(parsed.actionUrl, "_blank", "noopener,noreferrer");
      } else {
        navigate(parsed.actionUrl);
      }
    }
  };

  const handleActionClick = async (
    e: React.MouseEvent,
    n: INotification,
    parsed: ParsedNotification
  ) => {
    e.stopPropagation();
    await openItem(n, parsed);
  };

  const markItemRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await notificationApi.markRead(id).catch(() => undefined);
    setItems((prev) =>
      prev.map((item) => (item._id === id ? { ...item, status: "read" } : item))
    );
    setUnread((u) => Math.max(u - 1, 0));
  };

  const dismissItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await notificationApi.dismiss(id).catch(() => undefined);
    setItems((prev) => prev.filter((item) => item._id !== id));
    refreshCount();
  };

  const markAll = async () => {
    await notificationApi.markAllRead().catch(() => undefined);
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, status: "read" })));
  };

  const copyToken = (e: React.MouseEvent, token: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  const displayedItems =
    filter === "unread" ? items.filter((n) => n.status === "unread") : items;

  const renderCategoryIcon = (category: ParsedNotification["category"]) => {
    switch (category) {
      case "security":
        return (
          <div className="diws-notif-icon security">
            <KeyRound size={17} />
          </div>
        );
      case "email":
        return (
          <div className="diws-notif-icon email">
            <Mail size={17} />
          </div>
        );
      case "stock":
        return (
          <div className="diws-notif-icon stock">
            <AlertTriangle size={17} />
          </div>
        );
      case "dispatch":
        return (
          <div className="diws-notif-icon dispatch">
            <Truck size={17} />
          </div>
        );
      case "order":
        return (
          <div className="diws-notif-icon order">
            <ShoppingBag size={17} />
          </div>
        );
      case "production":
        return (
          <div className="diws-notif-icon production">
            <Factory size={17} />
          </div>
        );
      default:
        return (
          <div className="diws-notif-icon system">
            <Bell size={17} />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button Trigger */}
      <button
        type="button"
        className="diws-header-icon-btn relative"
        style={{
          background: open ? "rgba(255, 255, 255, 0.15)" : undefined,
          borderRadius: "8px",
          transition: "background-color 0.2s ease",
        }}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell size={19} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              minWidth: "17px",
              height: "17px",
              padding: "0 4px",
              borderRadius: "10px",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              fontSize: "10px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Modern DIWS Notification Dropdown */}
      {open && (
        <div className="diws-notif-dropdown">
          {/* Header */}
          <div className="diws-notif-header">
            <div className="diws-notif-header-left">
              <div className="diws-notif-header-icon">
                <Bell size={16} />
              </div>
              <div className="diws-notif-title">
                Notifications
                {unread > 0 && <span className="diws-notif-badge">{unread} new</span>}
              </div>
            </div>

            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="diws-notif-markall-btn"
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="diws-notif-tabs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`diws-notif-tab ${filter === "all" ? "active" : ""}`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`diws-notif-tab ${filter === "unread" ? "active" : ""}`}
            >
              Unread ({unread})
            </button>
          </div>

          {/* Notification Items List */}
          <div className="diws-notif-list">
            {loading && items.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", fontSize: "12px", color: "#8C8275" }}>
                Loading notifications...
              </div>
            ) : error ? (
              <div style={{ padding: "14px", margin: "12px", backgroundColor: "#FEECEB", color: "#C5221F", borderRadius: "8px", fontSize: "12px" }}>
                {error}
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="diws-notif-empty">
                <div className="diws-notif-empty-icon">
                  <Sparkles size={20} />
                </div>
                <h4 className="diws-notif-empty-title">You're all caught up!</h4>
                <p className="diws-notif-empty-sub">
                  {filter === "unread"
                    ? "No unread notifications right now."
                    : "System notices and order updates will appear here."}
                </p>
              </div>
            ) : (
              displayedItems.map((n) => {
                const parsed = parseNotification(n);
                const isUnread = n.status === "unread";

                return (
                  <div
                    key={n._id}
                    className={`diws-notif-item ${isUnread ? "unread" : "read"}`}
                    onClick={() => openItem(n, parsed)}
                  >
                    {/* Category Icon */}
                    {renderCategoryIcon(parsed.category)}

                    {/* Main Content */}
                    <div className="diws-notif-content">
                      <div className="diws-notif-meta-top">
                        <div className="diws-notif-item-title">
                          <span>{parsed.cleanTitle}</span>
                          {isUnread && <span className="diws-notif-unread-dot" />}
                        </div>
                        <div className="diws-notif-time">
                          <Clock size={11} />
                          <span>{timeAgo(n.createdAt)}</span>
                        </div>
                      </div>

                      <p className="diws-notif-message">{parsed.cleanMessage}</p>

                      {/* Action & Token Area */}
                      <div className="diws-notif-actions">
                        {parsed.actionUrl && (
                          <button
                            type="button"
                            onClick={(e) => handleActionClick(e, n, parsed)}
                            className="diws-notif-primary-btn"
                          >
                            <span>{parsed.actionLabel}</span>
                            {parsed.isExternalLink ? (
                              <ExternalLink size={12} />
                            ) : (
                              <ArrowRight size={12} />
                            )}
                          </button>
                        )}

                        {parsed.token && (
                          <div
                            className="diws-notif-token-chip"
                            onClick={(e) => copyToken(e, parsed.token!, n._id)}
                            title="Click to copy token"
                          >
                            <span>Token: {parsed.token.slice(0, 6)}...{parsed.token.slice(-4)}</span>
                            <button type="button" className="diws-notif-copy-btn">
                              {copiedTokenId === n._id ? (
                                <>
                                  <Check size={12} style={{ color: "#166534" }} />
                                  <span style={{ color: "#166534" }}>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Hover Controls */}
                    <div className="diws-notif-item-controls">
                      {isUnread && (
                        <button
                          type="button"
                          className="diws-notif-icon-action"
                          onClick={(e) => markItemRead(e, n._id)}
                          title="Mark as read"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="diws-notif-icon-action delete"
                        onClick={(e) => dismissItem(e, n._id)}
                        title="Dismiss notification"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="diws-notif-footer">
            <Link
              to="/app/notifications"
              onClick={() => setOpen(false)}
              className="diws-notif-footer-link"
            >
              <span>View full notification history</span>
              <ArrowRight size={13} />
            </Link>
            {items.length > 0 && (
              <span className="diws-notif-footer-total">{items.length} total</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
