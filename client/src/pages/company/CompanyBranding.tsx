import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import CompanyNavTabs from "./CompanyNavTabs";
import { applyTheme } from "../../utils/theme";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Save,
  Building2,
  Eye,
  Sliders,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";

interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  copper: string;
  description: string;
}

const PRESET_THEMES: ThemePreset[] = [
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
  {
    id: "charcoal-crimson",
    name: "Charcoal & Crimson",
    primary: "#18181B",
    copper: "#DC2626",
    description: "Bold industrial charcoal with high-visibility crimson red highlights.",
  },
  {
    id: "violet-amber",
    name: "Deep Violet & Amber",
    primary: "#2E1065",
    copper: "#F59E0B",
    description: "Distinctive deep violet paired with luminous amber.",
  },
];

const PRIMARY_SWATCHES = [
  { label: "Deep Forest", hex: "#173A2A" },
  { label: "Slate Navy", hex: "#0F172A" },
  { label: "Industrial Charcoal", hex: "#18181B" },
  { label: "Steel Grey", hex: "#1E293B" },
  { label: "Deep Violet", hex: "#2E1065" },
  { label: "Dark Plum", hex: "#3B0764" },
  { label: "Rich Wine", hex: "#4C0519" },
  { label: "Dark Cyan", hex: "#042F2E" },
];

const ACCENT_SWATCHES = [
  { label: "Burnished Copper", hex: "#B87333" },
  { label: "Amber Gold", hex: "#D97706" },
  { label: "Cobalt Blue", hex: "#2563EB" },
  { label: "Vivid Emerald", hex: "#059669" },
  { label: "Crimson Red", hex: "#DC2626" },
  { label: "Royal Purple", hex: "#7C3AED" },
  { label: "Cyber Teal", hex: "#0D9488" },
  { label: "Sunset Orange", hex: "#EA580C" },
];

