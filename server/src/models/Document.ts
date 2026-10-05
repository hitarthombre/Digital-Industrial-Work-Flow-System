import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

export const DOCUMENT_CATEGORIES = [
  "sop",
  "manual",
  "certificate",
  "product_document",
  "drawing",
  "contract",
  "policy",
  "report",
  "invoice",
  "other",
] as const;

export const DOCUMENT_LINK_MODULES = [
  "none",
  "product",
  "supplier",
  "customer",
  "factory",
  "warehouse",
  "work_order",
  "sales_order",
  "purchase_order",
  "dispatch",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
export type DocumentLinkModule = (typeof DOCUMENT_LINK_MODULES)[number];

export interface IDocument extends MongooseDocument {
  companyId: Types.ObjectId;
  title: string;
  description?: string;
  category: DocumentCategory;
  tags: string[];
  documentNumber?: string;
  version: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize: number;
  linkedModule: DocumentLinkModule;
  linkedRecordId?: Types.ObjectId;
  linkedRecordLabel?: string;
  effectiveDate?: Date;
  expiryDate?: Date;
  uploadedBy: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, enum: DOCUMENT_CATEGORIES, default: "other", index: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    documentNumber: { type: String, trim: true, uppercase: true },
    version: { type: String, default: "1.0", trim: true },
    fileName: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    fileType: { type: String, trim: true },
    fileSize: { type: Number, default: 0, min: 0 },
    linkedModule: { type: String, enum: DOCUMENT_LINK_MODULES, default: "none", index: true },
    linkedRecordId: { type: Schema.Types.ObjectId, index: true },
    linkedRecordLabel: { type: String, trim: true },
    effectiveDate: { type: Date },
    expiryDate: { type: Date },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

DocumentSchema.index({ companyId: 1, category: 1, createdAt: -1 });
DocumentSchema.index({ title: "text", description: "text", tags: "text", fileName: "text" });

export const DocumentModel = model<IDocument>("Document", DocumentSchema);
export default DocumentModel;
