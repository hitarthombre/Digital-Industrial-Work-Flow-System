import { Schema, model, Document, Types } from "mongoose";
import {
  ISalesLineItem,
  ISalesTotals,
  ISalesTimelineEvent,
  ISalesAddress,
  SalesLineItemSchema,
  SalesTimelineSchema,
  SalesAddressSchema,
  salesTotalsFields,
} from "./SalesCommon";

export type SalesOrderStatus =
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Processing"
  | "Partially Dispatched"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";

export type SalesPaymentStatus = "unpaid" | "partially_paid" | "paid";

export interface ISalesOrder extends Document, ISalesTotals {
  companyId: Types.ObjectId;
  orderNumber: string;
  customerId: Types.ObjectId;
  quotationId?: Types.ObjectId;
  warehouseId: Types.ObjectId;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  customerPoNumber?: string;
  status: SalesOrderStatus;
  items: Types.DocumentArray<ISalesLineItem & Types.Subdocument>;
  shippingAddress?: ISalesAddress;
  paymentTerms?: string;
  paymentStatus: SalesPaymentStatus;
  amountInvoiced: number;
  amountPaid: number;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  approvalNotes?: string;
  rejectionReason?: string;
  notes?: string;
  statusTimeline: ISalesTimelineEvent[];
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SalesOrderSchema = new Schema<ISalesOrder>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    orderNumber: { type: String, required: true, uppercase: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    quotationId: { type: Schema.Types.ObjectId, ref: "Quotation" },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    customerPoNumber: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        "Pending Approval",
        "Approved",
        "Rejected",
        "Processing",
        "Partially Dispatched",
        "Dispatched",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending Approval",
      index: true,
    },
    items: [SalesLineItemSchema],
    ...salesTotalsFields,
    shippingAddress: SalesAddressSchema,
    paymentTerms: { type: String, trim: true, default: "Net 30" },
    paymentStatus: { type: String, enum: ["unpaid", "partially_paid", "paid"], default: "unpaid", index: true },
    amountInvoiced: { type: Number, default: 0, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    approvalNotes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    notes: { type: String, trim: true },
    statusTimeline: [SalesTimelineSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

SalesOrderSchema.index({ companyId: 1, orderNumber: 1 }, { unique: true });
SalesOrderSchema.index({ companyId: 1, status: 1 });

export const SalesOrder = model<ISalesOrder>("SalesOrder", SalesOrderSchema);
export default SalesOrder;