export const CompanyBranding: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyId, setCompanyId] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("Apex Industrial Solutions");
  const [companyCode, setCompanyCode] = useState<string>("APEX");

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>("forest-copper");
  const [primaryColor, setPrimaryColor] = useState<string>("#173A2A");
  const [accentColor, setAccentColor] = useState<string>("#B87333");

  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [manualLogoUrl, setManualLogoUrl] = useState<string>("");

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
        const compId = data._id || data.id || "";
        setCompanyId(compId);
        setCompanyName(data.name || "Apex Industrial Solutions");
        setCompanyCode(data.code || "APEX");

        const brand = data.branding || {};
        const logo = data.logo || brand.logo || null;
        if (logo) {
          setLogoUrl(logo);
        }

        const loadedPrimary = brand.primaryColor || "#173A2A";
        const loadedAccent = brand.secondaryColor || brand.accentColor || "#B87333";
        const loadedTheme = brand.theme || "forest-copper";

        setPrimaryColor(loadedPrimary);
        setAccentColor(loadedAccent);
        setSelectedTheme(loadedTheme);

        // Apply immediately to current workspace
        applyTheme(loadedPrimary, loadedAccent);
      }
    } catch (_) {
      setCompanyId(user?.companyId || "my-company");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: ThemePreset) => {
    setSelectedTheme(preset.id);
    setPrimaryColor(preset.primary);
    setAccentColor(preset.copper);
  };

  const handleCustomPrimaryChange = (color: string) => {
    setPrimaryColor(color);
    setSelectedTheme("custom");
  };

  const handleCustomAccentChange = (color: string) => {
    setAccentColor(color);
    setSelectedTheme("custom");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image file size must be less than 10MB.");
      return;
    }

    setError(null);
    setUploading(true);

    // Immediate preview for instantaneous feedback
    const previewUrl = URL.createObjectURL(file);
    setLogoUrl(previewUrl);

    // Upload to server
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "company-logos");

      const uploadRes = await api.post<{ success: boolean; data: { fileUrl: string } }>(
        "/files/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (uploadRes && uploadRes.data && uploadRes.data.fileUrl) {
        setLogoUrl(uploadRes.data.fileUrl);
      }
    } catch (err: any) {
      console.warn("[Logo Upload Warning] Falling back to Data URL:", err);
      // Fallback: Read as base64 Data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setManualLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError(null);
  };

  const handleApplyManualLogoUrl = () => {
    if (manualLogoUrl.trim()) {
      setLogoUrl(manualLogoUrl.trim());
      setShowUrlInput(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const targetId = companyId || user?.companyId || "my-company";
      const payload = {
        logo: logoUrl || "",
        primaryColor,
        secondaryColor: accentColor,
        accentColor,
        theme: selectedTheme,
        displayName: companyName,
      };

      // Save to company branding
      await api.put(`/companies/${targetId}/branding`, payload);

      // Apply the selected colors globally to the application
      applyTheme(primaryColor, accentColor);

      setSuccess("Company branding, logo, and custom color palette saved successfully!");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to save company branding.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    const defaultTheme = PRESET_THEMES[0];
    setSelectedTheme(defaultTheme.id);
    setPrimaryColor(defaultTheme.primary);
    setAccentColor(defaultTheme.copper);
  };

  if (loading) {
    return (
      <div className="diws-page-loading">
        <span className="diws-spinner" style={{ width: "32px", height: "32px", borderTopColor: "var(--copper)" }} />
        <p>Loading branding options...</p>
      </div>
    );
  }

  const isCustom = selectedTheme === "custom";

  return (
    <div className="diws-page-container">
      {/* Page Header */}
      <div className="diws-page-header">
        <div>
          <h1 className="diws-page-title">Company Branding & Logo</h1>
          <p className="diws-page-subtitle">
            Upload your organization logo, choose from presets, or specify custom workspace colors.
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
            {/* Section 1: Emblem & Logo */}
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
                      size="sm"
                      icon={<Trash2 size={14} />}
                      onClick={handleRemoveLogo}
                    >
                      Remove Logo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<UploadCloud size={14} />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Logo
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </div>
              ) : (
                <>
                  <label className="diws-dropzone-label">
                    <input
                      ref={fileInputRef}
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
                        PNG, JPG, WebP, or SVG (Recommended 400x100px, max 10MB)
                      </p>
                    </div>
                  </label>

                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      className="text-xs text-amber-700 hover:underline flex items-center gap-1 ml-auto font-medium"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                    >
                      <LinkIcon size={12} />
                      {showUrlInput ? "Hide Direct URL" : "Or enter direct image URL"}
                    </button>
                  </div>

                  {showUrlInput && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        className="diws-input text-xs"
                        value={manualLogoUrl}
                        onChange={(e) => setManualLogoUrl(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleApplyManualLogoUrl}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="diws-divider" style={{ margin: "1.75rem 0" }} />

            {/* Section 2: Workspace Color Presets */}
            <div className="diws-card-header flex items-center justify-between">
              <div>
                <h3>Workspace Color Palette</h3>
                <p>Choose an accent preset or customize your workspace palette below.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<RefreshCw size={13} />}
                onClick={handleResetToDefault}
              >
                Reset Default
              </Button>
            </div>

            <div className="diws-theme-grid">
              {PRESET_THEMES.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <div
                    key={theme.id}
                    className={`diws-theme-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectPreset(theme)}
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

              {/* Custom Card indicator */}
              <div
                className={`diws-theme-card ${isCustom ? "selected" : ""}`}
                onClick={() => setSelectedTheme("custom")}
              >
                <div className="diws-theme-swatches">
                  <span className="diws-swatch" style={{ backgroundColor: primaryColor }} />
                  <span className="diws-swatch" style={{ backgroundColor: accentColor }} />
                </div>
                <div className="diws-theme-meta">
                  <div className="diws-theme-name flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-600" />
                    Custom Palette
                  </div>
                  <div className="diws-theme-desc">User-defined primary & accent hex colors.</div>
                </div>
                {isCustom && <CheckCircle2 size={18} className="diws-theme-check" />}
              </div>
            </div>

            {/* Section 3: Custom Color Selection Options */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <Sliders size={16} className="text-amber-700" />
                <h4 className="text-sm font-bold text-slate-900">Custom Color Selection Options</h4>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Select custom hex codes or click any swatch chip to customize your primary and highlight branding.
              </p>

              <div className="diws-custom-colors-grid">
                {/* 1. Primary Color */}
                <div className="diws-color-picker-box">
                  <label className="diws-color-picker-label">
                    <span>Primary Color (Header & Sidebar)</span>
                    <span className="font-mono text-xs text-slate-500">{primaryColor}</span>
                  </label>
                  <div className="diws-color-input-group">
                    <input
                      type="color"
                      className="diws-color-native-input"
                      value={primaryColor}
                      onChange={(e) => handleCustomPrimaryChange(e.target.value)}
                    />
                    <input
                      type="text"
                      className="diws-color-hex-field"
                      value={primaryColor}
                      maxLength={7}
                      onChange={(e) => handleCustomPrimaryChange(e.target.value)}
                    />
                  </div>

                  <div className="diws-swatches-row">
                    {PRIMARY_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        className={`diws-mini-swatch ${primaryColor.toLowerCase() === swatch.hex.toLowerCase() ? "active" : ""}`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.label}
                        onClick={() => handleCustomPrimaryChange(swatch.hex)}
                      />
                    ))}
                  </div>
                </div>

                {/* 2. Accent Color */}
                <div className="diws-color-picker-box">
                  <label className="diws-color-picker-label">
                    <span>Accent Highlight (Buttons & Badges)</span>
                    <span className="font-mono text-xs text-slate-500">{accentColor}</span>
                  </label>
                  <div className="diws-color-input-group">
                    <input
                      type="color"
                      className="diws-color-native-input"
                      value={accentColor}
                      onChange={(e) => handleCustomAccentChange(e.target.value)}
                    />
                    <input
                      type="text"
                      className="diws-color-hex-field"
                      value={accentColor}
                      maxLength={7}
                      onChange={(e) => handleCustomAccentChange(e.target.value)}
                    />
                  </div>

                  <div className="diws-swatches-row">
                    {ACCENT_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        className={`diws-mini-swatch ${accentColor.toLowerCase() === swatch.hex.toLowerCase() ? "active" : ""}`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.label}
                        onClick={() => handleCustomAccentChange(swatch.hex)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="diws-form-actions" style={{ marginTop: "2rem" }}>
              <Button
                type="submit"
                variant="copper"
                icon={<Save size={16} />}
                loading={saving}
              >
                Save Branding & Custom Colors
              </Button>
            </div>
          </form>
        </Card>

        {/* Live UI Mockup Preview Card */}
        <Card className="diws-preview-card">
          <div className="diws-card-header">
            <h3><Eye size={18} /> Live Header & Sidebar Preview</h3>
            <p>Real-time visual demonstration of your logo and custom palette:</p>
          </div>

          {/* Header Preview Bar */}
          <div className="diws-mockup-container">
            <div
              className="diws-mockup-header"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="diws-mockup-brand">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="diws-mockup-logo-img" />
                ) : (
                  <div className="diws-mockup-brand-placeholder">
                    <Building2 size={18} style={{ color: accentColor }} />
                    <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.9rem" }}>
                      {companyName}
                    </span>
                  </div>
                )}
              </div>

              <div className="diws-mockup-user">
                <span
                  className="diws-mockup-pill"
                  style={{ backgroundColor: accentColor, color: "#FFFFFF" }}
                >
                  [{companyCode}] Admin
                </span>
              </div>
            </div>

            {/* Sidebar & Content Mockup */}
            <div className="diws-mockup-body">
              <div className="diws-mockup-sidebar" style={{ backgroundColor: primaryColor }}>
                <div
                  className="diws-mockup-menu-item active"
                  style={{
                    backgroundColor: `${accentColor}33`,
                    borderLeft: `3px solid ${accentColor}`,
                    color: "#FFFFFF",
                  }}
                >
                  <span className="diws-mockup-dot" style={{ backgroundColor: accentColor }} />
                  Company Profile
                </div>
                <div className="diws-mockup-menu-item" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <span className="diws-mockup-dot" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
                  Regional Settings
                </div>
                <div className="diws-mockup-menu-item" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <span className="diws-mockup-dot" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
                  Subscription Plan
                </div>
              </div>

              <div className="diws-mockup-content">
                <div className="diws-mockup-card">
                  <div
                    className="diws-mockup-btn font-semibold text-xs py-2 px-3 rounded shadow-sm"
                    style={{ backgroundColor: primaryColor, color: "#FFFFFF" }}
                  >
                    Primary Action
                  </div>
                  <div
                    className="diws-mockup-btn font-semibold text-xs py-2 px-3 rounded shadow-sm"
                    style={{ backgroundColor: accentColor, color: "#FFFFFF" }}
                  >
                    Custom Highlight
                  </div>
                </div>

                <div className="p-3 bg-white rounded border border-slate-200 mt-2 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Primary Tone:</span>
                    <strong className="font-mono">{primaryColor}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Highlight Tone:</span>
                    <strong className="font-mono">{accentColor}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Palette Mode:</span>
                    <span className="capitalize font-semibold text-amber-700">
                      {selectedTheme.replace("-", " ")}
                    </span>
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
