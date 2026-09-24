import React, { useState } from "react";
import type {
  ICustomer,
  CustomerType,
  CustomerStatus,
  CreditStatus,
} from "../../types/customer";
import { Button } from "../Button";
import { Input } from "../Input";
import { Select } from "../Select";
import {
  Building2,
  User,
  CreditCard,
  MapPin,
  Tag,
} from "lucide-react";

interface CustomerFormProps {
  initialValues?: Partial<ICustomer>;
  onSubmit: (data: Partial<ICustomer>) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
  onCancel?: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  initialValues = {},
  onSubmit,
  isLoading = false,
  submitButtonText = "Save Customer",
  onCancel,
}) => {
  // Form fields state
  const [name, setName] = useState(initialValues.name || "");
  const [code, setCode] = useState(
    initialValues.code || `CUST-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [customerType, setCustomerType] = useState<CustomerType>(
    initialValues.customerType || "corporate"
  );
  const [status, setStatus] = useState<CustomerStatus>(
    initialValues.status || "active"
  );

  // Primary Contact
  const [contactName, setContactName] = useState(
    initialValues.primaryContact?.name || ""
  );
  const [contactEmail, setContactEmail] = useState(
    initialValues.primaryContact?.email || ""
  );
  const [contactPhone, setContactPhone] = useState(
    initialValues.primaryContact?.phone || ""
  );
  const [contactRole, setContactRole] = useState(
    initialValues.primaryContact?.role || ""
  );

  // Credit Standing
  const [creditLimit, setCreditLimit] = useState(
    initialValues.creditStanding?.limit ?? 50000
  );
  const [usedCredit, setUsedCredit] = useState(
    initialValues.creditStanding?.usedCredit ?? 0
  );
  const [creditStatus, setCreditStatus] = useState<CreditStatus>(
    initialValues.creditStanding?.status || "good"
  );
  const [paymentTerms, setPaymentTerms] = useState(
    initialValues.creditStanding?.paymentTerms || "Net 30"
  );
  const [taxId, setTaxId] = useState(initialValues.taxId || "");

  // Billing Address
  const [billingStreet, setBillingStreet] = useState(
    initialValues.billingAddress?.street || ""
  );
  const [billingCity, setBillingCity] = useState(
    initialValues.billingAddress?.city || ""
  );
  const [billingState, setBillingState] = useState(
    initialValues.billingAddress?.state || ""
  );
  const [billingCountry, setBillingCountry] = useState(
    initialValues.billingAddress?.country || "USA"
  );
  const [billingPostalCode, setBillingPostalCode] = useState(
    initialValues.billingAddress?.postalCode || ""
  );

  // Shipping Address
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingStreet, setShippingStreet] = useState(
    initialValues.shippingAddress?.street || ""
  );
  const [shippingCity, setShippingCity] = useState(
    initialValues.shippingAddress?.city || ""
  );
  const [shippingState, setShippingState] = useState(
    initialValues.shippingAddress?.state || ""
  );
  const [shippingCountry, setShippingCountry] = useState(
    initialValues.shippingAddress?.country || "USA"
  );
  const [shippingPostalCode, setShippingPostalCode] = useState(
    initialValues.shippingAddress?.postalCode || ""
  );

  // Account Manager & Tags
  const [accountManagerName, setAccountManagerName] = useState(
    initialValues.accountManager?.name || "Sales Representative"
  );
  const [tagsInput, setTagsInput] = useState(
    (initialValues.tags || []).join(", ")
  );
  const [notes, setNotes] = useState(initialValues.notes || "");

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Customer account name is required.");
      return;
    }
    if (!code.trim()) {
      setFormError("Customer code is required.");
      return;
    }
    if (!contactName.trim() || !contactEmail.trim()) {
      setFormError("Primary contact name and email are required.");
      return;
    }

    setFormError(null);

    const tagsArray = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const bAddress = {
      street: billingStreet,
      city: billingCity,
      state: billingState,
      country: billingCountry,
      postalCode: billingPostalCode,
    };

    const sAddress = sameAsBilling
      ? bAddress
      : {
          street: shippingStreet,
          city: shippingCity,
          state: shippingState,
          country: shippingCountry,
          postalCode: shippingPostalCode,
        };

    const payload: Partial<ICustomer> = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      customerType,
      status,
      primaryContact: {
        name: contactName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
        role: contactRole.trim(),
      },
      creditStanding: {
        limit: Number(creditLimit),
        usedCredit: Number(usedCredit),
        availableCredit: Math.max(Number(creditLimit) - Number(usedCredit), 0),
        status: creditStatus,
        paymentTerms,
        score: creditStatus === "excellent" ? 95 : creditStatus === "good" ? 85 : 60,
      },
      billingAddress: bAddress,
      shippingAddress: sAddress,
      taxId: taxId.trim(),
      accountManager: {
        name: accountManagerName.trim(),
      },
      tags: tagsArray,
      notes: notes.trim(),
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setFormError(err.message || "Failed to submit customer form.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="customer-form-container">
      {formError && (
        <div className="form-error-alert" style={{ marginBottom: "20px" }}>
          {formError}
        </div>
      )}

      {/* SECTION 1: ACCOUNT GENERAL DETAILS */}
      <div className="form-card">
        <div className="form-card-header">
          <Building2 size={18} className="text-primary" />
          <h3>General Customer Information</h3>
        </div>

        <div className="form-grid-2">
          <Input
            label="Customer / Company Name *"
            placeholder="e.g. AeroDynamics Defence Systems"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Customer Code *"
            placeholder="e.g. CUST-1001"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          <Select
            label="Customer Account Type"
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value as CustomerType)}
            options={[
              { value: "corporate", label: "Corporate Entity" },
              { value: "enterprise", label: "Enterprise Account" },
              { value: "government", label: "Government Agency" },
              { value: "distributor", label: "Wholesale Distributor" },
              { value: "individual", label: "Individual / Small Business" },
            ]}
          />

          <Select
            label="Account Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CustomerStatus)}
            options={[
              { value: "active", label: "Active" },
              { value: "vip", label: "VIP Client" },
              { value: "on_hold", label: "On Hold" },
              { value: "lead", label: "Lead / Prospect" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>
      </div>

      {/* SECTION 2: PRIMARY CONTACT INFORMATION */}
      <div className="form-card">
        <div className="form-card-header">
          <User size={18} className="text-primary" />
          <h3>Primary Relationship Contact</h3>
        </div>

        <div className="form-grid-2">
          <Input
            label="Contact Full Name *"
            placeholder="e.g. Marcus Vance"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="e.g. m.vance@client.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
          />

          <Input
            label="Phone Number"
            placeholder="e.g. +1 (555) 349-9201"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />

          <Input
            label="Job Title / Role"
            placeholder="e.g. VP Procurement"
            value={contactRole}
            onChange={(e) => setContactRole(e.target.value)}
          />
        </div>
      </div>

      {/* SECTION 3: FINANCIAL & CREDIT STANDING */}
      <div className="form-card">
        <div className="form-card-header">
          <CreditCard size={18} className="text-primary" />
          <h3>Credit Standing & Payment Terms</h3>
        </div>

        <div className="form-grid-3">
          <Input
            label="Credit Limit ($)"
            type="number"
            min="0"
            step="1000"
            value={creditLimit}
            onChange={(e) => setCreditLimit(Number(e.target.value))}
          />

          <Input
            label="Current Used Credit ($)"
            type="number"
            min="0"
            value={usedCredit}
            onChange={(e) => setUsedCredit(Number(e.target.value))}
          />

          <Select
            label="Credit Status Rating"
            value={creditStatus}
            onChange={(e) => setCreditStatus(e.target.value as CreditStatus)}
            options={[
              { value: "excellent", label: "Excellent Standing" },
              { value: "good", label: "Good Standing" },
              { value: "warning", label: "Credit Warning" },
              { value: "credit_hold", label: "Credit Hold" },
              { value: "suspended", label: "Suspended" },
            ]}
          />

          <Select
            label="Payment Terms"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            options={[
              { value: "Prepaid", label: "Prepaid" },
              { value: "Net 15", label: "Net 15 Days" },
              { value: "Net 30", label: "Net 30 Days" },
              { value: "Net 60", label: "Net 60 Days" },
              { value: "Net 90", label: "Net 90 Days" },
              { value: "COD", label: "Cash on Delivery" },
            ]}
          />

          <Input
            label="Tax Registration ID / VAT"
            placeholder="e.g. US-984210943"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
          />

          <Input
            label="Assigned Sales Representative"
            placeholder="e.g. Sarah Jenkins"
            value={accountManagerName}
            onChange={(e) => setAccountManagerName(e.target.value)}
          />
        </div>
      </div>

      {/* SECTION 4: ADDRESS DETAILS */}
      <div className="form-card">
        <div className="form-card-header">
          <MapPin size={18} className="text-primary" />
          <h3>Billing & Shipping Address</h3>
        </div>

        <h4 className="address-section-title">Billing Address</h4>
        <div className="form-grid-2">
          <Input
            label="Street Address"
            placeholder="e.g. 750 Aviation Way, Suite 400"
            value={billingStreet}
            onChange={(e) => setBillingStreet(e.target.value)}
          />
          <Input
            label="City"
            placeholder="e.g. Seattle"
            value={billingCity}
            onChange={(e) => setBillingCity(e.target.value)}
          />
          <Input
            label="State / Province"
            placeholder="e.g. WA"
            value={billingState}
            onChange={(e) => setBillingState(e.target.value)}
          />
          <Input
            label="Country"
            placeholder="e.g. USA"
            value={billingCountry}
            onChange={(e) => setBillingCountry(e.target.value)}
          />
          <Input
            label="Postal / Zip Code"
            placeholder="e.g. 98101"
            value={billingPostalCode}
            onChange={(e) => setBillingPostalCode(e.target.value)}
          />
        </div>

        <div className="checkbox-row">
          <input
            type="checkbox"
            id="sameAsBilling"
            checked={sameAsBilling}
            onChange={(e) => setSameAsBilling(e.target.checked)}
          />
          <label htmlFor="sameAsBilling">Shipping address same as billing address</label>
        </div>

        {!sameAsBilling && (
          <>
            <h4 className="address-section-title">Shipping Address</h4>
            <div className="form-grid-2">
              <Input
                label="Street Address"
                placeholder="e.g. Warehouse 4, 120 Hangar Rd"
                value={shippingStreet}
                onChange={(e) => setShippingStreet(e.target.value)}
              />
              <Input
                label="City"
                placeholder="e.g. Everett"
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
              />
              <Input
                label="State / Province"
                placeholder="e.g. WA"
                value={shippingState}
                onChange={(e) => setShippingState(e.target.value)}
              />
              <Input
                label="Country"
                placeholder="e.g. USA"
                value={shippingCountry}
                onChange={(e) => setShippingCountry(e.target.value)}
              />
              <Input
                label="Postal / Zip Code"
                placeholder="e.g. 98203"
                value={shippingPostalCode}
                onChange={(e) => setShippingPostalCode(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* SECTION 5: TAGS & NOTES */}
      <div className="form-card">
        <div className="form-card-header">
          <Tag size={18} className="text-primary" />
          <h3>Tags & Internal Notes</h3>
        </div>

        <Input
          label="Tags (Comma Separated)"
          placeholder="e.g. Aerospace, Defense, High Volume, ISO 9001"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        <div className="form-group">
          <label className="form-label">Internal Account Notes</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Special delivery instructions, key decision makers, contract terms..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>
      </div>

      {/* FORM ACTIONS FOOTER */}
      <div className="form-actions">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={isLoading}>
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;
