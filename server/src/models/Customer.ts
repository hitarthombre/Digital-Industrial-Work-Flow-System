import { Schema, model, Document, Types } from "mongoose";

export type CustomerType = "corporate" | "individual" | "distributor" | "government" | "enterprise";
export type CustomerStatus = "active" | "inactive" | "on_hold" | "lead" | "vip";
export type CreditStatus = "excellent" | "good" | "warning" | "credit_hold" | "suspended";
export type CustomerDocType = "contract" | "tax_certificate" | "nda" | "credit_application" | "purchase_order" | "other";
export type CustomerDocStatus = "valid" | "expiring_soon" | "expired" | "pending_review";
export type CustomerOrderStatus = "draft" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type CustomerPaymentStatus = "paid" | "pending" | "partially_paid" | "overdue";

export interface ICustomerDocumentSub extends Document {
  title: string;
  docType: CustomerDocType;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedAt: Date;
  expiryDate?: Date;
  status: CustomerDocStatus;
  notes?: string;
}

export interface ICustomerOrderSub extends Document {
  orderNumber: string;
  date: Date;
  totalAmount: number;
  currency?: string;
  status: CustomerOrderStatus;
  paymentStatus: CustomerPaymentStatus;
  itemsCount: number;
  itemsSummary?: string;
  deliveryDate?: Date;
}

export interface ICreditStatusInfo {
  limit: number;
  usedCredit: number;
  availableCredit: number;
  utilizationPercentage: number;
  status: CreditStatus;
  score: number;
  paymentTerms: string;
  isCreditHold: boolean;
}

export interface ICustomer extends Document {
  companyId: Types.ObjectId;
  companyName: string;
  name: string;
  code: string;
  contactName?: string;
  email?: string;
  phone?: string;
  customerType: CustomerType;
  status: CustomerStatus;
  creditLimit: number;
  creditStanding: {
    limit: number;
    usedCredit: number;
    availableCredit: number;
    status: CreditStatus;
    score: number;
    paymentTerms: string;
  };
  primaryContact: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
  };
  billingAddress: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  taxId?: string;
  accountManager?: {
    id?: Types.ObjectId;
    name: string;
    email?: string;
  };
  tags?: string[];
  notes?: string;
  totalOrdersCount?: number;
  totalRevenue?: number;
  documents?: ICustomerDocumentSub[];
  orders?: ICustomerOrderSub[];
  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  getCreditStatus(): ICreditStatusInfo;
}

