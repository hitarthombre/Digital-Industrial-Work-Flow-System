import { Schema, model, Document, Types } from "mongoose";

export interface ISupplierDocumentSub extends Document {
  title: string;
  docType: "contract" | "iso_certificate" | "tax_document" | "nda" | "quality_standard" | "audit_report" | "other";
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedAt: Date;
  expiryDate?: Date;
  status: "valid" | "expiring_soon" | "expired";
  notes?: string;
}

export interface IPurchaseHistorySub extends Document {
  poNumber: string;
  date: Date;
  itemSummary: string;
  itemsCount: number;
  totalAmount: number;
  currency?: string;
  status: "delivered" | "shipped" | "processing" | "cancelled";
  deliveryRating?: number;
  notes?: string;
}

export interface IPerformanceMetrics {
  qualityRating: number;
  onTimeDeliveryRate: number;
  fulfillmentSpeed: string;
  totalSpend: number;
  totalOrders: number;
  overallScore: number;
  riskLevel: "low" | "medium" | "high";
}

export interface ISupplier extends Document {
  companyId: Types.ObjectId;
  name: string;
  code: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  category: "raw_material" | "components" | "packaging" | "machinery" | "logistics" | "services" | "other";
  status: "active" | "inactive" | "under_review" | "blocked";
  rating: number;
  complianceStatus: "compliant" | "pending_audit" | "non_compliant";
  primaryContact: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    isPrimary?: boolean;
  };
  contacts?: Array<{
    name: string;
    email: string;
    phone?: string;
    role?: string;
  }>;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  taxId?: string;
  paymentTerms?: string;
  tags?: string[];
  notes?: string;
  totalSpend?: number;
  totalOrders?: number;
  documents?: ISupplierDocumentSub[];
  purchaseHistory?: IPurchaseHistorySub[];
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  getPerformanceMetrics(): IPerformanceMetrics;
}

const SupplierDocumentSchema = new Schema<ISupplierDocumentSub>(
  {
    title: { type: String, required: true, trim: true },
    docType: {
      type: String,
      enum: ["contract", "iso_certificate", "tax_document", "nda", "quality_standard", "audit_report", "other"],
      default: "iso_certificate",
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: ["valid", "expiring_soon", "expired"],
      default: "valid",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const PurchaseHistorySchema = new Schema<IPurchaseHistorySub>(
  {
    poNumber: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    itemSummary: { type: String, required: true },
    itemsCount: { type: Number, default: 1 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["delivered", "shipped", "processing", "cancelled"],
      default: "delivered",
    },
    deliveryRating: { type: Number, min: 1, max: 5 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const SupplierSchema = new Schema<ISupplier>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    contactPerson: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    category: {
      type: String,
      enum: ["raw_material", "components", "packaging", "machinery", "logistics", "services", "other"],
      default: "raw_material",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "under_review", "blocked"],
      default: "active",
      index: true,
    },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    complianceStatus: {
      type: String,
      enum: ["compliant", "pending_audit", "non_compliant"],
      default: "compliant",
      index: true,
    },
    primaryContact: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, trim: true },
      role: { type: String, trim: true },
      isPrimary: { type: Boolean, default: true },
    },
    contacts: [
      {
        name: { type: String, trim: true },
        email: { type: String, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        role: { type: String, trim: true },
      },
    ],
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },
    taxId: { type: String, trim: true },
    paymentTerms: { type: String, default: "Net 30", trim: true },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    totalSpend: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    documents: [SupplierDocumentSchema],
    purchaseHistory: [PurchaseHistorySchema],
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

SupplierSchema.index({ companyId: 1, code: 1 }, { unique: true });
SupplierSchema.index({ companyId: 1, name: 1 });
SupplierSchema.index({
  name: "text",
  code: "text",
  contactPerson: "text",
  email: "text",
  "primaryContact.name": "text",
  "primaryContact.email": "text",
});

SupplierSchema.methods.getPerformanceMetrics = function (): IPerformanceMetrics {
  const history = this.purchaseHistory || [];
  const totalOrdersCount = this.totalOrders || history.length;
  const deliveredOrders = history.filter((h: IPurchaseHistorySub) => h.status === "delivered");
  const ratedOrders = history.filter((h: IPurchaseHistorySub) => typeof h.deliveryRating === "number");

  const avgDeliveryRating = ratedOrders.length
    ? ratedOrders.reduce((sum: number, h: IPurchaseHistorySub) => sum + (h.deliveryRating || 5), 0) / ratedOrders.length
    : this.rating || 5;

  const onTimeRate = totalOrdersCount > 0
    ? Math.round((deliveredOrders.length / Math.max(totalOrdersCount, 1)) * 100)
    : 98;

  const overallScore = Math.min(100, Math.max(0, Math.round((avgDeliveryRating / 5) * 60 + (onTimeRate / 100) * 40)));

  let riskLevel: "low" | "medium" | "high" = "low";
  if (this.complianceStatus === "non_compliant" || this.status === "blocked" || overallScore < 60) {
    riskLevel = "high";
  } else if (this.complianceStatus === "pending_audit" || this.status === "under_review" || overallScore < 80) {
    riskLevel = "medium";
  }

  return {
    qualityRating: Number(avgDeliveryRating.toFixed(1)),
    onTimeDeliveryRate: onTimeRate,
    fulfillmentSpeed: "3-5 Business Days",
    totalSpend: this.totalSpend || history.reduce((acc: number, h: IPurchaseHistorySub) => acc + (h.totalAmount || 0), 0),
    totalOrders: totalOrdersCount,
    overallScore,
    riskLevel,
  };
};

export const Supplier = model<ISupplier>("Supplier", SupplierSchema);
export default Supplier;
