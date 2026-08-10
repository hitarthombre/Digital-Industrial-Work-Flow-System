import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import CompanyNavTabs from "./CompanyNavTabs";
import {
  Zap,
  Users,
  Factory,
  Warehouse,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  X,
  Check,
} from "lucide-react";

interface SubscriptionDetails {
  subscriptionPlan: string;
  status: string;
  limits: {
    users: number;
    factories: number;
    warehouses: number;
    storageGB: number;
  };
  usage: {
    users: number;
    factories: number;
    warehouses: number;
    storageGB: number;
  };
}

interface PlanTier {
  id: string;
  name: string;
  price: string;
  billing: string;
  badge?: string;
  limits: {
    users: number;
    factories: number;
    warehouses: number;
    storageGB: number;
  };
  features: string[];
}

const PLAN_TIERS: PlanTier[] = [
  {
    id: "free",
    name: "Free Tier",
    price: "$0",
    billing: "Forever free for small setups",
    limits: { users: 5, factories: 1, warehouses: 2, storageGB: 2 },
    features: [
      "Up to 5 User Accounts",
      "1 Factory Location",
      "2 Warehouse Workspaces",
      "2 GB File Storage",
      "Basic Inventory Tracking",
      "Community Support",
    ],
  },
  {
    id: "starter",
    name: "Starter Industrial",
    price: "$99",
    billing: "per month / billed annually",
    limits: { users: 15, factories: 3, warehouses: 5, storageGB: 10 },
    features: [
      "Up to 15 User Accounts",
      "3 Factory Locations",
      "5 Warehouse Workspaces",
      "10 GB File Storage",
      "Procurement & PO Workflows",
      "Basic Production Tracking",
      "Email & Helpdesk Support",
    ],
  },
  {
    id: "growth",
    name: "Growth Enterprise",
    price: "$299",
    billing: "per month / billed annually",
    badge: "MOST POPULAR",
    limits: { users: 50, factories: 10, warehouses: 25, storageGB: 50 },
    features: [
      "Up to 50 User Accounts",
      "10 Factory Locations",
      "25 Warehouse Workspaces",
      "50 GB Document Repository",
      "Full Production Stage Tracking",
      "Sales, Quotations & Dispatch Tracking",
      "Custom Export Reports (PDF/Excel)",
      "Priority 24/7 Support",
    ],
  },
  {
    id: "enterprise",
    name: "Industrial Unlimited",
    price: "Custom",
    billing: "Tailored multi-factory enterprise",
    limits: { users: 500, factories: 100, warehouses: 250, storageGB: 500 },
    features: [
      "Unlimited User Accounts",
      "100+ Factory Locations",
      "250+ Multi-Site Warehouses",
      "500 GB Storage & Archiving",
      "Dedicated Customer Success Manager",
      "Custom SLA & Audit Logging",
      "API & ERP Integration Hooks",
    ],
  },
];

