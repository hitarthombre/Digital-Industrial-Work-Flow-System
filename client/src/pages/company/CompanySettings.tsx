import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import CompanyNavTabs from "./CompanyNavTabs";
import {
  Globe,
  DollarSign,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Sliders,
} from "lucide-react";

interface SettingsState {
  currency: string;
  timezone: string;
  dateFormat: string;
  fiscalYearStart: string;
}

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD - US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "EUR - Euro (€)" },
  { code: "INR", symbol: "₹", label: "INR - Indian Rupee (₹)" },
  { code: "GBP", symbol: "£", label: "GBP - British Pound (£)" },
  { code: "AUD", symbol: "A$", label: "AUD - Australian Dollar (A$)" },
  { code: "CAD", symbol: "C$", label: "CAD - Canadian Dollar (C$)" },
  { code: "JPY", symbol: "¥", label: "JPY - Japanese Yen (¥)" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST - UTC+5:30)" },
  { value: "America/New_York", label: "America/New_York (EST - UTC-5:00)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST - UTC-8:00)" },
  { value: "Europe/London", label: "Europe/London (GMT - UTC+0:00)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET - UTC+1:00)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST - UTC+9:00)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST - UTC+10:00)" },
];

const DATE_FORMATS = [
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-08-10) [ISO Standard]" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (10/08/2026) [UK / European]" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (08/10/2026) [US Standard]" },
  { value: "DD-MMM-YYYY", label: "DD-MMM-YYYY (10-Aug-2026) [Industrial]" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const CompanySettings: React.FC = () => {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string>("");

  const [settings, setSettings] = useState<SettingsState>({
    currency: "USD",
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    fiscalYearStart: "April",
  });

  const [initialSettings, setInitialSettings] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ success: boolean; data: any }>("/companies/my-company");
      if (response && response.data) {
        const compId = response.data._id || response.data.id || "";
        setCompanyId(compId);

        const loaded: SettingsState = {
          currency: response.data.currency || "USD",
          timezone: response.data.timezone || "UTC",
          dateFormat: response.data.dateFormat || "YYYY-MM-DD",
          fiscalYearStart: response.data.fiscalYearStart || "April",
        };
        setSettings(loaded);
        setInitialSettings(loaded);
      }
    } catch (_) {
      const fallback: SettingsState = {
        currency: "USD",
        timezone: "UTC",
        dateFormat: "YYYY-MM-DD",
        fiscalYearStart: "April",
      };
      setCompanyId(user?.companyId || "comp-default");
      setSettings(fallback);
      setInitialSettings(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const targetId = companyId || user?.companyId || "my-company";
      await api.put(`/companies/${targetId}/settings`, {
        currency: settings.currency,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        fiscalYearStart: settings.fiscalYearStart,
      });

      setSuccess("Regional and company preferences updated successfully!");
      setInitialSettings({ ...settings });
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to update regional settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (initialSettings) {
      setSettings({ ...initialSettings });
      setError(null);
      setSuccess(null);
    }
  };

  // Preview formatted amount & date
  const selectedCurrencyObj = CURRENCIES.find((c) => c.code === settings.currency) || CURRENCIES[0];

  if (loading) {
    return (
      <div className="diws-page-loading">
        <span className="diws-spinner" style={{ width: "32px", height: "32px", borderTopColor: "var(--copper)" }} />
        <p>Loading company settings...</p>
      </div>
    );
  }

  return (
    <div className="diws-page-container">
      {/* Page Title */}
      <div className="diws-page-header">
        <div>
          <h1 className="diws-page-title">Company Settings</h1>
          <p className="diws-page-subtitle">
            Configure currency, timezone, date formatting, and regional parameters for workspace calculations.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <CompanyNavTabs />

      {/* Alerts */}
      {error && (
        <div className="diws-alert diws-alert-error">
          <AlertCircle size={18} className="diws-alert-icon" />
          <div>
            <strong>Update Error:</strong> {error}
          </div>
        </div>
      )}

      {success && (
        <div className="diws-alert diws-alert-success">
          <CheckCircle2 size={18} className="diws-alert-icon" />
          <div>{success}</div>
        </div>
      )}

      <div className="diws-grid diws-grid-2">
        {/* Settings Controls Form Card */}
        <Card className="diws-form-card">
          <form onSubmit={handleSubmit}>
            <div className="diws-card-header">
              <h3>Regional & Currency Configuration</h3>
              <p>Configure defaults applied to purchase orders, invoices, stock values, and timestamps.</p>
            </div>

            <div className="diws-form-group">
              <label className="diws-label" htmlFor="currency">
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <DollarSign size={16} /> Operating Base Currency *
                </span>
              </label>
              <select
                id="currency"
                name="currency"
                className="diws-select"
                value={settings.currency}
                onChange={handleChange}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <p className="diws-field-hint">Primary currency used in financial reports and item valuation.</p>
            </div>

            <div className="diws-form-group">
              <label className="diws-label" htmlFor="timezone">
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Clock size={16} /> System Timezone *
                </span>
              </label>
              <select
                id="timezone"
                name="timezone"
                className="diws-select"
                value={settings.timezone}
                onChange={handleChange}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="diws-field-hint">Used to stamp audit logs, work order logs, and dispatch delivery dates.</p>
            </div>

            <div className="diws-form-group">
              <label className="diws-label" htmlFor="dateFormat">
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Calendar size={16} /> Date Display Format
                </span>
              </label>
              <select
                id="dateFormat"
                name="dateFormat"
                className="diws-select"
                value={settings.dateFormat}
                onChange={handleChange}
              >
                {DATE_FORMATS.map((df) => (
                  <option key={df.value} value={df.value}>
                    {df.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="diws-form-group">
              <label className="diws-label" htmlFor="fiscalYearStart">
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Globe size={16} /> Fiscal Year Start Month
                </span>
              </label>
              <select
                id="fiscalYearStart"
                name="fiscalYearStart"
                className="diws-select"
                value={settings.fiscalYearStart}
                onChange={handleChange}
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="diws-form-actions">
              <Button
                type="button"
                variant="secondary"
                icon={<RefreshCw size={16} />}
                onClick={handleReset}
                disabled={saving}
              >
                Reset
              </Button>

              <Button
                type="submit"
                variant="primary"
                icon={<Save size={16} />}
                loading={saving}
              >
                Save Settings
              </Button>
            </div>
          </form>
        </Card>

        {/* Live Regional Formatting Preview Card */}
        <Card className="diws-preview-card">
          <div className="diws-card-header">
            <h3><Sliders size={18} /> Live Format Preview</h3>
            <p>Here is how monetary totals and dates will appear across DIWS screens:</p>
          </div>

          <div className="diws-preview-box">
            <div className="diws-preview-item">
              <span className="diws-preview-label">Sample Inventory Valuation:</span>
              <span className="diws-preview-value">
                {selectedCurrencyObj.symbol} 1,245,800.00 {settings.currency}
              </span>
            </div>

            <div className="diws-preview-item">
              <span className="diws-preview-label">Purchase Order Total:</span>
              <span className="diws-preview-value">
                {selectedCurrencyObj.symbol} 45,600.50 {settings.currency}
              </span>
            </div>

            <div className="diws-preview-item">
              <span className="diws-preview-label">Active Timezone:</span>
              <span className="diws-preview-value">{settings.timezone}</span>
            </div>

            <div className="diws-preview-item">
              <span className="diws-preview-label">Selected Date Format:</span>
              <span className="diws-preview-value">{settings.dateFormat}</span>
            </div>

            <div className="diws-preview-item">
              <span className="diws-preview-label">Fiscal Cycle:</span>
              <span className="diws-preview-value">
                Starts 1st of {settings.fiscalYearStart}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompanySettings;
