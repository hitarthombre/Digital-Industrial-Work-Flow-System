import { Schema, model, Document, Types } from "mongoose";

export type PRPriorityType = "low" | "medium" | "high" | "urgent";
export type PRStatusType =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Rejected"
  | "PO Created"
  | "Goods Received"
  | "Closed"
  | "Cancelled";

export interface IPurchaseRequestItem {
  _id?: Types.ObjectId;
  productId?: Types.ObjectId;
  inventoryId?: Types.ObjectId;
  itemName: string;
  sku?: string;
  itemCategory: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotalPrice: number;
  notes?: string;
}

export interface IPurchaseRequest extends Document {
  companyId: Types.ObjectId;
  requestNumber: string;
  requesterId: Types.ObjectId;
  department?: string;
  warehouseId: Types.ObjectId;
  factoryId?: Types.ObjectId;
  priority: PRPriorityType;
  status: PRStatusType;
  items: IPurchaseRequestItem[];
  totalEstimatedCost: number;
  requiredByDate?: Date;
  justification?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  approvalNotes?: string;
  purchaseOrderId?: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseRequestItemSchema = new Schema<IPurchaseRequestItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: "Inventory", index: true },
    itemName: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, uppercase: true },
    itemCategory: {
      type: String,
      enum: ["raw_material", "finished_goods", "packaging", "components", "other"],
      default: "raw_material",
    },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: "units", trim: true },
    estimatedUnitPrice: { type: Number, default: 0, min: 0 },
    estimatedTotalPrice: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: false }
);

const PurchaseRequestSchema = new Schema<IPurchaseRequest>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    requestNumber: { type: String, required: true, uppercase: true, trim: true },
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    department: { type: String, trim: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    factoryId: { type: Schema.Types.ObjectId, ref: "Factory", index: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "Submitted",
        "Approved",
        "Rejected",
        "PO Created",
        "Goods Received",
        "Closed",
        "Cancelled",
      ],
      default: "Draft",
      index: true,
    },
    items: [PurchaseRequestItemSchema],
    totalEstimatedCost: { type: Number, default: 0, min: 0 },
    requiredByDate: { type: Date },
    justification: { type: String, trim: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
    approvalNotes: { type: String, trim: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder" },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

PurchaseRequestSchema.index({ companyId: 1, requestNumber: 1 }, { unique: true });
PurchaseRequestSchema.index({ companyId: 1, status: 1 });
PurchaseRequestSchema.index({ companyId: 1, requesterId: 1 });

export const PurchaseRequest = model<IPurchaseRequest>("PurchaseRequest", PurchaseRequestSchema);
export default PurchaseRequest;
