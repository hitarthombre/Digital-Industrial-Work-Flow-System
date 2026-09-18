import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import type { IWarehouse, WarehouseSingleResponse } from "../../types/warehouse";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import TransferModal from "../../components/warehouses/TransferModal";
import {
  MapPin,
  Users,
  ArrowLeft,
  Edit,
  ArrowRightLeft,
  Compass,
  Mail,
  Phone,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Wrench,
  XCircle,
  Clock,
  Gauge,
  Calendar,
} from "lucide-react";
import "./WarehousePages.css";

export const WarehouseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState<IWarehouse | null>(null);
  const [allWarehouses, setAllWarehouses] = useState<IWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchWarehouseDetails(id);
      fetchAllWarehouses();
    }
  }, [id]);

  const fetchWarehouseDetails = async (whId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<WarehouseSingleResponse>(`/warehouses/${whId}`);
      if (response.data) {
        setWarehouse(response.data);
      } else {
        setError("Warehouse record not found.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load warehouse details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllWarehouses = async () => {
    try {
      const res = await api.get<{ success: boolean; data: IWarehouse[] }>("/warehouses?limit=100");
      if (res.data) {
        setAllWarehouses(res.data);
      }
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="wh-page-container">
        <div className="wh-loading-box">
          <RefreshCw className="animate-spin text-amber-600 mb-2" size={32} />
          <p className="text-slate-600 font-medium">Fetching warehouse telemetry & details...</p>
        </div>
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div className="wh-page-container">
        <button
          onClick={() => navigate("/app/warehouses")}
          className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Warehouse Logistics</span>
        </button>
        <div className="wh-alert error">
          <AlertTriangle size={18} />
          <span>{error || "Warehouse location not found."}</span>
        </div>
      </div>
    );
  }

  const cap = warehouse.capacity || 0;
  const usage = warehouse.currentUsage || 0;
  const avail = warehouse.availableCapacity !== undefined
    ? warehouse.availableCapacity
    : Math.max(0, cap - usage);
  const pct = warehouse.utilizationPercentage !== undefined
    ? warehouse.utilizationPercentage
    : cap > 0
    ? Math.round((usage / cap) * 100)
    : 0;

  const loc = warehouse.location || {};
  const manager = typeof warehouse.managerId === "object" ? warehouse.managerId : null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "active";
      case "maintenance":
        return "maintenance";
      case "full":
        return "closed";
      case "inactive":
        return "inactive";
      case "closed":
        return "closed";
      default:
        return "neutral";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 size={13} />;
      case "maintenance":
        return <Wrench size={13} />;
      case "full":
        return <AlertTriangle size={13} />;
      case "inactive":
        return <Clock size={13} />;
      case "closed":
        return <XCircle size={13} />;
    }
  };

  return (
    <div className="wh-page-container">
      {/* Back Link */}
      <button
        onClick={() => navigate("/app/warehouses")}
        className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800 mb-4 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Back to Warehouse List</span>
      </button>

      {/* Header Banner */}
      <div className="wh-header-banner">
        <div>
          <div className="banner-meta-bar mb-2">
            <span className="wh-code-badge large">{warehouse.code}</span>
            <span className={`wh-type-badge ${warehouse.type}`}>
              {warehouse.type.replace("_", " ")}
            </span>
            <Badge
              variant={getStatusBadgeVariant(warehouse.status)}
              size="sm"
              icon={getStatusIcon(warehouse.status)}
            >
              {warehouse.status}
            </Badge>
          </div>
          <h1 className="banner-title">{warehouse.name}</h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            {warehouse.description || "Operational storage depot and inventory distribution site."}
          </p>
        </div>

        <div className="banner-actions">
          <Button
            variant="outline"
            icon={<Edit size={16} />}
            onClick={() => navigate(`/app/warehouses/${warehouse._id}/edit`)}
          >
            Edit Warehouse
          </Button>
          <Button
            variant="copper"
            icon={<ArrowRightLeft size={16} />}
            onClick={() => setIsTransferModalOpen(true)}
          >
            Stock Transfer
          </Button>
        </div>
      </div>

      {/* Grid Content Cards */}
      <div className="tab-content-grid">
        {/* CARD 1: Capacity & Utilization Gauge */}
        <div className="details-card">
          <div className="details-card-header">
            <div className="flex items-center gap-2">
              <Gauge className="text-amber-600" size={20} />
              <h3 className="font-bold text-slate-800 text-base">Storage Capacity & Utilization</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Telemetry
            </span>
          </div>

          <div className="details-card-body">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
              {/* SVG Meter */}
              <div className="gauge-meter-wrapper">
                <svg className="gauge-svg" viewBox="0 0 100 100">
                  <path
                    d="M 20,80 A 40,40 0 1,1 80,80"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 20,80 A 40,40 0 1,1 80,80"
                    fill="none"
                    stroke={pct >= 90 ? "#ef4444" : pct >= 75 ? "#f59e0b" : "#d97706"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="188.49"
                    strokeDashoffset={188.49 - (188.49 * (pct / 100))}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <div className="gauge-center-content">
                  <span className="gauge-value">{pct}%</span>
                  <span className="gauge-label">Occupied</span>
                </div>
              </div>

              {/* Stat breakdown */}
              <div className="flex-1 space-y-3 w-full">
                <div className="capacity-stat-box">
                  <span className="text-xs text-slate-500 font-semibold uppercase block">
                    Current Usage Volume
                  </span>
                  <span className="text-2xl font-extrabold text-amber-800">
                    {usage.toLocaleString()} <span className="text-sm font-normal text-slate-600">units</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-xs text-slate-500 font-semibold block">Total Capacity</span>
                    <span className="text-lg font-bold text-slate-900">
                      {cap.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-xs text-slate-500 font-semibold block">Available Space</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {avail.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Occupancy Level</span>
                <span>{usage.toLocaleString()} of {cap.toLocaleString()} Units</span>
              </div>
              <div className="wh-progress-bg" style={{ height: 10 }}>
                <div
                  className={`wh-progress-fill ${
                    pct >= 90 ? "danger" : pct >= 75 ? "warning" : "normal"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Physical Location & Radar GPS Map */}
        <div className="details-card">
          <div className="details-card-header">
            <div className="flex items-center gap-2">
              <MapPin className="text-amber-600" size={20} />
              <h3 className="font-bold text-slate-800 text-base">GPS Location & Address</h3>
            </div>
            {loc.latitude && loc.longitude && (
              <span className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                GPS PIN SET
              </span>
            )}
          </div>

          <div className="details-card-body flex flex-col gap-4">
            <div className="address-item">
              <span className="label">Street Address</span>
              <span className="value">{loc.address || warehouse.address || "Address Not Specified"}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="address-item">
                <span className="label">City / Region</span>
                <span className="value">{loc.city || "—"}</span>
              </div>
              <div className="address-item">
                <span className="label">State / Province</span>
                <span className="value">{loc.state || "—"}</span>
              </div>
              <div className="address-item">
                <span className="label">Country</span>
                <span className="value">{loc.country || "—"}</span>
              </div>
              <div className="address-item">
                <span className="label">Postal Code</span>
                <span className="value">{loc.postalCode || "—"}</span>
              </div>
            </div>

            {/* Interactive Radar Map View */}
            <div className="gps-map-viewer">
              <div className="map-grid-pattern" />

              <div className="map-marker-pin">
                <div className="pin-head">
                  <Compass size={22} className="text-white" />
                </div>
                <div className="pin-pulse" />
              </div>

              <div className="map-overlay-card">
                <div className="text-xs font-bold text-slate-900">{warehouse.name}</div>
                <div className="text-[11px] font-mono text-amber-800">
                  Lat: {loc.latitude || "41.8781"}, Lng: {loc.longitude || "-87.6297"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Manager & Contact Info */}
        <div className="details-card">
          <div className="details-card-header">
            <div className="flex items-center gap-2">
              <Users className="text-amber-600" size={20} />
              <h3 className="font-bold text-slate-800 text-base">Site Manager & Contacts</h3>
            </div>
          </div>

          <div className="details-card-body space-y-4">
            {manager ? (
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-lg shadow">
                  {manager.firstName[0]}
                  {manager.lastName[0]}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {manager.firstName} {manager.lastName}
                  </h4>
                  <p className="text-xs text-slate-500 capitalize">
                    {manager.role || "Warehouse Manager"}
                  </p>
                  <p className="text-xs text-amber-800 font-medium">{manager.email}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm italic">
                No site manager assigned to this warehouse facility yet.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-3">
                <Mail className="text-amber-600 flex-shrink-0" size={18} />
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                    Contact Email
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    {warehouse.contactEmail || "Not specified"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-3">
                <Phone className="text-amber-600 flex-shrink-0" size={18} />
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                    Contact Phone
                  </span>
                  <span className="text-xs font-bold text-slate-800 block">
                    {warehouse.contactPhone || "Not specified"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: Operations & Transfer Summary */}
        <div className="details-card">
          <div className="details-card-header">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="text-amber-600" size={20} />
              <h3 className="font-bold text-slate-800 text-base">Stock Transfer Operations</h3>
            </div>
          </div>

          <div className="details-card-body space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Initiate instant stock transfers to shift inventory from <strong>{warehouse.name}</strong> to any active receiving depot in your network.
            </p>

            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 block">Available Transfer Capacity</span>
                <span className="text-lg font-extrabold text-amber-800">
                  {usage.toLocaleString()} Units Ready
                </span>
              </div>
              <Button
                variant="copper"
                size="sm"
                icon={<ArrowRightLeft size={14} />}
                onClick={() => setIsTransferModalOpen(true)}
              >
                Initiate Transfer
              </Button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-2 border-t border-slate-100">
              <Calendar size={13} />
              <span>Created on {new Date(warehouse.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Transfer Modal */}
      {isTransferModalOpen && (
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          warehouses={allWarehouses.length > 0 ? allWarehouses : [warehouse]}
          initialSourceId={warehouse._id}
          onSuccess={() => fetchWarehouseDetails(warehouse._id)}
        />
      )}
    </div>
  );
};

export default WarehouseDetails;
