import { Schema, Types } from "mongoose";

// Line item shared by quotations, sales orders and invoices
export interface ISalesLineItem {
  _id?: Types.ObjectId;
  productId?: Types.ObjectId;
  itemName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  lineSubtotal: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  quantityDispatched?: number;
}

export interface ISalesTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingCost: number;
  grandTotal: number;
}

export interface ISalesTimelineEvent {
  status: string;
  timestamp: Date;
  updatedBy: Types.ObjectId;
  comment?: string;
}

export interface ISalesAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export const SalesLineItemSchema = new Schema<ISalesLineItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  itemName: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true, uppercase: true },
  quantity: { type: Number, required: true, min: 0.0001 },
  unit: { type: String, default: "units", trim: true },
  unitPrice: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  taxRate: { type: Number, default: 0, min: 0 },
  lineSubtotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  lineTotal: { type: Number, default: 0 },
  quantityDispatched: { type: Number, default: 0, min: 0 },
});

export const SalesTimelineSchema = new Schema<ISalesTimelineEvent>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, trim: true },
  },
  { _id: false }
);

export const SalesAddressSchema = new Schema<ISalesAddress>(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true },
  },
  { _id: false }
);

export const salesTotalsFields = {
  subtotal: { type: Number, default: 0, min: 0 },
  discountTotal: { type: Number, default: 0, min: 0 },
  taxTotal: { type: Number, default: 0, min: 0 },
  shippingCost: { type: Number, default: 0, min: 0 },
  grandTotal: { type: Number, default: 0, min: 0 },
};
