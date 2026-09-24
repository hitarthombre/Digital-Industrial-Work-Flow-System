import { Schema, model, Document, Types } from "mongoose";

export interface IStockMovement extends Document {
  companyId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  productId?: Types.ObjectId;
  sku: string;
  itemName: string;
  type: "stock_in" | "stock_out" | "adjustment" | "transfer";
  itemCategory: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
  quantity: number;
  unit: string;
  unitCost?: number;
  totalValue?: number;
  referenceNumber?: string;
  reason?: string;
  notes?: string;
  performedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    itemName: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["stock_in", "stock_out", "adjustment", "transfer"],
      required: true,
      index: true,
    },
    itemCategory: {
      type: String,
      enum: ["raw_material", "finished_goods", "packaging", "components", "other"],
      default: "finished_goods",
      index: true,
    },
    quantity: { type: Number, required: true },
    unit: { type: String, default: "units", trim: true },
    unitCost: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    referenceNumber: { type: String, trim: true },
    reason: { type: String, trim: true },
    notes: { type: String, trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

StockMovementSchema.index({ companyId: 1, createdAt: -1 });
StockMovementSchema.index({ companyId: 1, warehouseId: 1, type: 1 });
StockMovementSchema.index({ companyId: 1, sku: 1 });

export const StockMovement = model<IStockMovement>("StockMovement", StockMovementSchema);
export default StockMovement;
