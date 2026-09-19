import { Schema, model, Document, Types } from "mongoose";

export interface ICustomerAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ICustomerDocumentItem {
  _id?: Types.ObjectId;
  title: string;
  category: "CONTRACT" | "TAX_CERTIFICATE" | "CREDIT_AGREEMENT" | "INVOICE" | "PO" | "OTHER";
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: Types.ObjectId;
  uploadedAt: Date;
  notes?: string;
}

export interface ICustomerOrderItem {
  itemId?: Types.ObjectId;
  sku?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ICustomerOrder {
  _id?: Types.ObjectId;
  orderNumber: string;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  status: "DRAFT" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL" | "OVERDUE" | "REFUNDED";
  itemsCount: number;
  totalAmount: number;
  paidAmount?: number;
  items?: ICustomerOrderItem[];
  shippingAddress?: ICustomerAddress;
  notes?: string;
}

export interface ICustomer extends Document {
  companyId: Types.ObjectId;
  code: string;
  name: string;
  segment: "ENTERPRISE" | "SMB" | "VIP" | "RETAIL";
  status: "ACTIVE" | "INACTIVE" | "LEAD";
  creditStanding: "GOOD" | "WARNING" | "BLOCKED" | "ON_HOLD";
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  email?: string;
  phone?: string;
  website?: string;
  billingAddress?: ICustomerAddress;
  shippingAddress?: ICustomerAddress;
  taxId?: string;
  creditLimit: number;
  outstandingBalance: number;
  accountManagerId?: Types.ObjectId;
  notes?: string;
  lifetimeSales: number;
  activeOrdersCount: number;
  orders: ICustomerOrder[];
  documents: ICustomerDocumentItem[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    segment: {
      type: String,
      enum: ["ENTERPRISE", "SMB", "VIP", "RETAIL"],
      default: "SMB",
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "LEAD"],
      default: "ACTIVE",
      index: true,
    },
    creditStanding: {
      type: String,
      enum: ["GOOD", "WARNING", "BLOCKED", "ON_HOLD"],
      default: "GOOD",
      index: true,
    },
    contactPerson: {
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      role: { type: String, trim: true },
    },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    billingAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String },
    },
    shippingAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String },
    },
    taxId: { type: String, trim: true },
    creditLimit: { type: Number, default: 10000, min: 0 },
    outstandingBalance: { type: Number, default: 0, min: 0 },
    accountManagerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    notes: { type: String },
    lifetimeSales: { type: Number, default: 0 },
    activeOrdersCount: { type: Number, default: 0 },
    orders: [
      {
        orderNumber: { type: String, required: true },
        orderDate: { type: Date, default: Date.now },
        expectedDeliveryDate: { type: Date },
        status: {
          type: String,
          enum: ["DRAFT", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
          default: "CONFIRMED",
        },
        paymentStatus: {
          type: String,
          enum: ["PAID", "UNPAID", "PARTIAL", "OVERDUE", "REFUNDED"],
          default: "UNPAID",
        },
        itemsCount: { type: Number, default: 1 },
        totalAmount: { type: Number, required: true },
        paidAmount: { type: Number, default: 0 },
        items: [
          {
            itemId: { type: Schema.Types.ObjectId },
            sku: { type: String },
            name: { type: String },
            quantity: { type: Number, default: 1 },
            unitPrice: { type: Number, default: 0 },
            totalPrice: { type: Number, default: 0 },
          },
        ],
        shippingAddress: {
          street: { type: String },
          city: { type: String },
          state: { type: String },
          country: { type: String },
          postalCode: { type: String },
        },
        notes: { type: String },
      },
    ],
    documents: [
      {
        title: { type: String, required: true },
        category: {
          type: String,
          enum: ["CONTRACT", "TAX_CERTIFICATE", "CREDIT_AGREEMENT", "INVOICE", "PO", "OTHER"],
          default: "OTHER",
        },
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileSize: { type: Number },
        mimeType: { type: String },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

CustomerSchema.index({ companyId: 1, code: 1 }, { unique: true });
CustomerSchema.index({ companyId: 1, name: 1 });
CustomerSchema.index({ name: "text", code: "text", email: "text" });

export const Customer = model<ICustomer>("Customer", CustomerSchema);
export default Customer;
