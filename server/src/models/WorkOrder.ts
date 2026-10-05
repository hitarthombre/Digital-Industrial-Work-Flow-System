import mongoose, { Schema, Document } from "mongoose";

export type WorkOrderPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type WorkOrderStatus = "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
export type WorkOrderStage =
  | "PLANNED"
  | "MATERIAL_PREP"
  | "MACHINING"
  | "ASSEMBLY"
  | "QUALITY_CHECK"
  | "PACKAGING"
  | "COMPLETED";

export interface IJobCard {
  _id?: string;
  stageName: string;
  assignedOperator?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  notes?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IConsumedMaterial {
  _id?: string;
  product?: mongoose.Types.ObjectId;
  productName: string;
  warehouse?: mongoose.Types.ObjectId;
  warehouseName: string;
  quantity: number;
  unit: string;
  consumedAt: Date;
  loggedBy?: string;
}

export interface IScrapLog {
  _id?: string;
  materialOrProduct: string;
  quantity: number;
  reason: "DEFECTIVE_RAW_MATERIAL" | "OPERATOR_ERROR" | "MACHINE_MALFUNCTION" | "TESTING_LOSS" | "OTHER";
  stage?: string;
  notes?: string;
  loggedAt: Date;
}

export interface IWorkOrder extends Document {
  workOrderNumber: string;
  company: mongoose.Types.ObjectId;
  factory: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  targetQuantity: number;
  completedQuantity: number;
  scrapQuantity: number;
  unit: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  stage: WorkOrderStage;
  startDate: Date;
  targetCompletionDate: Date;
  actualCompletionDate?: Date;
  jobCards: IJobCard[];
  consumedMaterials: IConsumedMaterial[];
  scrapLogs: IScrapLog[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobCardSchema = new Schema<IJobCard>({
  stageName: { type: String, required: true },
  assignedOperator: { type: String },
  status: {
    type: String,
    enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
    default: "PENDING",
  },
  notes: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date },
});

const ConsumedMaterialSchema = new Schema<IConsumedMaterial>({
  product: { type: Schema.Types.ObjectId, ref: "Product" },
  productName: { type: String, required: true },
  warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse" },
  warehouseName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  consumedAt: { type: Date, default: Date.now },
  loggedBy: { type: String },
});

const ScrapLogSchema = new Schema<IScrapLog>({
  materialOrProduct: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  reason: {
    type: String,
    enum: ["DEFECTIVE_RAW_MATERIAL", "OPERATOR_ERROR", "MACHINE_MALFUNCTION", "TESTING_LOSS", "OTHER"],
    default: "OTHER",
  },
  stage: { type: String },
  notes: { type: String },
  loggedAt: { type: Date, default: Date.now },
});

const WorkOrderSchema = new Schema<IWorkOrder>(
  {
    workOrderNumber: { type: String, required: true, trim: true },
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    factory: { type: Schema.Types.ObjectId, ref: "Factory", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    targetQuantity: { type: Number, required: true, min: 1 },
    completedQuantity: { type: Number, default: 0, min: 0 },
    scrapQuantity: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "pcs" },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"],
      default: "PLANNED",
      index: true,
    },
    stage: {
      type: String,
      enum: [
        "PLANNED",
        "MATERIAL_PREP",
        "MACHINING",
        "ASSEMBLY",
        "QUALITY_CHECK",
        "PACKAGING",
        "COMPLETED",
      ],
      default: "PLANNED",
      index: true,
    },
    startDate: { type: Date, default: Date.now },
    targetCompletionDate: { type: Date, required: true },
    actualCompletionDate: { type: Date },
    jobCards: [JobCardSchema],
    consumedMaterials: [ConsumedMaterialSchema],
    scrapLogs: [ScrapLogSchema],
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

WorkOrderSchema.index({ company: 1, workOrderNumber: 1 }, { unique: true });

export const WorkOrder = mongoose.model<IWorkOrder>("WorkOrder", WorkOrderSchema);
export default WorkOrder;
