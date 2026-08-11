import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Card } from "../../components/Card";
import CompanyNavTabs from "./CompanyNavTabs";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface CompanyData {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  industry?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  currency?: string;
  timezone?: string;
  status?: string;
  subscriptionPlan?: string;
  logo?: string;
}

export const CompanyProfile: React.FC = () => {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string>("");
  const [formData, setFormData] = useState<CompanyData>({
    name: "",
    code: "",
    industry: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
  });

  const [initialData, setInitialData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ success: boolean; data: CompanyData }>(
        "/companies/my-company"
      );
      if (response && response.data) {
        const data = response.data;
        const compId = data._id || data.id || "";
        setCompanyId(compId);
        const loadedData: CompanyData = {
          _id: compId,
          name: data.name || "",
          code: data.code || "",
          industry: data.industry || "Stone & Marble Processing",
          email: data.email || user?.email || "",
          phone: data.phone || "+1 (555) 234-5678",
          address: data.address || "100 Industrial Parkway, Suite 400, Industrial Zone",
          gstNumber: data.gstNumber || "27AAPCA1234F1ZV",
          currency: data.currency || "USD",
          timezone: data.timezone || "UTC",
          status: data.status || "active",
          subscriptionPlan: data.subscriptionPlan || "growth",
          logo: data.logo,
        };
        setFormData(loadedData);
        setInitialData(loadedData);
      }
    } catch (err: any) {
      console.warn("Could not load backend company profile, fallback to default details", err);
      const fallback: CompanyData = {
        _id: user?.companyId || "comp-default",
        name: "Apex Industrial Solutions",
        code: "APEX",
        industry: "Stone & Marble Manufacturing",
        email: user?.email || "contact@apexindustrial.com",
        phone: "+1 (555) 987-6543",
        address: "750 Commerce Boulevard, Industrial Sector 4",
        gstNumber: "07AAACB9876D1Z5",
        currency: "USD",
        timezone: "UTC",
        status: "active",
        subscriptionPlan: "growth",
      };
      setCompanyId(fallback._id!);
      setFormData(fallback);
      setInitialData(fallback);
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = "Company name is required";
    }
    if (!formData.code.trim()) {
      errors.code = "Company code is required";
    } else if (formData.code.length < 2) {
      errors.code = "Company code must be at least 2 characters";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const targetId = companyId || user?.companyId || "my-company";
      await api.put(`/companies/${targetId}`, {
        name: formData.name,
        code: formData.code.toUpperCase(),
        industry: formData.industry,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        gstNumber: formData.gstNumber,
      });

      setSuccess("Company profile details updated successfully!");
      setInitialData({ ...formData });
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to update company profile details.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setFormData({ ...initialData });
      setFormErrors({});
      setError(null);
      setSuccess(null);
    }
  };

  if (loading) {
    return (
      <div className="diws-page-loading">
        <span className="diws-spinner" style={{ width: "32px", height: "32px", borderTopColor: "var(--copper)" }} />
        <p>Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="diws-page-container">
      {/* Page Header Title */}
      <div className="diws-page-header">
        <div>
          <h1 className="diws-page-title">Company Management</h1>
          <p className="diws-page-subtitle">
            Manage your organization profile, settings, branding, and subscription.
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
            <strong>Update Failed:</strong> {error}
          </div>
        </div>
      )}

      {success && (
        <div className="diws-alert diws-alert-success">
          <CheckCircle2 size={18} className="diws-alert-icon" />
          <div>{success}</div>
        </div>
      )}

      {/* Organization Header Summary Banner Card */}
      <div className="diws-company-hero-card">
        <div className="diws-hero-left">
          <div className="diws-hero-logo-box">
            {formData.logo ? (
              <img src={formData.logo} alt={formData.name} />
            ) : (
              <Building2 size={32} />
            )}
          </div>
          <div className="diws-hero-text">
            <div className="diws-hero-title-row">
              <h2>{formData.name || "Company Name"}</h2>
              <span className="diws-status-badge active">
                <ShieldCheck size={13} /> {formData.status || "ACTIVE"}
              </span>
              <span className="diws-plan-pill">
                {(formData.subscriptionPlan || "GROWTH").toUpperCase()} PLAN
              </span>
            </div>
            <p className="diws-hero-subtitle">
              Workspace Code: <strong>{formData.code || "APEX"}</strong> | Industry:{" "}
              {formData.industry || "General Manufacturing"}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Company Profile Form */}
      <Card className="diws-form-card">
        <form onSubmit={handleSubmit}>
          <div className="diws-card-header">
            <h3>Organization Details</h3>
            <p>Update basic company information and legal identifier settings.</p>
          </div>

          <div className="diws-form-grid">
            <Input
              id="name"
              name="name"
              label="Company Name"
              value={formData.name}
              onChange={handleChange}
              error={formErrors.name}
              icon={<Building2 size={16} />}
              placeholder="e.g. Apex Industrial Solutions Inc."
              required
            />

            <Input
              id="code"
              name="code"
              label="Company Code (Workspace Prefix)"
              value={formData.code}
              onChange={handleChange}
              error={formErrors.code}
              icon={<Briefcase size={16} />}
              placeholder="e.g. APEX"
              hint="Uppercase unique code used for SKU & PO prefix tags."
              required
            />

            <Input
              id="industry"
              name="industry"
              label="Industry Sector"
              value={formData.industry}
              onChange={handleChange}
              icon={<Briefcase size={16} />}
              placeholder="e.g. Stone, Granite, Steel, Textile"
            />

            <Input
              id="email"
              name="email"
              label="Official Contact Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              icon={<Mail size={16} />}
              placeholder="contact@company.com"
            />

            <Input
              id="phone"
              name="phone"
              label="Phone / Contact Number"
              value={formData.phone}
              onChange={handleChange}
              icon={<Phone size={16} />}
              placeholder="+1 (555) 000-0000"
            />

            <Input
              id="gstNumber"
              name="gstNumber"
              label="GSTIN / Tax Identification Number"
              value={formData.gstNumber}
              onChange={handleChange}
              icon={<FileText size={16} />}
              placeholder="e.g. 27AAPCA1234F1ZV"
            />
          </div>

          <div className="diws-form-group diws-full-width">
            <label className="diws-label" htmlFor="address">
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <MapPin size={16} /> Headquarters Address
              </span>
            </label>
            <textarea
              id="address"
              name="address"
              className="diws-textarea"
              rows={3}
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter complete corporate street address, city, state, zip code..."
            />
          </div>

          <div className="diws-form-actions">
            <Button
              type="button"
              variant="secondary"
              icon={<RefreshCw size={16} />}
              onClick={handleReset}
              disabled={saving}
            >
              Reset Changes
            </Button>

            <Button
              type="submit"
              variant="primary"
              icon={<Save size={16} />}
              loading={saving}
            >
              Save Profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CompanyProfile;
