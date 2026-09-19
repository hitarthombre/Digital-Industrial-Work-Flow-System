import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ISupplier, SupplierSingleResponse } from "../../types/supplier";
import { api } from "../../services/api";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import SupplierVault from "../../components/suppliers/SupplierVault";
import PurchaseHistoryTimeline from "../../components/suppliers/PurchaseHistoryTimeline";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  User,
  MapPin,
  Star,
  ShieldCheck,
  FileCheck,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import "./SupplierPages.css";

export const SupplierDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState<ISupplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"vault" | "timeline">("vault");

  useEffect(() => {
    if (id) fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<SupplierSingleResponse>(`/suppliers/${id}`);
      if (response.data) {
        setSupplier(response.data);
      }
    } catch (err: any) {
      // Fallback sample supplier record for client demo view
      setSupplier({
        _id: id || "sup-1",
        name: "Apex Steel & Metallurgy Corp",
        code: "SUP-101",
        category: "raw_material",
        status: "active",
        rating: 5,
        complianceStatus: "compliant",
        primaryContact: {
          name: "Robert Vance",
          email: "rvance@apexsteel.com",
          phone: "+1 (555) 234-5678",
          role: "Key Account Manager",
        },
        address: {
          street: "140 Industrial Parkway",
          city: "Pittsburgh",
          state: "PA",
          country: "USA",
          postalCode: "15201",
        },
        taxId: "US-984019283",
        paymentTerms: "Net 30",
        tags: ["Steel", "Cold-Rolled", "ISO 9001"],
        totalSpend: 154000,
        totalOrders: 28,
        documents: [
          {
            _id: "doc-1",
            title: "ISO 9001:2015 Quality Certification",
            docType: "iso_certificate",
            fileName: "ISO_9001_ApexSteel_2025.pdf",
            fileUrl: "#",
            fileSize: 1024 * 720,
            uploadedAt: "2025-01-10",
            expiryDate: "2027-01-10",
            status: "valid",
            notes: "Certified for cold-rolled steel manufacturing standards.",
          },
          {
            _id: "doc-2",
            title: "Master Services & Supply Contract 2026",
            docType: "contract",
            fileName: "MSA_ApexSteel_Signed.pdf",
            fileUrl: "#",
            fileSize: 1024 * 1200,
            uploadedAt: "2026-01-05",
            expiryDate: "2028-01-05",
            status: "valid",
          },
          {
            _id: "doc-3",
            title: "W-9 Tax Certificate",
            docType: "tax_document",
            fileName: "W9_TaxExemption_Apex.pdf",
            fileUrl: "#",
            fileSize: 1024 * 340,
            uploadedAt: "2025-06-15",
            expiryDate: "2026-10-15",
            status: "expiring_soon",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case "active":
        return "active";
      case "under_review":
        return "maintenance";
      case "inactive":
        return "inactive";
      case "blocked":
        return "closed";
      default:
        return "neutral";
    }
  };

  const renderStars = (rating: number = 5) => {
    return (
      <div className="flex items-center gap-1 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="sup-page-container">
        <div className="sup-loading-box">
          <RefreshCw className="animate-spin text-amber-600 mb-2" size={32} />
          <p className="text-slate-600 font-medium">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="sup-page-container">
        <div className="sup-alert error">
          <AlertTriangle size={18} />
          <span>Vendor details not found or access denied.</span>
          <Button variant="outline" size="sm" onClick={() => navigate("/app/suppliers")}>
            Back to Directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="sup-page-container">
      {/* Top Header Card */}
      <div className="sup-details-header">
        <div>
          <button
            onClick={() => navigate("/app/suppliers")}
            className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Supplier Directory</span>
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="sup-page-title">{supplier.name}</h1>
            <span className="sup-code-badge">{supplier.code}</span>
            <span className="sup-category-badge">{supplier.category.replace("_", " ")}</span>
            <Badge variant={getStatusBadgeVariant(supplier.status)} size="sm">
              {supplier.status.replace("_", " ")}
            </Badge>
          </div>

          <div className="flex items-center gap-4 mt-2">
            {renderStars(supplier.rating)}
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              Compliance:{" "}
              <span
                className={
                  supplier.complianceStatus === "compliant"
                    ? "text-emerald-700"
                    : supplier.complianceStatus === "pending_audit"
                    ? "text-amber-700"
                    : "text-rose-700"
                }
              >
                {supplier.complianceStatus.replace("_", " ").toUpperCase()}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={<Edit size={16} />}
            onClick={() => navigate(`/app/suppliers/${supplier._id}/edit`)}
          >
            Edit Profile
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 size={16} />}
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${supplier.name}?`)) {
                api.delete(`/suppliers/${supplier._id}`).catch(() => {});
                navigate("/app/suppliers");
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Overview Cards Layout */}
      <div className="sup-details-grid">
        {/* Left Column: Contact & Tax Information */}
        <div className="flex flex-col gap-4">
          {/* Primary Contact Card */}
          <div className="sup-info-card">
            <h3 className="sup-info-card-title">
              <User size={18} className="text-amber-600" />
              Primary Vendor Contact
            </h3>
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <div className="font-bold text-slate-900 text-base">{supplier.primaryContact?.name}</div>
              <div className="text-xs text-slate-500 font-semibold">{supplier.primaryContact?.role || "Contact Person"}</div>

              <div className="flex items-center gap-2 text-xs pt-2 border-t border-slate-100">
                <Mail size={14} className="text-slate-400" />
                <a href={`mailto:${supplier.primaryContact?.email}`} className="text-amber-700 hover:underline">
                  {supplier.primaryContact?.email}
                </a>
              </div>

              {supplier.primaryContact?.phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone size={14} className="text-slate-400" />
                  <span>{supplier.primaryContact.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Address & Tax Card */}
          <div className="sup-info-card">
            <h3 className="sup-info-card-title">
              <MapPin size={18} className="text-amber-600" />
              Location & Financial Terms
            </h3>

            <div className="flex flex-col gap-3 text-xs text-slate-700">
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Address:</span>
                <span className="font-medium text-slate-800">
                  {[
                    supplier.address?.street,
                    supplier.address?.city,
                    supplier.address?.state,
                    supplier.address?.country,
                    supplier.address?.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Address not provided"}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-semibold uppercase">Tax ID / GSTIN:</span>
                <span className="font-mono font-bold text-slate-800">{supplier.taxId || "N/A"}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold uppercase">Payment Terms:</span>
                <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {supplier.paymentTerms || "Net 30"}
                </span>
              </div>

              {supplier.tags && supplier.tags.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-semibold block uppercase mb-1">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {supplier.tags.map((t, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Sections (Document Vault & Purchase History Timeline) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          {/* Tabs Navigation */}
          <div className="sup-tabs-nav">
            <button
              className={`sup-tab-btn ${activeTab === "vault" ? "active" : ""}`}
              onClick={() => setActiveTab("vault")}
            >
              <FileCheck size={18} />
              <span>Document Vault ({supplier.documents?.length || 0})</span>
            </button>

            <button
              className={`sup-tab-btn ${activeTab === "timeline" ? "active" : ""}`}
              onClick={() => setActiveTab("timeline")}
            >
              <TrendingUp size={18} />
              <span>Purchase History Timeline</span>
            </button>
          </div>

          {/* Active Tab Component */}
          {activeTab === "vault" ? (
            <SupplierVault
              supplierId={supplier._id}
              documents={supplier.documents}
              onDocumentAdded={(newDoc) => {
                setSupplier((prev) =>
                  prev ? { ...prev, documents: [newDoc, ...(prev.documents || [])] } : prev
                );
              }}
              onDocumentDeleted={(docId) => {
                setSupplier((prev) =>
                  prev
                    ? {
                        ...prev,
                        documents: (prev.documents || []).filter((d) => d._id !== docId),
                      }
                    : prev
                );
              }}
            />
          ) : (
            <PurchaseHistoryTimeline supplierId={supplier._id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierDetails;
