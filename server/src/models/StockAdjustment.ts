import { Schema, model, Document, Types } from "mongoose";

export interface IStockAdjustment extends Document {
  companyId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  inventoryId?: Types.ObjectId;
  sku: string;
  itemName: string;
  previousQuantity: number;
  newQuantity: number;
  differenceQuantity: number;
  unitCost: number;
  totalAdjustmentValue: number;
  reason: string;
  referenceNumber: string;
  notes?: string;
  performedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StockAdjustmentSchema = new Schema<IStockAdjustment>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: "Inventory", index: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    itemName: { type: String, required: true, trim: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    differenceQuantity: { type: Number, required: true },
    unitCost: { type: Number, default: 0 },
    totalAdjustmentValue: { type: Number, default: 0 },
    reason: { type: String, required: true, trim: true },
    referenceNumber: { type: String, required: true, uppercase: true, trim: true },
    notes: { type: String, trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

StockAdjustmentSchema.index({ companyId: 1, createdAt: -1 });
StockAdjustmentSchema.index({ companyId: 1, warehouseId: 1 });
StockAdjustmentSchema.index({ companyId: 1, sku: 1 });

export const StockAdjustment = model<IStockAdjustment>("StockAdjustment", StockAdjustmentSchema);
export default StockAdjustment;
