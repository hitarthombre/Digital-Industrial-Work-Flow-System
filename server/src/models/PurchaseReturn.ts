import { Schema, model, Document, Types } from "mongoose";

export type PurchaseReturnReasonType =
  | "defective"
  | "damaged_in_transit"
  | "incorrect_specification"
  | "excess_quantity"
  | "expired"
  | "other";

export type PurchaseReturnStatusType = "Pending" | "Approved" | "Shipped" | "Completed" | "Rejected";
export type PurchaseReturnRefundStatusType = "Pending" | "Refunded" | "Credit Note Issued";

export interface IPurchaseReturnItem {
  _id?: Types.ObjectId;
  productId?: Types.ObjectId;
  inventoryId?: Types.ObjectId;
  itemName: string;
  sku: string;
  itemCategory: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
  quantityReturned: number;
  unit: string;
  unitCost: number;
  totalRefundAmount: number;
  condition?: string;
}

export interface IPurchaseReturn extends Document {
  companyId: Types.ObjectId;
  returnNumber: string;
  purchaseOrderId: Types.ObjectId;
  grnId?: Types.ObjectId;
  supplierId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  returnedBy: Types.ObjectId;
  returnDate: Date;
  reason: PurchaseReturnReasonType;
  reasonDetails?: string;
  items: IPurchaseReturnItem[];
  totalReturnAmount: number;
  status: PurchaseReturnStatusType;
  refundStatus: PurchaseReturnRefundStatusType;
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseReturnItemSchema = new Schema<IPurchaseReturnItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: "Inventory", index: true },
    itemName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    itemCategory: {
      type: String,
      enum: ["raw_material", "finished_goods", "packaging", "components", "other"],
      default: "raw_material",
    },
    quantityReturned: { type: Number, required: true, min: 1 },
    unit: { type: String, default: "units", trim: true },
    unitCost: { type: Number, default: 0, min: 0 },
    totalRefundAmount: { type: Number, default: 0, min: 0 },
    condition: { type: String, trim: true },
  },
  { timestamps: false }
);

const PurchaseReturnSchema = new Schema<IPurchaseReturn>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    returnNumber: { type: String, required: true, uppercase: true, trim: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder", required: true, index: true },
    grnId: { type: Schema.Types.ObjectId, ref: "GoodsReceiptNote", index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    returnedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    returnDate: { type: Date, default: Date.now },
    reason: {
      type: String,
      enum: [
        "defective",
        "damaged_in_transit",
        "incorrect_specification",
        "excess_quantity",
        "expired",
        "other",
      ],
      required: true,
      index: true,
    },
    reasonDetails: { type: String, trim: true },
    items: [PurchaseReturnItemSchema],
    totalReturnAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Shipped", "Completed", "Rejected"],
      default: "Completed",
      index: true,
    },
    refundStatus: {
      type: String,
      enum: ["Pending", "Refunded", "Credit Note Issued"],
      default: "Pending",
      index: true,
    },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

PurchaseReturnSchema.index({ companyId: 1, returnNumber: 1 }, { unique: true });
PurchaseReturnSchema.index({ companyId: 1, purchaseOrderId: 1 });
PurchaseReturnSchema.index({ companyId: 1, supplierId: 1 });

export const PurchaseReturn = model<IPurchaseReturn>("PurchaseReturn", PurchaseReturnSchema);
export default PurchaseReturn;
