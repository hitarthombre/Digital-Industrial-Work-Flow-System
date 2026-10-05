import { Schema, model, Document, Types } from "mongoose";
import { ISalesAddress, SalesAddressSchema } from "./SalesCommon";

export type DispatchStatus =
  | "Pending"
  | "Packed"
  | "Shipped"
  | "In Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Returned"
  | "Cancelled";

export type TransportMode = "road" | "rail" | "air" | "sea" | "courier";
export type DispatchDocType = "invoice" | "packing_list" | "eway_bill" | "lr_copy" | "proof_of_delivery" | "other";

export interface IDispatchItem {
  _id?: Types.ObjectId;
  productId?: Types.ObjectId;
  sku: string;
  itemName: string;
  quantity: number;
  unit: string;
}

export interface ITransportDetails {
  mode?: TransportMode;
  carrierName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  trackingNumber?: string;
  waybillNumber?: string;
  freightCost?: number;
}

export interface ITrackingEvent {
  _id?: Types.ObjectId;
  status: string;
  location?: string;
  note?: string;
  timestamp: Date;
  updatedBy: Types.ObjectId;
}

export interface IDispatchDocument {
  _id?: Types.ObjectId;
  title: string;
  docType: DispatchDocType;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize: number;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface IDispatchOrder extends Document {
  companyId: Types.ObjectId;
  dispatchNumber: string;
  salesOrderId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  warehouseId: Types.ObjectId;
  items: IDispatchItem[];
  shippingAddress?: ISalesAddress;
  contactName?: string;
  contactPhone?: string;
  transport: ITransportDetails;
  plannedDispatchDate?: Date;
  estimatedDeliveryDate?: Date;
  actualDispatchDate?: Date;
  deliveredAt?: Date;
  receivedBy?: string;
  status: DispatchStatus;
  stockDeducted: boolean;
  trackingEvents: ITrackingEvent[];
  documents: Types.DocumentArray<IDispatchDocument & Types.Subdocument>;
  notes?: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DispatchItemSchema = new Schema<IDispatchItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  sku: { type: String, required: true, trim: true, uppercase: true },
  itemName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0.0001 },
  unit: { type: String, default: "units", trim: true },
});

const TransportSchema = new Schema<ITransportDetails>(
  {
    mode: { type: String, enum: ["road", "rail", "air", "sea", "courier"] },
    carrierName: { type: String, trim: true },
    vehicleNumber: { type: String, trim: true, uppercase: true },
    driverName: { type: String, trim: true },
    driverPhone: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
    waybillNumber: { type: String, trim: true },
    freightCost: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const TrackingEventSchema = new Schema<ITrackingEvent>({
  status: { type: String, required: true },
  location: { type: String, trim: true },
  note: { type: String, trim: true },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const DispatchDocumentSchema = new Schema<IDispatchDocument>({
  title: { type: String, required: true, trim: true },
  docType: {
    type: String,
    enum: ["invoice", "packing_list", "eway_bill", "lr_copy", "proof_of_delivery", "other"],
    default: "other",
  },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String },
  fileSize: { type: Number, default: 0 },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const DispatchOrderSchema = new Schema<IDispatchOrder>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    dispatchNumber: { type: String, required: true, uppercase: true, trim: true },
    salesOrderId: { type: Schema.Types.ObjectId, ref: "SalesOrder", index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    items: [DispatchItemSchema],
    shippingAddress: SalesAddressSchema,
    contactName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    transport: { type: TransportSchema, default: () => ({}) },
    plannedDispatchDate: { type: Date },
    estimatedDeliveryDate: { type: Date },
    actualDispatchDate: { type: Date },
    deliveredAt: { type: Date },
    receivedBy: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered", "Returned", "Cancelled"],
      default: "Pending",
      index: true,
    },
    stockDeducted: { type: Boolean, default: false },
    trackingEvents: [TrackingEventSchema],
    documents: [DispatchDocumentSchema],
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

DispatchOrderSchema.index({ companyId: 1, dispatchNumber: 1 }, { unique: true });
DispatchOrderSchema.index({ companyId: 1, status: 1 });

export const DispatchOrder = model<IDispatchOrder>("DispatchOrder", DispatchOrderSchema);
export default DispatchOrder;
