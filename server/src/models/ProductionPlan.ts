import { Schema, model, Document, Types } from "mongoose";

export type ProductionPlanStatus = "Draft" | "Approved" | "In Progress" | "Completed" | "Cancelled";

export interface IProductionPlanItem {
  _id?: Types.ObjectId;
  productId?: Types.ObjectId;
  itemName: string;
  sku: string;
  plannedQuantity: number;
  producedQuantity: number;
  unit: string;
  notes?: string;
}

export interface IProductionPlan extends Document {
  companyId: Types.ObjectId;
  planNumber: string;
  title: string;
  factoryId?: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: ProductionPlanStatus;
  priority: "low" | "medium" | "high" | "urgent";
  items: IProductionPlanItem[];
  notes?: string;
  createdBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductionPlanItemSchema = new Schema<IProductionPlanItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  itemName: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true, uppercase: true },
  plannedQuantity: { type: Number, required: true, min: 1 },
  producedQuantity: { type: Number, default: 0, min: 0 },
  unit: { type: String, default: "units", trim: true },
  notes: { type: String, trim: true },
});

const ProductionPlanSchema = new Schema<IProductionPlan>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    planNumber: { type: String, required: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    factoryId: { type: Schema.Types.ObjectId, ref: "Factory", index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Draft", "Approved", "In Progress", "Completed", "Cancelled"],
      default: "Draft",
      index: true,
    },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    items: [ProductionPlanItemSchema],
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ProductionPlanSchema.index({ companyId: 1, planNumber: 1 }, { unique: true });

export const ProductionPlan = model<IProductionPlan>("ProductionPlan", ProductionPlanSchema);
export default ProductionPlan;
