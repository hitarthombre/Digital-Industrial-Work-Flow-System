import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import type { IFactory, IFactoryUser, FactoryStatus } from "../../types/factory";
import { Button } from "../../components/Button";
import {
  MapPin,
  Users,
  Gauge,
  ArrowLeft,
  Check,
  AlertCircle,
  Building2,
  Layers,
  Compass,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import "./FactoryPages.css";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const EditFactory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<IFactoryUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    status: "active" as FactoryStatus,
    managerId: "",

    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",

    latitude: "",
    longitude: "",

    capacity: "",
    totalSqFt: "",
    shiftCount: "1",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    operatingHours: "08:00 - 17:00",
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch factory details and users list concurrently
      const [facRes, userRes] = await Promise.all([
        api.get<{ success: boolean; data: IFactory }>(`/factories/${id}`),
        api.get<{ success: boolean; data: IFactoryUser[] }>("/users").catch(() => ({ data: [] })),
      ]);

      if (userRes.data) {
        setUsers(userRes.data);
      }

      if (facRes.data) {
        const fac = facRes.data;
        const loc = fac.location || {};
        const mgrId =
          typeof fac.managerId === "object" && fac.managerId
            ? fac.managerId._id
            : typeof fac.managerId === "string"
            ? fac.managerId
            : "";

        setFormData({
          name: fac.name || "",
          code: fac.code || "",
          description: fac.description || "",
          contactEmail: fac.contactEmail || "",
          contactPhone: fac.contactPhone || "",
          status: fac.status || "active",
          managerId: mgrId,

          address: loc.address || "",
          city: loc.city || "",
          state: loc.state || "",
          country: loc.country || "",
          postalCode: loc.postalCode || "",

          latitude: loc.latitude !== undefined ? String(loc.latitude) : "",
          longitude: loc.longitude !== undefined ? String(loc.longitude) : "",

          capacity: fac.capacity !== undefined ? String(fac.capacity) : "",
          totalSqFt: fac.totalSqFt !== undefined ? String(fac.totalSqFt) : "",
          shiftCount: fac.shiftCount !== undefined ? String(fac.shiftCount) : "1",
          workingDays: fac.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          operatingHours: fac.operatingHours || "08:00 - 17:00",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load factory data for editing.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWorkingDayToggle = (day: string) => {
    setFormData((prev) => {
      const exists = prev.workingDays.includes(day);
      const nextDays = exists
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: nextDays };
    });
  };

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          }));
        },
        (err) => {
          alert("Unable to fetch current GPS coordinates: " + err.message);
        }
      );
    } else {
      alert("Geolocation service is not supported by your browser.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.name.trim()) {
      setError("Factory Name is required.");
      return;
    }
    if (!formData.code.trim()) {
      setError("Factory Code is required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        status: formData.status,
        managerId: formData.managerId || null,
        location: {
          address: formData.address.trim() || undefined,
          city: formData.city.trim() || undefined,
          state: formData.state.trim() || undefined,
          country: formData.country.trim() || undefined,
          postalCode: formData.postalCode.trim() || undefined,
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        },
        capacity: formData.capacity ? parseFloat(formData.capacity) : undefined,
        totalSqFt: formData.totalSqFt ? parseFloat(formData.totalSqFt) : undefined,
        shiftCount: parseInt(formData.shiftCount, 10),
        workingDays: formData.workingDays,
        operatingHours: formData.operatingHours.trim() || undefined,
      };

      await api.put(`/factories/${id}`, payload);

      setSuccessMsg("Factory details updated successfully! Redirecting...");
      setTimeout(() => {
        navigate(`/app/factories/${id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to update factory details.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="factory-page-container">
        <div className="factory-loading-box py-16">
          <RefreshCw className="animate-spin text-amber-600 mb-2" size={36} />
          <p className="text-slate-600 font-medium">Loading factory configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="factory-page-container">
      {/* Top Header */}
      <div className="factory-page-header">
        <div>
          <button
            onClick={() => navigate(`/app/factories/${id}`)}
            className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800 mb-2 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Cancel & Back to Details</span>
          </button>
          <h1 className="factory-page-title">Edit Factory Specification</h1>
          <p className="factory-page-subtitle">
            Update metadata, GPS coordinates, capacity thresholds, shift schedule, or assigned manager.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="factory-alert error mb-4">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="factory-alert success mb-4">
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="factory-form-layout">
        {/* SECTION 1: Basic Details */}
        <div className="factory-form-card">
          <div className="form-card-header">
            <Building2 className="text-amber-600" size={20} />
            <h2>1. Basic Plant Identification</h2>
          </div>
          <div className="form-card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label required">Factory Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Detroit General Assembly Plant"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label required">Factory Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g. PLANT-A or FAC-01"
                  className="form-input font-mono uppercase"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="form-label">Plant Description / Scope</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief summary of manufacturing capabilities..."
                className="form-textarea"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="form-label">Contact Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="site-manager@company.com"
                    className="form-input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Contact Phone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 019-2834"
                    className="form-input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Operational Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="active">Active (Operational)</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive (Standby)</option>
                  <option value="closed">Closed (Shutdown)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Physical Address & Location */}
        <div className="factory-form-card">
          <div className="form-card-header">
            <MapPin className="text-amber-600" size={20} />
            <h2>2. Physical Address & GPS Coordinates</h2>
          </div>
          <div className="form-card-body">
            <div className="mb-4">
              <label className="form-label">Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="100 Industrial Parkway"
                className="form-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Detroit"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">State / Province</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Michigan"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="United States"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Postal / Zip Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="48201"
                  className="form-input"
                />
              </div>
            </div>

            {/* GPS Pin Sub-section */}
            <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Compass className="text-amber-600" size={18} />
                  <span className="font-semibold text-slate-800 text-sm">GPS Coordinates</span>
                </div>
                <button
                  type="button"
                  onClick={handleGeolocate}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Compass size={14} />
                  <span>Update Location Pin</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="e.g. 42.331427"
                    className="form-input text-sm"
                  />
                </div>

                <div>
                  <label className="form-label text-xs">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="e.g. -83.045754"
                    className="form-input text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Plant Capacity & Operating Shifts */}
        <div className="factory-form-card">
          <div className="form-card-header">
            <Gauge className="text-amber-600" size={20} />
            <h2>3. Capacity & Operating Hours</h2>
          </div>
          <div className="form-card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Max Daily Units Quota</label>
                <div className="relative">
                  <Gauge size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="e.g. 5000"
                    className="form-input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Total Square Feet (Area)</label>
                <div className="relative">
                  <Layers size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="number"
                    name="totalSqFt"
                    value={formData.totalSqFt}
                    onChange={handleInputChange}
                    placeholder="e.g. 120000"
                    className="form-input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Daily Shift Count</label>
                <select
                  name="shiftCount"
                  value={formData.shiftCount}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="1">1 Shift / Day (8 hours)</option>
                  <option value="2">2 Shifts / Day (16 hours)</option>
                  <option value="3">3 Shifts / Day (24 hours)</option>
                </select>
              </div>
            </div>

            {/* Operating Days pills */}
            <div className="mt-4">
              <label className="form-label">Operating Days of Week</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = formData.workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleWorkingDayToggle(day)}
                      className={`day-pill ${isSelected ? "selected" : ""}`}
                    >
                      {isSelected && <Check size={14} className="inline mr-1" />}
                      <span>{day}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Factory Manager Assignment */}
        <div className="factory-form-card">
          <div className="form-card-header">
            <Users className="text-amber-600" size={20} />
            <h2>4. Factory Site Manager</h2>
          </div>
          <div className="form-card-body">
            <div>
              <label className="form-label">Assigned Factory Manager</label>
              <select
                name="managerId"
                value={formData.managerId}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">-- Unassigned --</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} ({user.email}) {user.role ? `- ${user.role}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="factory-form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/app/factories/${id}`)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="copper" loading={submitting}>
            Update Factory Details
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditFactory;
