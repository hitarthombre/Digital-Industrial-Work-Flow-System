import { Schema, model, Document, Types } from "mongoose";
import { ISalesLineItem, ISalesTotals, SalesLineItemSchema, salesTotalsFields } from "./SalesCommon";

export type InvoiceStatus = "Unpaid" | "Partially Paid" | "Paid" | "Overdue" | "Cancelled";
export type PaymentMethod = "cash" | "bank_transfer" | "cheque" | "card" | "upi" | "other";

export interface IInvoicePayment {
  _id?: Types.ObjectId;
  amount: number;
  paymentDate: Date;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  recordedBy: Types.ObjectId;
}

export interface ISalesInvoice extends Document, ISalesTotals {
  companyId: Types.ObjectId;
  invoiceNumber: string;
  salesOrderId: Types.ObjectId;
  customerId: Types.ObjectId;
  invoiceDate: Date;
  dueDate: Date;
  items: ISalesLineItem[];
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  payments: IInvoicePayment[];
  notes?: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IInvoicePayment>(
  {
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, default: Date.now },
    method: {
      type: String,
      enum: ["cash", "bank_transfer", "cheque", "card", "upi", "other"],
      default: "bank_transfer",
    },
    reference: { type: String, trim: true },
    notes: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const SalesInvoiceSchema = new Schema<ISalesInvoice>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    invoiceNumber: { type: String, required: true, uppercase: true, trim: true },
    salesOrderId: { type: Schema.Types.ObjectId, ref: "SalesOrder", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    items: [SalesLineItemSchema],
    ...salesTotalsFields,
    amountPaid: { type: Number, default: 0, min: 0 },
    balanceDue: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid", "Overdue", "Cancelled"],
      default: "Unpaid",
      index: true,
    },
    payments: [PaymentSchema],
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

SalesInvoiceSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true });
SalesInvoiceSchema.index({ companyId: 1, status: 1, dueDate: 1 });

export const SalesInvoice = model<ISalesInvoice>("SalesInvoice", SalesInvoiceSchema);
export default SalesInvoice;
