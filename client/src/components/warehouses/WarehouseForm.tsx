import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import type { IWarehouse, WarehouseStatus, WarehouseType, IWarehouseUser } from "../../types/warehouse";
import { Button } from "../Button";
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Users,
  Boxes,
  Compass,
  Mail,
  Phone,
  AlertCircle,
  Check,
} from "lucide-react";
import "../../pages/warehouses/WarehousePages.css";

interface WarehouseFormProps {
  initialValues?: Partial<IWarehouse>;
  onSubmit: (formData: any) => Promise<void>;
  submitting: boolean;
  error?: string | null;
  mode: "create" | "edit";
  onCancel: () => void;
}

export const WarehouseForm: React.FC<WarehouseFormProps> = ({
  initialValues,
  onSubmit,
  submitting,
  error,
  mode,
  onCancel,
}) => {
  const [users, setUsers] = useState<IWarehouseUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [formData, setFormData] = useState({
    name: initialValues?.name || "",
    code: initialValues?.code || "",
    type: (initialValues?.type || "general") as WarehouseType,
    description: initialValues?.description || "",
    contactEmail: initialValues?.contactEmail || "",
    contactPhone: initialValues?.contactPhone || "",
    status: (initialValues?.status || "active") as WarehouseStatus,
    managerId:
      typeof initialValues?.managerId === "object" && initialValues?.managerId
        ? initialValues.managerId._id
        : (initialValues?.managerId as string) || "",

    // Location
    address: initialValues?.location?.address || initialValues?.address || "",
    city: initialValues?.location?.city || "",
    state: initialValues?.location?.state || "",
    country: initialValues?.location?.country || "",
    postalCode: initialValues?.location?.postalCode || "",
    latitude: initialValues?.location?.latitude !== undefined ? String(initialValues.location.latitude) : "",
    longitude: initialValues?.location?.longitude !== undefined ? String(initialValues.location.longitude) : "",

    // Capacity
    capacity: initialValues?.capacity !== undefined ? String(initialValues.capacity) : "0",
    currentUsage: initialValues?.currentUsage !== undefined ? String(initialValues.currentUsage) : "0",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get<{ success: boolean; data: IWarehouseUser[] }>("/users");
      if (response.data) {
        setUsers(response.data);
      }
    } catch (_) {
      // Ignore user list fetch error gracefully
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      type: formData.type,
      description: formData.description.trim() || undefined,
      contactEmail: formData.contactEmail.trim() || undefined,
      contactPhone: formData.contactPhone.trim() || undefined,
      status: formData.status,
      managerId: formData.managerId || undefined,
      address: formData.address.trim() || undefined,
      location: {
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || undefined,
        postalCode: formData.postalCode.trim() || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      },
      capacity: formData.capacity ? parseFloat(formData.capacity) : 0,
      currentUsage: formData.currentUsage ? parseFloat(formData.currentUsage) : 0,
    };

    onSubmit(payload);
  };

  // Capacity calculation preview
  const capVal = parseFloat(formData.capacity) || 0;
  const usageVal = parseFloat(formData.currentUsage) || 0;
  const usagePct = capVal > 0 ? Math.min(Math.round((usageVal / capVal) * 100), 100) : 0;

  return (
    <form onSubmit={handleSubmit} className="wh-form-layout">
      {error && (
        <div className="wh-alert error mb-4">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Basic Identification */}
      <div className="wh-form-card">
        <div className="form-card-header">
          <WarehouseIcon className="text-amber-600" size={20} />
          <h2>1. Warehouse Identification & Classification</h2>
        </div>
        <div className="form-card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label required">Warehouse Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Central Logistics Hub Alpha"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label required">Warehouse Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. WH-ALPHA-01"
                className="form-input font-mono uppercase"
                required
              />
              <span className="text-xs text-slate-500 mt-1 block">Unique code per company.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="form-label required">Facility Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="general">General Storage Warehouse</option>
                <option value="raw_material">Raw Materials Storage</option>
                <option value="finished_goods">Finished Goods Depot</option>
                <option value="distribution">Distribution Hub</option>
                <option value="cold_storage">Cold Storage & Refrigerated</option>
              </select>
            </div>

            <div>
              <label className="form-label required">Operational Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="active">Active (Operational)</option>
                <option value="maintenance">Maintenance</option>
                <option value="full">Full (Capacity Reached)</option>
                <option value="inactive">Inactive</option>
                <option value="closed">Closed (Shutdown)</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="form-label">Warehouse Description / Scope</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Operational details, supported inventory categories, access rules..."
              className="form-textarea"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="form-label">Contact Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="warehouse-manager@company.com"
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
                  onChange={handleChange}
                  placeholder="+1 (555) 019-2834"
                  className="form-input pl-9"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Physical Address & Location */}
      <div className="wh-form-card">
        <div className="form-card-header">
          <MapPin className="text-amber-600" size={20} />
          <h2>2. Physical Address & GPS Pin</h2>
        </div>
        <div className="form-card-body">
          <div className="mb-4">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="75 Logistics Way, Dock 4"
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
                onChange={handleChange}
                placeholder="Chicago"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">State / Province</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Illinois"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
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
                onChange={handleChange}
                placeholder="60601"
                className="form-input"
              />
            </div>
          </div>

          {/* GPS Coordinates subcard */}
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
                <span>Use Current Location</span>
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
                  onChange={handleChange}
                  placeholder="e.g. 41.878113"
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
                  onChange={handleChange}
                  placeholder="e.g. -87.629799"
                  className="form-input text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Storage Capacity */}
      <div className="wh-form-card">
        <div className="form-card-header">
          <Boxes className="text-amber-600" size={20} />
          <h2>3. Storage Capacity & Usage</h2>
        </div>
        <div className="form-card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Total Storage Capacity (Units / Vol)</label>
              <input
                type="number"
                min="0"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="e.g. 10000"
                className="form-input"
              />
              <span className="text-xs text-slate-500 mt-1 block">Maximum total capacity limit.</span>
            </div>

            <div>
              <label className="form-label">Current Occupied Volume / Usage</label>
              <input
                type="number"
                min="0"
                name="currentUsage"
                value={formData.currentUsage}
                onChange={handleChange}
                placeholder="e.g. 4500"
                className="form-input"
              />
              <span className="text-xs text-slate-500 mt-1 block">Current occupied quantity.</span>
            </div>
          </div>

          {/* Utilization Preview */}
          <div className="mt-4 p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Calculated Storage Utilization:</span>
              <span className="text-amber-800 font-bold">{usagePct}% Occupied</span>
            </div>
            <div className="wh-progress-bg">
              <div
                className={`wh-progress-fill ${
                  usagePct >= 90 ? "danger" : usagePct >= 75 ? "warning" : "normal"
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Warehouse Manager */}
      <div className="wh-form-card">
        <div className="form-card-header">
          <Users className="text-amber-600" size={20} />
          <h2>4. Warehouse Site Manager</h2>
        </div>
        <div className="form-card-body">
          <div>
            <label className="form-label">Assigned Site Manager</label>
            <select
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              className="form-select"
              disabled={loadingUsers}
            >
              <option value="">-- Select Warehouse Manager (Optional) --</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.firstName} {u.lastName} ({u.email}) {u.role ? `- ${u.role}` : ""}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500 mt-1 block">
              Assign an active team member responsible for this warehouse facility.
            </span>
          </div>
        </div>
      </div>

      {/* Form Buttons */}
      <div className="wh-form-actions">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="copper" loading={submitting} icon={<Check size={18} />}>
          {mode === "create" ? "Create Warehouse" : "Update Warehouse"}
        </Button>
      </div>
    </form>
  );
};

export default WarehouseForm;
