import { Schema, model, Document, Types } from "mongoose";

export interface ICustomerDocumentSub extends Document {
  title: string;
  docType: "contract" | "tax_certificate" | "nda" | "credit_application" | "purchase_order" | "other";
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedAt: Date;
  expiryDate?: Date;
  status: "valid" | "expiring_soon" | "expired" | "pending_review";
  notes?: string;
}

export interface ICustomerOrderSub extends Document {
  orderNumber: string;
  date: Date;
  totalAmount: number;
  currency?: string;
  status: "draft" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "paid" | "pending" | "partially_paid" | "overdue";
  itemsCount: number;
  itemsSummary?: string;
  deliveryDate?: Date;
}

export interface ICustomer extends Document {
  companyId: Types.ObjectId;
  name: string;
  code: string;
  customerType: "corporate" | "individual" | "distributor" | "government" | "enterprise";
  status: "active" | "inactive" | "on_hold" | "lead" | "vip";
  creditStanding: {
    limit: number;
    usedCredit: number;
    availableCredit: number;
    status: "excellent" | "good" | "warning" | "credit_hold" | "suspended";
    score?: number;
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
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
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
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true },
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
    creditStanding: {
      limit: { type: Number, default: 50000, min: 0 },
      usedCredit: { type: Number, default: 0, min: 0 },
      availableCredit: { type: Number, default: 50000, min: 0 },
      status: {
        type: String,
        enum: ["excellent", "good", "warning", "credit_hold", "suspended"],
        default: "good",
      },
      score: { type: Number, default: 80, min: 0, max: 100 },
      paymentTerms: { type: String, default: "Net 30" },
    },
    primaryContact: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      role: { type: String, trim: true },
    },
    billingAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
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
  }
);

CustomerSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const Customer = model<ICustomer>("Customer", CustomerSchema);
