import { Schema, model, Document, Types } from "mongoose";
import { ISalesLineItem, SalesLineItemSchema, salesTotalsFields, ISalesTotals } from "./SalesCommon";

export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired" | "Converted";

export interface IQuotation extends Document, ISalesTotals {
  companyId: Types.ObjectId;
  quotationNumber: string;
  customerId: Types.ObjectId;
  quotationDate: Date;
  validUntil?: Date;
  status: QuotationStatus;
  items: ISalesLineItem[];
  notes?: string;
  termsAndConditions?: string;
  salesOrderId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationSchema = new Schema<IQuotation>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    quotationNumber: { type: String, required: true, uppercase: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    quotationDate: { type: Date, default: Date.now },
    validUntil: { type: Date },
    status: {
      type: String,
      enum: ["Draft", "Sent", "Accepted", "Rejected", "Expired", "Converted"],
      default: "Draft",
      index: true,
    },
    items: [SalesLineItemSchema],
    ...salesTotalsFields,
    notes: { type: String, trim: true },
    termsAndConditions: { type: String, trim: true },
    salesOrderId: { type: Schema.Types.ObjectId, ref: "SalesOrder" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

QuotationSchema.index({ companyId: 1, quotationNumber: 1 }, { unique: true });

export const Quotation = model<IQuotation>("Quotation", QuotationSchema);
export default Quotation;
