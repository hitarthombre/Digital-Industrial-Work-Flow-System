import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import type { IFactory, FactoryStatus } from "../../types/factory";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import FactoryStatusModal from "../../components/factories/FactoryStatusModal";
import AssignManagerModal from "../../components/factories/AssignManagerModal";
import {
  Factory,
  MapPin,
  Users,
  Gauge,
  Clock,
  ArrowLeft,
  Edit,
  RefreshCw,
  UserCheck,
  Compass,
  Mail,
  Phone,
  ExternalLink,
  Warehouse,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Wrench,
  XCircle,
  Shield,
} from "lucide-react";
import "./FactoryPages.css";

export const FactoryDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [factory, setFactory] = useState<IFactory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State: overview | map | operations
  const [activeTab, setActiveTab] = useState<"overview" | "map" | "operations">("overview");

  // Modals state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFactoryDetails();
    }
  }, [id]);

  const fetchFactoryDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ success: boolean; data: IFactory }>(`/factories/${id}`);
      if (response.data) {
        setFactory(response.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load factory details.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: FactoryStatus) => {
    switch (status) {
      case "active":
        return "active";
      case "maintenance":
        return "maintenance";
      case "inactive":
        return "inactive";
      case "closed":
        return "closed";
      default:
        return "neutral";
    }
  };

  const getStatusIcon = (status: FactoryStatus) => {
    switch (status) {
      case "active":
        return <CheckCircle2 size={14} />;
      case "maintenance":
        return <Wrench size={14} />;
      case "inactive":
        return <Clock size={14} />;
      case "closed":
        return <XCircle size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="factory-page-container">
        <div className="factory-loading-box py-16">
          <RefreshCw className="animate-spin text-amber-600 mb-2" size={36} />
          <p className="text-slate-600 font-medium">Loading factory profile & site metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !factory) {
    return (
      <div className="factory-page-container">
        <button
          onClick={() => navigate("/app/factories")}
          className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800 mb-4"
        >
          <ArrowLeft size={16} />
          <span>Back to Factory List</span>
        </button>

        <div className="factory-alert error">
          <AlertCircle size={20} />
          <span>{error || "Factory record not found."}</span>
        </div>
      </div>
    );
  }

  const manager =
    typeof factory.managerId === "object" && factory.managerId ? factory.managerId : null;

  const loc = factory.location || {};
  const lat = loc.latitude || 42.331427;
  const lng = loc.longitude || -83.045754;

  const locationSummary = [loc.city, loc.state, loc.country].filter(Boolean).join(", ") || loc.address || "Location set";

  // Capacity calculation gauge calculations
  const dailyQuota = factory.capacity || 5000;
  const currentOutput = Math.round(dailyQuota * 0.82); // 82% utilization demo
  const utilizationPct = Math.round((currentOutput / dailyQuota) * 100);

  return (
    <div className="factory-page-container">
      {/* Back button & Breadcrumb */}
      <button
        onClick={() => navigate("/app/factories")}
        className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800 mb-3 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back to All Factories</span>
      </button>

      {/* HEADER BANNER CARD */}
      <div className="factory-header-banner">
        <div className="banner-main-info">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="factory-code-badge large">{factory.code}</span>
            <Badge
              variant={getStatusBadgeVariant(factory.status)}
              size="md"
              icon={getStatusIcon(factory.status)}
            >
              {factory.status}
            </Badge>
          </div>

          <h1 className="banner-title">{factory.name}</h1>

          <div className="banner-meta-bar">
            <span className="meta-badge">
              <MapPin size={14} className="text-amber-600" />
              {locationSummary}
            </span>
            <span className="meta-badge">
              <Users size={14} className="text-amber-600" />
              Manager: {manager ? `${manager.firstName} ${manager.lastName}` : "Unassigned"}
            </span>
            {factory.operatingHours && (
              <span className="meta-badge">
                <Clock size={14} className="text-amber-600" />
                {factory.operatingHours}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="banner-actions">
          <Button
            variant="outline"
            icon={<Edit size={16} />}
            onClick={() => navigate(`/app/factories/${factory._id}/edit`)}
          >
            Edit Details
          </Button>

          <Button
            variant="secondary"
            icon={<RefreshCw size={16} />}
            onClick={() => setIsStatusModalOpen(true)}
          >
            Change Status
          </Button>

          <Button
            variant="copper"
            icon={<UserCheck size={16} />}
            onClick={() => setIsManagerModalOpen(true)}
          >
            Assign Manager
          </Button>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="factory-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Gauge size={18} />
          <span>Overview & Capacity</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "map" ? "active" : ""}`}
          onClick={() => setActiveTab("map")}
        >
          <MapPin size={18} />
          <span>Location Map</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "operations" ? "active" : ""}`}
          onClick={() => setActiveTab("operations")}
        >
          <Cpu size={18} />
          <span>Workspaces & Operations</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & CAPACITY */}
      {activeTab === "overview" && (
        <div className="tab-content-grid">
          {/* Gauge Meter & Capacity Stats */}
          <div className="details-card">
            <div className="details-card-header">
              <div className="flex items-center gap-2">
                <Gauge size={20} className="text-amber-600" />
                <h3 className="font-bold text-slate-900 text-lg">Daily Capacity Gauge</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                82% Utilization
              </span>
            </div>

            <div className="details-card-body flex flex-col md:flex-row items-center gap-8 py-4">
              {/* Circular Arc SVG Gauge */}
              <div className="gauge-meter-wrapper">
                <svg className="gauge-svg" viewBox="0 0 160 160">
                  {/* Outer Track */}
                  <path
                    d="M 20 120 A 70 70 0 1 1 140 120"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  {/* Gauge Arc Progress */}
                  <path
                    d="M 20 120 A 70 70 0 1 1 140 120"
                    fill="none"
                    stroke="url(#amberGradient)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray="330"
                    strokeDashoffset={330 - (330 * 0.82)}
                  />
                  <defs>
                    <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#d97706" />
                      <stop offset="100%" stopColor="#b87333" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="gauge-center-content">
                  <span className="gauge-value">{utilizationPct}%</span>
                  <span className="gauge-label">Capacity Used</span>
                </div>
              </div>

              {/* Gauge Breakdown Info */}
              <div className="flex-1 space-y-4 w-full">
                <div className="capacity-stat-box">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Max Daily Production Quota
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                    {dailyQuota.toLocaleString()} <span className="text-sm font-normal text-slate-500">Units / 24h</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="stat-subcard">
                    <span className="text-xs text-slate-500">Current Output</span>
                    <span className="text-lg font-bold text-emerald-700">{currentOutput.toLocaleString()} units</span>
                  </div>

                  <div className="stat-subcard">
                    <span className="text-xs text-slate-500">Reserve Headroom</span>
                    <span className="text-lg font-bold text-amber-700">
                      {(dailyQuota - currentOutput).toLocaleString()} units
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plant Floor & Shift Breakdown */}
          <div className="details-card">
            <div className="details-card-header">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-amber-600" />
                <h3 className="font-bold text-slate-900 text-lg">Shift & Operating Hours</h3>
              </div>
            </div>

            <div className="details-card-body space-y-4">
              <div className="shift-timeline-card">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-800">Shift Configuration</span>
                  <span className="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">
                    {factory.shiftCount || 1} Shift(s) Active
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="shift-badge-row active">
                    <div className="flex items-center gap-2">
                      <span className="shift-num">Shift 1</span>
                      <span className="shift-name">Day Shift (08:00 - 16:00)</span>
                    </div>
                    <Badge variant="active" size="sm">Operational</Badge>
                  </div>

                  {(factory.shiftCount || 1) >= 2 && (
                    <div className="shift-badge-row active">
                      <div className="flex items-center gap-2">
                        <span className="shift-num">Shift 2</span>
                        <span className="shift-name">Evening Shift (16:00 - 00:00)</span>
                      </div>
                      <Badge variant="active" size="sm">Operational</Badge>
                    </div>
                  )}

                  {(factory.shiftCount || 1) >= 3 && (
                    <div className="shift-badge-row active">
                      <div className="flex items-center gap-2">
                        <span className="shift-num">Shift 3</span>
                        <span className="shift-name">Night Shift (00:00 - 08:00)</span>
                      </div>
                      <Badge variant="active" size="sm">Operational</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Floor Area Stats */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="stat-subcard">
                  <span className="text-xs text-slate-500">Plant Floor Size</span>
                  <span className="text-base font-bold text-slate-800">
                    {factory.totalSqFt ? `${factory.totalSqFt.toLocaleString()} sq ft` : "Not Specified"}
                  </span>
                </div>

                <div className="stat-subcard">
                  <span className="text-xs text-slate-500">Working Days</span>
                  <span className="text-base font-bold text-slate-800">
                    {factory.workingDays?.length ? `${factory.workingDays.length} Days/wk` : "5 Days/wk"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Manager Contact Card */}
          <div className="details-card md:col-span-2">
            <div className="details-card-header">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-amber-600" />
                <h3 className="font-bold text-slate-900 text-lg">Assigned Plant Manager Contact Card</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<UserCheck size={14} />}
                onClick={() => setIsManagerModalOpen(true)}
              >
                Reassign Manager
              </Button>
            </div>

            <div className="details-card-body">
              {manager ? (
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="manager-large-avatar">
                    {manager.firstName?.[0]}
                    {manager.lastName?.[0]}
                  </div>

                  <div className="flex-1 space-y-1 text-center sm:text-left">
                    <h4 className="text-lg font-bold text-slate-900">
                      {manager.firstName} {manager.lastName}
                    </h4>
                    <p className="text-xs font-medium text-amber-700 bg-amber-100 inline-block px-2.5 py-0.5 rounded">
                      <Shield size={12} className="inline mr-1" />
                      {manager.role || "Factory Manager"}
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600 pt-2">
                      <span className="flex items-center gap-1">
                        <Mail size={13} className="text-slate-400" />
                        {manager.email}
                      </span>
                      {manager.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={13} className="text-slate-400" />
                          {manager.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <Users size={32} className="mx-auto text-slate-300 mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm">No Manager Currently Assigned</h4>
                  <p className="text-slate-500 text-xs mt-1 mb-3">
                    Assigning a site manager enables automated work order notifications and audit logs for this site.
                  </p>
                  <Button
                    variant="copper"
                    size="sm"
                    icon={<UserCheck size={14} />}
                    onClick={() => setIsManagerModalOpen(true)}
                  >
                    Assign Factory Manager
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOCATION MAP */}
      {activeTab === "map" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Address Breakdown */}
          <div className="details-card">
            <div className="details-card-header">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-amber-600" />
                <h3 className="font-bold text-slate-900 text-lg">Physical Address</h3>
              </div>
            </div>

            <div className="details-card-body space-y-3">
              <div className="address-item">
                <span className="label">Street Address</span>
                <span className="value">{loc.address || "Not specified"}</span>
              </div>

              <div className="address-item">
                <span className="label">City</span>
                <span className="value">{loc.city || "Not specified"}</span>
              </div>

              <div className="address-item">
                <span className="label">State / Region</span>
                <span className="value">{loc.state || "Not specified"}</span>
              </div>

              <div className="address-item">
                <span className="label">Country</span>
                <span className="value">{loc.country || "Not specified"}</span>
              </div>

              <div className="address-item">
                <span className="label">Postal / ZIP Code</span>
                <span className="value">{loc.postalCode || "Not specified"}</span>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Open in External Google Maps</span>
                </a>
              </div>
            </div>
          </div>

          {/* Interactive GPS Location Map */}
          <div className="details-card md:col-span-2">
            <div className="details-card-header">
              <div className="flex items-center gap-2">
                <Compass size={20} className="text-amber-600" />
                <h3 className="font-bold text-slate-900 text-lg">Interactive GPS Map Pin</h3>
              </div>
              <span className="font-mono text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded">
                Lat: {lat}, Lng: {lng}
              </span>
            </div>

            <div className="details-card-body">
              {/* Visual Simulated Map Display */}
              <div className="gps-map-viewer">
                {/* Background Grid Pattern */}
                <div className="map-grid-pattern" />

                {/* Center Pin Marker */}
                <div className="map-marker-pin">
                  <div className="pin-head">
                    <Factory size={18} className="text-white" />
                  </div>
                  <div className="pin-pulse" />
                </div>

                {/* Map Overlay Badge */}
                <div className="map-overlay-card">
                  <div className="font-bold text-slate-900 text-sm">{factory.name}</div>
                  <div className="text-xs text-slate-600">{locationSummary}</div>
                  <div className="text-xs font-mono text-amber-700 mt-1">
                    📍 {lat}, {lng}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORKSPACES & OPERATIONS */}
      {activeTab === "operations" && (
        <div className="space-y-6">
          {/* Associated Warehouses */}
          <div className="details-card">
            <div className="details-card-header">
              <div className="flex items-center gap-2">
                <Warehouse size={20} className="text-amber-600" />
                <h3 className="font-bold text-slate-900 text-lg">Associated Site Warehouses</h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
                2 Connected Facilities
              </span>
            </div>

            <div className="details-card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:border-amber-400 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-slate-900">Raw Material Bay A</div>
                    <Badge variant="active" size="sm">Active</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">Receiving bay and cold storage for incoming metal sheets and components.</p>
                  <div className="flex justify-between text-xs text-slate-500 border-t border-slate-200 pt-2">
                    <span>Capacity: 4,500 sq ft</span>
                    <span>Zone ID: W-RAW-01</span>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:border-amber-400 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-slate-900">Finished Goods Depot B</div>
                    <Badge variant="active" size="sm">Active</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">Staging area for packaged finished goods pending dispatch transport.</p>
                  <div className="flex justify-between text-xs text-slate-500 border-t border-slate-200 pt-2">
                    <span>Capacity: 8,000 sq ft</span>
                    <span>Zone ID: W-FG-02</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Work Orders */}
          <div className="details-card">
            <div className="details-card-header">
              <div className="flex items-center gap-2">
                <Cpu size={20} className="text-amber-600" />
                <h3 className="font-bold text-slate-900 text-lg">Active Production Work Orders</h3>
              </div>
            </div>

            <div className="details-card-body">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-700 mr-2">#WO-8821</span>
                    <span className="font-semibold text-slate-800 text-sm">Industrial Gear Shaft Assembly</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Qty: 1,200 units</span>
                    <Badge variant="active" size="sm">In Progress</Badge>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-700 mr-2">#WO-8824</span>
                    <span className="font-semibold text-slate-800 text-sm">Hydraulic Valve Enclosures</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Qty: 850 units</span>
                    <Badge variant="maintenance" size="sm">Queued</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isStatusModalOpen && (
        <FactoryStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          factory={factory}
          onSuccess={(updated) => setFactory(updated)}
        />
      )}

      {isManagerModalOpen && (
        <AssignManagerModal
          isOpen={isManagerModalOpen}
          onClose={() => setIsManagerModalOpen(false)}
          factory={factory}
          onSuccess={(updated) => setFactory(updated)}
        />
      )}
    </div>
  );
};

export default FactoryDetails;
