import React, { useState } from "react";
import type { ISupplier, SupplierCategory, SupplierStatus, ComplianceStatus } from "../../types/supplier";
import { Button } from "../Button";
import { Input } from "../Input";
import { Select } from "../Select";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Star,
  ShieldCheck,
  CreditCard,
  Tag,
  AlertCircle,
} from "lucide-react";

interface SupplierFormProps {
  initialValues?: Partial<ISupplier>;
  mode: "create" | "edit";
  onSubmit: (formData: any) => Promise<void>;
  submitting: boolean;
  error?: string | null;
  onCancel: () => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  initialValues,
  mode,
  onSubmit,
  submitting,
  error,
  onCancel,
}) => {
  const [name, setName] = useState(initialValues?.name || "");
  const [code, setCode] = useState(
    initialValues?.code || `SUP-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [category, setCategory] = useState<SupplierCategory>(
    initialValues?.category || "raw_material"
  );
  const [status, setStatus] = useState<SupplierStatus>(initialValues?.status || "active");
  const [rating, setRating] = useState<number>(initialValues?.rating || 5);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus>(
    initialValues?.complianceStatus || "compliant"
  );

  // Primary Contact
  const [contactName, setContactName] = useState(initialValues?.primaryContact?.name || "");
  const [contactEmail, setContactEmail] = useState(initialValues?.primaryContact?.email || "");
  const [contactPhone, setContactPhone] = useState(initialValues?.primaryContact?.phone || "");
  const [contactRole, setContactRole] = useState(
    initialValues?.primaryContact?.role || "Account Manager"
  );

  // Address
  const [street, setStreet] = useState(initialValues?.address?.street || "");
  const [city, setCity] = useState(initialValues?.address?.city || "");
  const [state, setState] = useState(initialValues?.address?.state || "");
  const [country, setCountry] = useState(initialValues?.address?.country || "USA");
  const [postalCode, setPostalCode] = useState(initialValues?.address?.postalCode || "");

  // Financial & Tax
  const [taxId, setTaxId] = useState(initialValues?.taxId || "");
  const [paymentTerms, setPaymentTerms] = useState(initialValues?.paymentTerms || "Net 30");

  // Notes & Tags
  const [tags, setTags] = useState(initialValues?.tags ? initialValues.tags.join(", ") : "");
  const [notes, setNotes] = useState(initialValues?.notes || "");

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError("Supplier name is required.");
      return;
    }
    if (!code.trim()) {
      setValidationError("Supplier code is required.");
      return;
    }
    if (!contactName.trim() || !contactEmail.trim()) {
      setValidationError("Primary contact name and email are required.");
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      category,
      status,
      rating: Number(rating),
      complianceStatus,
      primaryContact: {
        name: contactName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
        role: contactRole.trim(),
        isPrimary: true,
      },
      address: {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        postalCode: postalCode.trim(),
      },
      taxId: taxId.trim(),
      paymentTerms: paymentTerms.trim(),
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      notes: notes.trim(),
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      {(validationError || error) && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{validationError || error}</span>
        </div>
      )}

      {/* Section 1: Basic Information */}
      <div>
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-3 pb-2 border-b border-slate-100">
          <Building2 size={18} className="text-amber-600" />
          <span>Basic Vendor Information</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Supplier / Vendor Name *"
            placeholder="e.g. Apex Industrial Solutions Ltd."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Supplier Code *"
            placeholder="e.g. SUP-1002"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as SupplierCategory)}
            options={[
              { value: "raw_material", label: "Raw Materials" },
              { value: "components", label: "Components & Parts" },
              { value: "packaging", label: "Packaging Materials" },
              { value: "machinery", label: "Machinery & Tooling" },
              { value: "logistics", label: "Logistics & Freight" },
              { value: "services", label: "Professional Services" },
              { value: "other", label: "Other" },
            ]}
          />

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as SupplierStatus)}
            options={[
              { value: "active", label: "Active Vendor" },
              { value: "under_review", label: "Under Quality Review" },
              { value: "inactive", label: "Inactive" },
              { value: "blocked", label: "Blocked / Disqualified" },
            ]}
          />

          <Select
            label="Quality Rating (1 to 5 Stars)"
            value={String(rating)}
            onChange={(e) => setRating(Number(e.target.value))}
            options={[
              { value: "5", label: "5 Stars - Premier Vendor" },
              { value: "4", label: "4 Stars - Approved Vendor" },
              { value: "3", label: "3 Stars - Standard Vendor" },
              { value: "2", label: "2 Stars - Probationary" },
              { value: "1", label: "1 Star - High Risk" },
            ]}
          />

          <Select
            label="Compliance Status"
            value={complianceStatus}
            onChange={(e) => setComplianceStatus(e.target.value as ComplianceStatus)}
            options={[
              { value: "compliant", label: "Fully Compliant & Certified" },
              { value: "pending_audit", label: "Pending Audit / Document Update" },
              { value: "non_compliant", label: "Non-Compliant / Flagged" },
            ]}
          />
        </div>
      </div>

      {/* Section 2: Primary Contact Information */}
      <div>
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-3 pb-2 border-b border-slate-100">
          <User size={18} className="text-amber-600" />
          <span>Primary Contact Person</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Contact Full Name *"
            placeholder="e.g. John Doe"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
          />

          <Input
            label="Contact Email Address *"
            type="email"
            placeholder="e.g. john@apexindustrial.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
          />

          <Input
            label="Phone Number"
            placeholder="e.g. +1 (555) 019-2834"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />

          <Input
            label="Designation / Role"
            placeholder="e.g. Key Account Manager"
            value={contactRole}
            onChange={(e) => setContactRole(e.target.value)}
          />
        </div>
      </div>

      {/* Section 3: Physical & Legal Address */}
      <div>
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-3 pb-2 border-b border-slate-100">
          <MapPin size={18} className="text-amber-600" />
          <span>Address & Headquarters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Street Address"
              placeholder="e.g. 100 Industrial Parkway, Suite 400"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          <Input
            label="City"
            placeholder="e.g. Chicago"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <Input
            label="State / Province"
            placeholder="e.g. IL"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />

          <Input
            label="Country"
            placeholder="e.g. USA"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />

          <Input
            label="Postal / Zip Code"
            placeholder="e.g. 60601"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
        </div>
      </div>

      {/* Section 4: Financial & Tax Settings */}
      <div>
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-3 pb-2 border-b border-slate-100">
          <CreditCard size={18} className="text-amber-600" />
          <span>Tax & Payment Terms</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Tax Identification / GSTIN / VAT Number"
            placeholder="e.g. US-984019283"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
          />

          <Select
            label="Payment Terms"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            options={[
              { value: "Net 15", label: "Net 15 Days" },
              { value: "Net 30", label: "Net 30 Days (Standard)" },
              { value: "Net 45", label: "Net 45 Days" },
              { value: "Net 60", label: "Net 60 Days" },
              { value: "Immediate", label: "Immediate / Cash on Delivery" },
              { value: "Advance", label: "100% Advance Payment" },
            ]}
          />
        </div>
      </div>

      {/* Section 5: Notes & Categorization Tags */}
      <div>
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-3 pb-2 border-b border-slate-100">
          <Tag size={18} className="text-amber-600" />
          <span>Tags & Procurement Notes</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Tags (Comma separated)"
            placeholder="e.g. Steel, Precision Machining, ISO-Certified, Fast Shipping"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">
              Internal Procurement Notes
            </label>
            <textarea
              rows={3}
              placeholder="Add key contract notes, delivery terms, or preferred contact instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
            />
          </div>
        </div>
      </div>

      {/* Form Footer Action Buttons */}
      <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
        <Button variant="outline" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="copper" type="submit" loading={submitting}>
          {mode === "create" ? "Create Supplier Record" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default SupplierForm;
