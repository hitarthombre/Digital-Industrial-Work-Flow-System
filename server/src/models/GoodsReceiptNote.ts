import { Schema, model, Document, Types } from "mongoose";

export type GRNStatusType = "Received" | "Inspected" | "Stock Updated" | "Completed";

export interface IGRNItem {
  _id?: Types.ObjectId;
  poItemId?: string;
  productId?: Types.ObjectId;
  inventoryId?: Types.ObjectId;
  itemName: string;
  sku: string;
  itemCategory: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
  quantityOrdered: number;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  remarks?: string;
  rejectionReason?: string;
}

export interface IGoodsReceiptNote extends Document {
  companyId: Types.ObjectId;
  grnNumber: string;
  purchaseOrderId: Types.ObjectId;
  supplierId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  receivedBy: Types.ObjectId;
  receivedDate: Date;
  deliveryChallanNumber?: string;
  invoiceNumber?: string;
  items: IGRNItem[];
  totalAcceptedCost: number;
  status: GRNStatusType;
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GRNItemSchema = new Schema<IGRNItem>(
  {
    poItemId: { type: String, trim: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: "Inventory", index: true },
    itemName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    itemCategory: {
      type: String,
      enum: ["raw_material", "finished_goods", "packaging", "components", "other"],
      default: "raw_material",
    },
    quantityOrdered: { type: Number, required: true, min: 0 },
    quantityReceived: { type: Number, required: true, min: 0 },
    quantityAccepted: { type: Number, required: true, min: 0 },
    quantityRejected: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "units", trim: true },
    unitCost: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    remarks: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: false }
);

const GoodsReceiptNoteSchema = new Schema<IGoodsReceiptNote>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    grnNumber: { type: String, required: true, uppercase: true, trim: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder", required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    receivedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receivedDate: { type: Date, default: Date.now },
    deliveryChallanNumber: { type: String, trim: true },
    invoiceNumber: { type: String, trim: true },
    items: [GRNItemSchema],
    totalAcceptedCost: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["Received", "Inspected", "Stock Updated", "Completed"],
      default: "Stock Updated",
      index: true,
    },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

GoodsReceiptNoteSchema.index({ companyId: 1, grnNumber: 1 }, { unique: true });
GoodsReceiptNoteSchema.index({ companyId: 1, purchaseOrderId: 1 });
GoodsReceiptNoteSchema.index({ companyId: 1, supplierId: 1 });

export const GoodsReceiptNote = model<IGoodsReceiptNote>("GoodsReceiptNote", GoodsReceiptNoteSchema);
export default GoodsReceiptNote;