export const CompanySubscription: React.FC = () => {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string>("");
  const [subData, setSubData] = useState<SubscriptionDetails>({
    subscriptionPlan: "growth",
    status: "active",
    limits: { users: 50, factories: 10, warehouses: 25, storageGB: 50 },
    usage: { users: 8, factories: 2, warehouses: 4, storageGB: 3.4 },
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<PlanTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const targetId = user?.companyId || "my-company";
      const response = await api.get<{ success: boolean; data: any }>(
        `/companies/${targetId}/subscription`
      );

      if (response && response.data) {
        setCompanyId(targetId);
        setSubData({
          subscriptionPlan: response.data.subscriptionPlan || "growth",
          status: response.data.status || "active",
          limits: response.data.limits || { users: 50, factories: 10, warehouses: 25, storageGB: 50 },
          usage: response.data.usage || { users: 8, factories: 2, warehouses: 4, storageGB: 3.4 },
        });
      }
    } catch (_) {
      setCompanyId(user?.companyId || "comp-default");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlanForUpgrade) return;

    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const targetId = companyId || user?.companyId || "my-company";
      await api.put(`/companies/${targetId}/subscription`, {
        subscriptionPlan: selectedPlanForUpgrade.id,
      });

      setSubData((prev) => ({
        ...prev,
        subscriptionPlan: selectedPlanForUpgrade.id,
        limits: selectedPlanForUpgrade.limits,
      }));

      setSuccess(`Workspace plan successfully upgraded to ${selectedPlanForUpgrade.name}!`);
      setSelectedPlanForUpgrade(null);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to update subscription plan.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="diws-page-loading">
        <span className="diws-spinner" style={{ width: "32px", height: "32px", borderTopColor: "var(--copper)" }} />
        <p>Loading subscription details...</p>
      </div>
    );
  }

  const currentPlanTier =
    PLAN_TIERS.find((p) => p.id === subData.subscriptionPlan.toLowerCase()) ||
    PLAN_TIERS[2];

  // Helper for percentage progress bar
  const calcPercent = (used: number, limit: number) => {
    if (!limit) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  return (
    <div className="diws-page-container">
      {/* Page Header */}
      <div className="diws-page-header">
        <div>
          <h1 className="diws-page-title">Subscription & Usage Limits</h1>
          <p className="diws-page-subtitle">
            Manage your company workspace subscription plan, view resource quotas, and scale capabilities.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <CompanyNavTabs />

      {/* Notifications */}
      {error && (
        <div className="diws-alert diws-alert-error">
          <AlertCircle size={18} className="diws-alert-icon" />
          <div>
            <strong>Subscription Error:</strong> {error}
          </div>
        </div>
      )}

      {success && (
        <div className="diws-alert diws-alert-success">
          <CheckCircle2 size={18} className="diws-alert-icon" />
          <div>{success}</div>
        </div>
      )}

      {/* Active Subscription Banner Card */}
      <div className="diws-sub-banner-card">
        <div className="diws-sub-banner-left">
          <div className="diws-sub-icon-box">
            <Zap size={28} />
          </div>
          <div>
            <div className="diws-sub-title-row">
              <h2>{currentPlanTier.name}</h2>
              <span className="diws-status-badge active">
                <ShieldCheck size={13} /> {subData.status.toUpperCase()}
              </span>
            </div>
            <p className="diws-sub-billing-text">
              Active plan for current workspace. Includes 24/7 priority customer support & SLA.
            </p>
          </div>
        </div>

        <div className="diws-sub-banner-right">
          <div className="diws-sub-price-tag">
            <span className="diws-price">{currentPlanTier.price}</span>
            <span className="diws-price-period">
              {currentPlanTier.id === "free" ? "" : "/ month"}
            </span>
          </div>
        </div>
      </div>

      {/* Resource Quota Usage Meters */}
      <div className="diws-section-header" style={{ marginTop: "2rem" }}>
        <h3>Workspace Resource Quotas & Usage</h3>
        <p>Current active usage against your plan's maximum capacity thresholds:</p>
      </div>

      <div className="diws-grid diws-grid-2" style={{ marginBottom: "2.5rem" }}>
        {/* User Seats Meter */}
        <Card className="diws-quota-card">
          <div className="diws-quota-header">
            <div className="diws-quota-title">
              <Users size={18} className="diws-quota-icon" />
              <span>User Seats</span>
            </div>
            <span className="diws-quota-count">
              <strong>{subData.usage.users}</strong> / {subData.limits.users} Seats
            </span>
          </div>
          <div className="diws-progress-track">
            <div
              className="diws-progress-fill"
              style={{ width: `${calcPercent(subData.usage.users, subData.limits.users)}%` }}
            />
          </div>
          <p className="diws-quota-hint">
            {subData.limits.users - subData.usage.users} user invitations remaining on this tier.
          </p>
        </Card>

        {/* Factory Locations Meter */}
        <Card className="diws-quota-card">
          <div className="diws-quota-header">
            <div className="diws-quota-title">
              <Factory size={18} className="diws-quota-icon" />
              <span>Factory Sites</span>
            </div>
            <span className="diws-quota-count">
              <strong>{subData.usage.factories}</strong> / {subData.limits.factories} Sites
            </span>
          </div>
          <div className="diws-progress-track">
            <div
              className="diws-progress-fill"
              style={{
                width: `${calcPercent(subData.usage.factories, subData.limits.factories)}%`,
                backgroundColor: "var(--copper)",
              }}
            />
          </div>
          <p className="diws-quota-hint">
            {subData.limits.factories - subData.usage.factories} additional factory locations available.
          </p>
        </Card>

        {/* Warehouse Workspaces Meter */}
        <Card className="diws-quota-card">
          <div className="diws-quota-header">
            <div className="diws-quota-title">
              <Warehouse size={18} className="diws-quota-icon" />
              <span>Warehouses</span>
            </div>
            <span className="diws-quota-count">
              <strong>{subData.usage.warehouses}</strong> / {subData.limits.warehouses} Workspaces
            </span>
          </div>
          <div className="diws-progress-track">
            <div
              className="diws-progress-fill"
              style={{ width: `${calcPercent(subData.usage.warehouses, subData.limits.warehouses)}%` }}
            />
          </div>
          <p className="diws-quota-hint">
            {subData.limits.warehouses - subData.usage.warehouses} warehouse sites available.
          </p>
        </Card>

        {/* Document Storage Meter */}
        <Card className="diws-quota-card">
          <div className="diws-quota-header">
            <div className="diws-quota-title">
              <HardDrive size={18} className="diws-quota-icon" />
              <span>Document Storage</span>
            </div>
            <span className="diws-quota-count">
              <strong>{subData.usage.storageGB} GB</strong> / {subData.limits.storageGB} GB
            </span>
          </div>
          <div className="diws-progress-track">
            <div
              className="diws-progress-fill"
              style={{ width: `${calcPercent(subData.usage.storageGB, subData.limits.storageGB)}%` }}
            />
          </div>
          <p className="diws-quota-hint">
            {(subData.limits.storageGB - subData.usage.storageGB).toFixed(1)} GB cloud storage remaining.
          </p>
        </Card>
      </div>

      {/* Available Plans Comparison Matrix */}
      <div className="diws-section-header">
        <h3>Available Subscription Tiers</h3>
        <p>Choose the optimal tier for your industrial manufacturing operations:</p>
      </div>

      <div className="diws-plans-grid">
        {PLAN_TIERS.map((tier) => {
          const isCurrent = tier.id === subData.subscriptionPlan.toLowerCase();
          return (
            <div
              key={tier.id}
              className={`diws-plan-card ${isCurrent ? "current" : ""} ${
                tier.badge ? "featured" : ""
              }`}
            >
              {tier.badge && <div className="diws-plan-featured-badge">{tier.badge}</div>}

              <div className="diws-plan-card-header">
                <h4 className="diws-plan-name">{tier.name}</h4>
                <div className="diws-plan-price-box">
                  <span className="diws-plan-price">{tier.price}</span>
                  {tier.id !== "free" && <span className="diws-plan-billing">/ mo</span>}
                </div>
                <p className="diws-plan-period-desc">{tier.billing}</p>
              </div>

              <div className="diws-plan-limits-box">
                <div className="diws-plan-limit-row">
                  <span>Users:</span> <strong>{tier.limits.users} Seats</strong>
                </div>
                <div className="diws-plan-limit-row">
                  <span>Factories:</span> <strong>{tier.limits.factories} Sites</strong>
                </div>
                <div className="diws-plan-limit-row">
                  <span>Warehouses:</span> <strong>{tier.limits.warehouses} Sites</strong>
                </div>
                <div className="diws-plan-limit-row">
                  <span>Storage:</span> <strong>{tier.limits.storageGB} GB</strong>
                </div>
              </div>

              <ul className="diws-plan-features-list">
                {tier.features.map((feat, idx) => (
                  <li key={idx}>
                    <Check size={16} className="diws-feat-check" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="diws-plan-card-action">
                {isCurrent ? (
                  <Button variant="secondary" fullWidth disabled>
                    Current Active Plan
                  </Button>
                ) : (
                  <Button
                    variant={tier.badge ? "copper" : "primary"}
                    fullWidth
                    icon={<ArrowUpRight size={16} />}
                    onClick={() => setSelectedPlanForUpgrade(tier)}
                  >
                    Select {tier.name}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade Confirmation Modal */}
      {selectedPlanForUpgrade && (
        <div className="diws-modal-backdrop">
          <div className="diws-modal-content">
            <div className="diws-modal-header">
              <h3>Upgrade Company Subscription</h3>
              <button
                className="diws-modal-close"
                onClick={() => setSelectedPlanForUpgrade(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="diws-modal-body">
              <p>
                Are you sure you want to change your workspace plan from{" "}
                <strong>{currentPlanTier.name}</strong> to{" "}
                <strong>{selectedPlanForUpgrade.name}</strong>?
              </p>

              <div className="diws-upgrade-summary-box">
                <div className="diws-upgrade-row">
                  <span>New Price:</span>
                  <strong>{selectedPlanForUpgrade.price}</strong>
                </div>
                <div className="diws-upgrade-row">
                  <span>User Limit:</span>
                  <strong>{selectedPlanForUpgrade.limits.users} Seats</strong>
                </div>
                <div className="diws-upgrade-row">
                  <span>Factories Limit:</span>
                  <strong>{selectedPlanForUpgrade.limits.factories} Sites</strong>
                </div>
                <div className="diws-upgrade-row">
                  <span>Storage Quota:</span>
                  <strong>{selectedPlanForUpgrade.limits.storageGB} GB</strong>
                </div>
              </div>

              <p className="diws-field-hint" style={{ marginTop: "1rem" }}>
                Changes will take effect immediately for your company workspace.
              </p>
            </div>

            <div className="diws-modal-footer">
              <Button
                variant="secondary"
                onClick={() => setSelectedPlanForUpgrade(null)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                variant="copper"
                icon={<Sparkles size={16} />}
                onClick={handleConfirmUpgrade}
                loading={updating}
              >
                Confirm Plan Upgrade
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySubscription;
