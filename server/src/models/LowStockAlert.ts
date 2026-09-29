import { Schema, model, Document, Types } from "mongoose";

export interface ILowStockAlert extends Document {
  companyId: Types.ObjectId;
  inventoryId: Types.ObjectId;
  sku: string;
  itemName: string;
  itemCategory: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
  warehouseId: Types.ObjectId;
  currentQuantity: number;
  minThreshold: number;
  severity: "warning" | "critical";
  status: "active" | "acknowledged" | "resolved";
  triggeredAt: Date;
  acknowledgedBy?: Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LowStockAlertSchema = new Schema<ILowStockAlert>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: "Inventory", required: true, index: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    itemName: { type: String, required: true, trim: true },
    itemCategory: {
      type: String,
      enum: ["raw_material", "finished_goods", "packaging", "components", "other"],
      default: "finished_goods",
    },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    currentQuantity: { type: Number, required: true },
    minThreshold: { type: Number, required: true },
    severity: { type: String, enum: ["warning", "critical"], default: "warning" },
    status: {
      type: String,
      enum: ["active", "acknowledged", "resolved"],
      default: "active",
      index: true,
    },
    triggeredAt: { type: Date, default: Date.now },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: "User" },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

LowStockAlertSchema.index({ companyId: 1, inventoryId: 1, status: 1 });
LowStockAlertSchema.index({ companyId: 1, status: 1, createdAt: -1 });

export const LowStockAlert = model<ILowStockAlert>("LowStockAlert", LowStockAlertSchema);
export default LowStockAlert;
