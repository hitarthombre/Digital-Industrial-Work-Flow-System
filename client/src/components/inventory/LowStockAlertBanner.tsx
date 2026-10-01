import React, { useState } from "react";
import { AlertTriangle, AlertCircle, ChevronRight, Bell, X, ShieldAlert, ArrowDownLeft } from "lucide-react";
import type { ILowStockAlert } from "../../services/inventoryService";

interface LowStockAlertBannerProps {
  alerts: ILowStockAlert[];
  onOpenPanel: () => void;
  onQuickStockIn?: (sku: string, itemName: string, category?: string) => void;
}

export const LowStockAlertBanner: React.FC<LowStockAlertBannerProps> = ({
  alerts,
  onOpenPanel,
  onQuickStockIn,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !alerts || alerts.length === 0) {
    return null;
  }

  const criticalAlerts = alerts.filter((a) => a.severity === "critical" || a.currentQuantity === 0);
  const warningAlerts = alerts.filter((a) => a.severity === "warning" && a.currentQuantity > 0);

  return (
    <div className={`inv-alert-banner ${criticalAlerts.length > 0 ? "critical" : "warning"}`}>
      <div className="inv-alert-banner-content">
        <div className="inv-alert-banner-icon">
          {criticalAlerts.length > 0 ? (
            <AlertCircle size={22} className="text-red-500 animate-pulse" />
          ) : (
            <AlertTriangle size={22} className="text-amber-500" />
          )}
        </div>
        <div className="inv-alert-banner-text">
          <strong className="inv-alert-title">
            {criticalAlerts.length > 0
              ? `Critical Stock Alert: ${criticalAlerts.length} item(s) Out of Stock!`
              : `Low Stock Warning: ${alerts.length} item(s) below minimum threshold`}
          </strong>
          <p className="inv-alert-subtext">
            {criticalAlerts.length > 0 && (
              <span className="inv-tag-critical">{criticalAlerts.length} Out of Stock</span>
            )}
            {warningAlerts.length > 0 && (
              <span className="inv-tag-warning">{warningAlerts.length} Low Stock</span>
            )}
            <span className="inv-alert-hint">Action required to prevent production line stoppage.</span>
          </p>
        </div>
      </div>

      <div className="inv-alert-banner-actions">
        {criticalAlerts.length > 0 && onQuickStockIn && (
          <button
            type="button"
            className="inv-quick-reorder-btn"
            onClick={() =>
              onQuickStockIn(
                criticalAlerts[0].sku,
                criticalAlerts[0].itemName,
                criticalAlerts[0].itemCategory
              )
            }
          >
            <ArrowDownLeft size={14} /> Quick Stock In ({criticalAlerts[0].sku})
          </button>
        )}
        <button type="button" className="inv-view-alerts-btn" onClick={onOpenPanel}>
          <Bell size={15} /> View All Alerts ({alerts.length}) <ChevronRight size={14} />
        </button>
        <button
          type="button"
          className="inv-dismiss-banner-btn"
          onClick={() => setDismissed(true)}
          title="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

interface LowStockNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: ILowStockAlert[];
  onStockInItem: (sku: string, itemName: string, category?: string) => void;
  onAdjustItem: (sku: string, itemName: string) => void;
}

export const LowStockNotificationPanel: React.FC<LowStockNotificationPanelProps> = ({
  isOpen,
  onClose,
  alerts,
  onStockInItem,
  onAdjustItem,
}) => {
  if (!isOpen) return null;

  return (
    <div className="diws-modal-backdrop" onClick={onClose}>
      <div
        className="inv-notification-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inv-drawer-header">
          <div className="inv-drawer-header-title">
            <ShieldAlert size={22} className="text-copper" />
            <h3>Low Stock & Reorder Notifications</h3>
          </div>
          <button type="button" className="diws-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="inv-drawer-body">
          {alerts.length === 0 ? (
            <div className="inv-empty-alerts">
              <Bell size={40} color="#94A3B8" />
              <h4>All Inventory Levels Healthy</h4>
              <p>No active low stock or out-of-stock items detected.</p>
            </div>
          ) : (
            <div className="inv-alerts-list">
              {alerts.map((alert) => {
                const isCritical = alert.severity === "critical" || alert.currentQuantity === 0;
                const whName = typeof alert.warehouseId === "object" ? alert.warehouseId?.name : "Main Warehouse";

                return (
                  <div
                    key={alert._id}
                    className={`inv-alert-card ${isCritical ? "critical" : "warning"}`}
                  >
                    <div className="inv-alert-card-header">
                      <span className={`inv-severity-badge ${isCritical ? "critical" : "warning"}`}>
                        {isCritical ? "OUT OF STOCK" : "LOW STOCK"}
                      </span>
                      <span className="inv-alert-time">
                        Triggered {new Date(alert.triggeredAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="inv-alert-card-body">
                      <h4 className="inv-alert-item-title">{alert.itemName}</h4>
                      <div className="inv-alert-sku-row">
                        <span className="inv-code-tag">{alert.sku}</span>
                        <span className="inv-wh-tag">{whName}</span>
                      </div>

                      <div className="inv-alert-progress-wrap">
                        <div className="inv-alert-progress-info">
                          <span>Current Stock: <strong>{alert.currentQuantity} units</strong></span>
                          <span>Min Threshold: <strong>{alert.minThreshold} units</strong></span>
                        </div>
                        <div className="inv-progress-bar-bg">
                          <div
                            className={`inv-progress-bar-fill ${isCritical ? "critical" : "warning"}`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(5, (alert.currentQuantity / (alert.minThreshold || 10)) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="inv-alert-card-footer">
                      <button
                        type="button"
                        className="diws-btn diws-btn-success diws-btn-sm"
                        onClick={() => {
                          onClose();
                          onStockInItem(alert.sku, alert.itemName, alert.itemCategory);
                        }}
                      >
                        <ArrowDownLeft size={14} /> Record Stock In
                      </button>
                      <button
                        type="button"
                        className="diws-btn diws-btn-secondary diws-btn-sm"
                        onClick={() => {
                          onClose();
                          onAdjustItem(alert.sku, alert.itemName);
                        }}
                      >
                        Adjust Stock
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
