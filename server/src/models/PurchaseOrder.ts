import { Schema, model, Document, Types } from "mongoose";

export type POStatusType =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "PO Created"
  | "Issued"
  | "In Transit"
  | "Partial Delivery"
  | "Goods Received"
  | "Closed"
  | "Cancelled";

export interface IPurchaseOrderItem {
  _id?: Types.ObjectId;
  productId?: Types.ObjectId;
  inventoryId?: Types.ObjectId;
  itemName: string;
  sku: string;
  itemCategory: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
  quantityOrdered: number;
  quantityReceived: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  taxAmount?: number;
  remarks?: string;
}

export interface IPOStatusTimelineEvent {
  status: string;
  timestamp: Date;
  updatedBy: Types.ObjectId;
  comment?: string;
}

export interface IPurchaseOrder extends Document {
  companyId: Types.ObjectId;
  poNumber: string;
  purchaseRequestId?: Types.ObjectId;
  supplierId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  factoryId?: Types.ObjectId;
  issuerId: Types.ObjectId;
  status: POStatusType;
  paymentTerms: string;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  items: IPurchaseOrderItem[];
  subtotal: number;
  taxTotal: number;
  shippingCost: number;
  grandTotal: number;
  notes?: string;
  termsAndConditions?: string;
  statusTimeline: IPOStatusTimelineEvent[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
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
    quantityOrdered: { type: Number, required: true, min: 1 },
    quantityReceived: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "units", trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    remarks: { type: String, trim: true },
  },
  { timestamps: false }
);

const POStatusTimelineSchema = new Schema<IPOStatusTimelineEvent>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, trim: true },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    poNumber: { type: String, required: true, uppercase: true, trim: true },
    purchaseRequestId: { type: Schema.Types.ObjectId, ref: "PurchaseRequest", index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    factoryId: { type: Schema.Types.ObjectId, ref: "Factory", index: true },
    issuerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: [
        "Draft",
        "Submitted",
        "Approved",
        "PO Created",
        "Issued",
        "In Transit",
        "Partial Delivery",
        "Goods Received",
        "Closed",
        "Cancelled",
      ],
      default: "PO Created",
      index: true,
    },
    paymentTerms: { type: String, default: "Net 30", trim: true },
    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    items: [PurchaseOrderItemSchema],
    subtotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },
    termsAndConditions: { type: String, trim: true },
    statusTimeline: [POStatusTimelineSchema],
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

PurchaseOrderSchema.index({ companyId: 1, poNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ companyId: 1, status: 1 });
PurchaseOrderSchema.index({ companyId: 1, supplierId: 1 });

export const PurchaseOrder = model<IPurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);
export default PurchaseOrder;
