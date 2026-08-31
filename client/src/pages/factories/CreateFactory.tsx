import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import type { IFactoryUser, FactoryStatus } from "../../types/factory";
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
} from "lucide-react";
import "./FactoryPages.css";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const CreateFactory: React.FC = () => {
  const navigate = useNavigate();

  // Loading states
  const [users, setUsers] = useState<IFactoryUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    // Basic Details
    name: "",
    code: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    status: "active" as FactoryStatus,
    managerId: "",

    // Physical Address
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",

    // GPS Coordinates
    latitude: "",
    longitude: "",

    // Plant Capacity & Shifts
    capacity: "",
    totalSqFt: "",
    shiftCount: "1",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    operatingHours: "08:00 - 17:00",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get<{ success: boolean; data: IFactoryUser[] }>("/users");
      if (response.data) {
        setUsers(response.data);
      }
    } catch (_) {
      // Ignore user load failure gracefully
    } finally {
      setLoadingUsers(false);
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

    // Validation
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
        managerId: formData.managerId || undefined,
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

      await api.post("/factories", payload);

      setSuccessMsg("Factory site created successfully! Redirecting...");
      setTimeout(() => {
        navigate("/app/factories");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to create factory location.");
      setSubmitting(false);
    }
  };

  return (
    <div className="factory-page-container">
      {/* Top Header */}
      <div className="factory-page-header">
        <div>
          <button
            onClick={() => navigate("/app/factories")}
            className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800 mb-2 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Factory Network</span>
          </button>
          <h1 className="factory-page-title">Create New Factory Facility</h1>
          <p className="factory-page-subtitle">
            Configure metadata, GPS coordinates, daily capacity quotas, shift breakdowns, and assign site manager.
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
                <span className="text-xs text-slate-500 mt-1 block">Unique uppercase identifier for this site.</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="form-label">Plant Description / Scope</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief summary of manufacturing capabilities, main products built, and operational purpose..."
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
                <label className="form-label">Initial Operational Status</label>
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
                placeholder="100 Industrial Parkway, Building B"
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
                  <span className="font-semibold text-slate-800 text-sm">GPS Map Pin Coordinates</span>
                </div>
                <button
                  type="button"
                  onClick={handleGeolocate}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Compass size={14} />
                  <span>Use My Current Location</span>
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
            <h2>3. Production Capacity & Operating Hours</h2>
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
                <span className="text-xs text-slate-500 mt-1 block">Maximum units produced per 24h.</span>
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
                <span className="text-xs text-slate-500 mt-1 block">Plant floor size in sq ft.</span>
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
                  <option value="3">3 Shifts / Day (24 hours - 3x8h)</option>
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
                disabled={loadingUsers}
              >
                <option value="">-- Select Factory Manager (Optional) --</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} ({user.email}) {user.role ? `- ${user.role}` : ""}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500 mt-1 block">
                Select from active company users. You can also assign or change the manager later.
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="factory-form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/app/factories")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="copper" loading={submitting}>
            Save Factory Facility
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateFactory;
