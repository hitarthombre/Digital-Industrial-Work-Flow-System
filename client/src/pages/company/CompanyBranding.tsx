import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import CompanyNavTabs from "./CompanyNavTabs";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Save,
  Building2,
  Eye,
} from "lucide-react";

interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  copper: string;
  description: string;
}

const THEMES: ThemePreset[] = [
  {
    id: "forest-copper",
    name: "Forest & Copper (Default)",
    primary: "#173A2A",
    copper: "#B87333",
    description: "Classic DIWS industrial theme with deep forest green and burnished copper accents.",
  },
  {
    id: "navy-gold",
    name: "Navy & Gold",
    primary: "#0F172A",
    copper: "#D97706",
    description: "Executive slate navy with warm gold contrast.",
  },
  {
    id: "steel-blue",
    name: "Steel Blue",
    primary: "#1E293B",
    copper: "#2563EB",
    description: "Modern manufacturing slate grey paired with vibrant steel blue.",
  },
  {
    id: "emerald-titanium",
    name: "Emerald Titanium",
    primary: "#064E3B",
    copper: "#059669",
    description: "High-contrast precision emerald theme.",
  },
];

export const CompanyBranding: React.FC = () => {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("Apex Industrial Solutions");
  const [companyCode, setCompanyCode] = useState<string>("APEX");

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>("forest-copper");

  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ success: boolean; data: any }>("/companies/my-company");
      if (response && response.data) {
        const data = response.data;
        setCompanyId(data._id || data.id || "");
        setCompanyName(data.name || "Apex Industrial");
        setCompanyCode(data.code || "APEX");
        if (data.logo) {
          setLogoUrl(data.logo);
        }
      }
    } catch (_) {
      setCompanyId(user?.companyId || "comp-default");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format & size (5MB max)
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size must be less than 5MB.");
      return;
    }

    setError(null);
    setUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoUrl(result);
      setUploading(false);
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const targetId = companyId || user?.companyId || "my-company";
      await api.post(`/companies/${targetId}/logo`, {
        logo: logoUrl || "",
        theme: selectedTheme,
      });

      setSuccess("Company branding and logo saved successfully!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save company branding.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="diws-page-loading">
        <span className="diws-spinner" style={{ width: "32px", height: "32px", borderTopColor: "var(--copper)" }} />
        <p>Loading branding options...</p>
      </div>
    );
  }

  const activeThemeObj = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  return (
    <div className="diws-page-container">
      {/* Page Header */}
      <div className="diws-page-header">
        <div>
          <h1 className="diws-page-title">Company Branding & Logo</h1>
          <p className="diws-page-subtitle">
            Upload your official company emblem, set workspace themes, and preview visual elements.
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
            <strong>Branding Error:</strong> {error}
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
        {/* Upload & Theme Options Form */}
        <Card className="diws-form-card">
          <form onSubmit={handleSubmit}>
            <div className="diws-card-header">
              <h3>Company Emblem & Logo</h3>
              <p>Upload your organization logo to customize headers, reports, and invoices.</p>
            </div>

            {/* Dropzone / Upload Box */}
            <div className="diws-dropzone-container">
              {logoUrl ? (
                <div className="diws-logo-preview-box">
                  <img src={logoUrl} alt="Company Logo Preview" className="diws-logo-preview-img" />
                  <div className="diws-logo-actions">
                    <Button
                      type="button"
                      variant="danger"
                      icon={<Trash2 size={15} />}
                      onClick={handleRemoveLogo}
                    >
                      Remove Logo
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="diws-dropzone-label">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                  <div className="diws-dropzone-content">
                    <div className="diws-dropzone-icon">
                      {uploading ? (
                        <span className="diws-spinner" style={{ borderTopColor: "var(--copper)" }} />
                      ) : (
                        <UploadCloud size={36} />
                      )}
                    </div>
                    <p className="diws-dropzone-text">
                      <strong>Click to upload</strong> or drag & drop logo
                    </p>
                    <p className="diws-dropzone-subtext">
                      PNG, JPG, WebP, or SVG (Recommended 400x100px, max 5MB)
                    </p>
                  </div>
                </label>
              )}
            </div>

            <div className="diws-divider" style={{ margin: "2rem 0" }} />

            {/* Workspace Theme Palette Selector */}
            <div className="diws-card-header">
              <h3>Workspace Color Palette</h3>
              <p>Choose an accent theme for the dashboard header, buttons, and navigation elements.</p>
            </div>

            <div className="diws-theme-grid">
              {THEMES.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <div
                    key={theme.id}
                    className={`diws-theme-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedTheme(theme.id)}
                  >
                    <div className="diws-theme-swatches">
                      <span className="diws-swatch" style={{ backgroundColor: theme.primary }} />
                      <span className="diws-swatch" style={{ backgroundColor: theme.copper }} />
                    </div>
                    <div className="diws-theme-meta">
                      <div className="diws-theme-name">{theme.name}</div>
                      <div className="diws-theme-desc">{theme.description}</div>
                    </div>
                    {isSelected && <CheckCircle2 size={18} className="diws-theme-check" />}
                  </div>
                );
              })}
            </div>

            <div className="diws-form-actions" style={{ marginTop: "2rem" }}>
              <Button
                type="submit"
                variant="copper"
                icon={<Save size={16} />}
                loading={saving}
              >
                Save Branding & Theme
              </Button>
            </div>
          </form>
        </Card>

        {/* Live UI Mockup Preview Card */}
        <Card className="diws-preview-card">
          <div className="diws-card-header">
            <h3><Eye size={18} /> Live Header & Sidebar Preview</h3>
            <p>Visual demonstration of how your logo and theme render inside DIWS workspace:</p>
          </div>

          {/* Header Preview Bar */}
          <div className="diws-mockup-container">
            <div
              className="diws-mockup-header"
              style={{ backgroundColor: activeThemeObj.primary }}
            >
              <div className="diws-mockup-brand">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="diws-mockup-logo-img" />
                ) : (
                  <div className="diws-mockup-brand-placeholder">
                    <Building2 size={18} style={{ color: activeThemeObj.copper }} />
                    <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.9rem" }}>
                      {companyName}
                    </span>
                  </div>
                )}
              </div>

              <div className="diws-mockup-user">
                <span
                  className="diws-mockup-pill"
                  style={{ backgroundColor: activeThemeObj.copper, color: "#FFFFFF" }}
                >
                  [{companyCode}] Admin
                </span>
              </div>
            </div>

            {/* Sidebar & Content Mockup */}
            <div className="diws-mockup-body">
              <div className="diws-mockup-sidebar">
                <div className="diws-mockup-menu-item active">
                  <span className="diws-mockup-dot" style={{ backgroundColor: activeThemeObj.copper }} />
                  Company Profile
                </div>
                <div className="diws-mockup-menu-item">
                  <span className="diws-mockup-dot" />
                  Regional Settings
                </div>
                <div className="diws-mockup-menu-item">
                  <span className="diws-mockup-dot" />
                  Subscription Plan
                </div>
              </div>

              <div className="diws-mockup-content">
                <div className="diws-mockup-card">
                  <div
                    className="diws-mockup-btn"
                    style={{ backgroundColor: activeThemeObj.primary, color: "#FFFFFF" }}
                  >
                    Primary Action
                  </div>
                  <div
                    className="diws-mockup-btn"
                    style={{ backgroundColor: activeThemeObj.copper, color: "#FFFFFF" }}
                  >
                    Copper Highlight
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompanyBranding;