const CustomerDocumentSchema = new Schema<ICustomerDocumentSub>(
  {
    title: { type: String, required: true, trim: true },
    docType: {
      type: String,
      enum: ["contract", "tax_certificate", "nda", "credit_application", "purchase_order", "other"],
      default: "contract",
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: ["valid", "expiring_soon", "expired", "pending_review"],
      default: "valid",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const CustomerOrderSchema = new Schema<ICustomerOrderSub>(
  {
    orderNumber: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["draft", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "confirmed",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "partially_paid", "overdue"],
      default: "pending",
    },
    itemsCount: { type: Number, default: 1 },
    itemsSummary: { type: String, default: "" },
    deliveryDate: { type: Date },
  },
  { timestamps: true }
);

const CustomerSchema = new Schema<ICustomer>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    companyName: { type: String, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    contactName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    customerType: {
      type: String,
      enum: ["corporate", "individual", "distributor", "government", "enterprise"],
      default: "corporate",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on_hold", "lead", "vip"],
      default: "active",
      index: true,
    },
    creditLimit: { type: Number, default: 50000, min: 0 },
    creditStanding: {
      limit: { type: Number, default: 50000, min: 0 },
      usedCredit: { type: Number, default: 0, min: 0 },
      availableCredit: { type: Number, default: 50000, min: 0 },
      status: {
        type: String,
        enum: ["excellent", "good", "warning", "credit_hold", "suspended"],
        default: "good",
      },
      score: { type: Number, default: 85, min: 0, max: 100 },
      paymentTerms: { type: String, default: "Net 30" },
    },
    primaryContact: {
      name: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true, lowercase: true },
      phone: { type: String, trim: true },
      role: { type: String, trim: true },
    },
    billingAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: "USA" },
      postalCode: { type: String, trim: true },
    },
    shippingAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },
    taxId: { type: String, trim: true },
    accountManager: {
      id: { type: Schema.Types.ObjectId, ref: "User" },
      name: { type: String, default: "Unassigned" },
      email: { type: String },
    },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    totalOrdersCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    documents: [CustomerDocumentSchema],
    orders: [CustomerOrderSchema],
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save / pre-validate hook to keep aliases synchronized
CustomerSchema.pre("validate", function (next) {
  // Synchronize companyName & name
  if (this.companyName && !this.name) {
    this.name = this.companyName;
  } else if (this.name && !this.companyName) {
    this.companyName = this.name;
  }

  // Synchronize primaryContact & contactName / email / phone
  if (this.contactName && (!this.primaryContact || !this.primaryContact.name)) {
    if (!this.primaryContact) this.primaryContact = { name: "", email: "" };
    this.primaryContact.name = this.contactName;
  } else if (this.primaryContact?.name && !this.contactName) {
    this.contactName = this.primaryContact.name;
  }

  if (this.email && (!this.primaryContact || !this.primaryContact.email)) {
    if (!this.primaryContact) this.primaryContact = { name: "", email: "" };
    this.primaryContact.email = this.email;
  } else if (this.primaryContact?.email && !this.email) {
    this.email = this.primaryContact.email;
  }

  if (this.phone && (!this.primaryContact || !this.primaryContact.phone)) {
    if (!this.primaryContact) this.primaryContact = { name: "", email: "" };
    this.primaryContact.phone = this.phone;
  } else if (this.primaryContact?.phone && !this.phone) {
    this.phone = this.primaryContact.phone;
  }

  // Synchronize creditLimit & creditStanding.limit
  if (this.creditLimit !== undefined) {
    if (!this.creditStanding) {
      this.creditStanding = {
        limit: this.creditLimit,
        usedCredit: 0,
        availableCredit: this.creditLimit,
        status: "good",
        score: 85,
        paymentTerms: "Net 30",
      };
    } else {
      this.creditStanding.limit = this.creditLimit;
    }
  } else if (this.creditStanding?.limit !== undefined) {
    this.creditLimit = this.creditStanding.limit;
  }

  // Recalculate availableCredit
  if (this.creditStanding) {
    const limit = this.creditStanding.limit || 0;
    const used = this.creditStanding.usedCredit || 0;
    this.creditStanding.availableCredit = Math.max(limit - used, 0);

    // Auto calculate credit standing status if on hold or exceeding limit
    if (this.status === "on_hold" && this.creditStanding.status !== "suspended") {
      this.creditStanding.status = "credit_hold";
    } else if (limit > 0 && used >= limit && this.creditStanding.status !== "suspended") {
      this.creditStanding.status = "credit_hold";
    }
  }

  next();
});

CustomerSchema.methods.getCreditStatus = function (): ICreditStatusInfo {
  const limit = this.creditStanding?.limit ?? this.creditLimit ?? 50000;
  const used = this.creditStanding?.usedCredit ?? 0;
  const available = this.creditStanding?.availableCredit ?? Math.max(limit - used, 0);
  const utilizationPercentage = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;
  const status = this.creditStanding?.status || (utilizationPercentage >= 95 ? "credit_hold" : "good");
  const score = this.creditStanding?.score ?? 85;
  const paymentTerms = this.creditStanding?.paymentTerms || "Net 30";
  const isCreditHold = status === "credit_hold" || status === "suspended" || this.status === "on_hold";

  return {
    limit,
    usedCredit: used,
    availableCredit: available,
    utilizationPercentage,
    status,
    score,
    paymentTerms,
    isCreditHold,
  };
};

CustomerSchema.index({ companyId: 1, code: 1 }, { unique: true });
CustomerSchema.index({ companyId: 1, name: 1 });
CustomerSchema.index({ companyId: 1, companyName: 1 });
CustomerSchema.index({ companyId: 1, status: 1 });
CustomerSchema.index({
  name: "text",
  companyName: "text",
  code: "text",
  contactName: "text",
  email: "text",
  "primaryContact.name": "text",
  "primaryContact.email": "text",
});

export const Customer = model<ICustomer>("Customer", CustomerSchema);
export default Customer;
