import { Schema, model, Document, Types } from "mongoose";

export type WorkOrderStatus = "Planned" | "Released" | "In Progress" | "On Hold" | "Completed" | "Cancelled";
export type StageStatus = "pending" | "in_progress" | "completed" | "skipped";
export type JobCardStatus = "open" | "in_progress" | "completed";

export interface IWorkOrderStage {
  _id?: Types.ObjectId;
  name: string;
  sequence: number;
  status: StageStatus;
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: Types.ObjectId;
  notes?: string;
}

export interface IJobCard {
  _id?: Types.ObjectId;
  jobCardNumber: string;
  title: string;
  stageName?: string;
  assignedTo?: Types.ObjectId;
  status: JobCardStatus;
  plannedHours: number;
  actualHours: number;
  instructions?: string;
  notes?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IWorkOrderMaterial {
  _id?: Types.ObjectId;
  sku: string;
  itemName: string;
  requiredQuantity: number;
  consumedQuantity: number;
  unit: string;
}

export interface IMaterialConsumption {
  sku: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  referenceNumber: string;
  consumedBy: Types.ObjectId;
  consumedAt: Date;
  notes?: string;
}

export interface IScrapEntry {
  quantity: number;
  reason: string;
  stageName?: string;
  recordedBy: Types.ObjectId;
  recordedAt: Date;
  notes?: string;
}

export interface IProductionOutput {
  quantity: number;
  warehouseId: Types.ObjectId;
  recordedBy: Types.ObjectId;
  recordedAt: Date;
  notes?: string;
}

export interface IWorkOrderTimelineEvent {
  status: string;
  timestamp: Date;
  updatedBy: Types.ObjectId;
  comment?: string;
}

export interface IWorkOrder extends Document {
  companyId: Types.ObjectId;
  workOrderNumber: string;
  planId?: Types.ObjectId;
  factoryId?: Types.ObjectId;
  warehouseId: Types.ObjectId;
  outputWarehouseId?: Types.ObjectId;
  productId?: Types.ObjectId;
  itemName: string;
  sku: string;
  unit: string;
  plannedQuantity: number;
  producedQuantity: number;
  scrapQuantity: number;
  priority: "low" | "medium" | "high" | "urgent";
  status: WorkOrderStatus;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  assignedTo?: Types.ObjectId;
  stages: Types.DocumentArray<IWorkOrderStage & Types.Subdocument>;
  jobCards: Types.DocumentArray<IJobCard & Types.Subdocument>;
  materials: Types.DocumentArray<IWorkOrderMaterial & Types.Subdocument>;
  consumptionLog: IMaterialConsumption[];
  scrapLog: IScrapEntry[];
  outputLog: IProductionOutput[];
  materialCost: number;
  notes?: string;
  statusTimeline: IWorkOrderTimelineEvent[];
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StageSchema = new Schema<IWorkOrderStage>({
  name: { type: String, required: true, trim: true },
  sequence: { type: Number, required: true },
  status: { type: String, enum: ["pending", "in_progress", "completed", "skipped"], default: "pending" },
  startedAt: { type: Date },
  completedAt: { type: Date },
  completedBy: { type: Schema.Types.ObjectId, ref: "User" },
  notes: { type: String, trim: true },
});

const JobCardSchema = new Schema<IJobCard>({
  jobCardNumber: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  stageName: { type: String, trim: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["open", "in_progress", "completed"], default: "open" },
  plannedHours: { type: Number, default: 0, min: 0 },
  actualHours: { type: Number, default: 0, min: 0 },
  instructions: { type: String, trim: true },
  notes: { type: String, trim: true },
  startedAt: { type: Date },
  completedAt: { type: Date },
});

const MaterialSchema = new Schema<IWorkOrderMaterial>({
  sku: { type: String, required: true, trim: true, uppercase: true },
  itemName: { type: String, required: true, trim: true },
  requiredQuantity: { type: Number, required: true, min: 0 },
  consumedQuantity: { type: Number, default: 0, min: 0 },
  unit: { type: String, default: "units", trim: true },
});

const ConsumptionSchema = new Schema<IMaterialConsumption>(
  {
    sku: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "units" },
    unitCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    referenceNumber: { type: String },
    consumedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    consumedAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const ScrapSchema = new Schema<IScrapEntry>(
  {
    quantity: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
    stageName: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const OutputSchema = new Schema<IProductionOutput>(
  {
    quantity: { type: Number, required: true, min: 0 },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const TimelineSchema = new Schema<IWorkOrderTimelineEvent>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, trim: true },
  },
  { _id: false }
);

const WorkOrderSchema = new Schema<IWorkOrder>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    workOrderNumber: { type: String, required: true, uppercase: true, trim: true },
    planId: { type: Schema.Types.ObjectId, ref: "ProductionPlan", index: true },
    factoryId: { type: Schema.Types.ObjectId, ref: "Factory", index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
    outputWarehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    itemName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    unit: { type: String, default: "units", trim: true },
    plannedQuantity: { type: Number, required: true, min: 1 },
    producedQuantity: { type: Number, default: 0, min: 0 },
    scrapQuantity: { type: Number, default: 0, min: 0 },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    status: {
      type: String,
      enum: ["Planned", "Released", "In Progress", "On Hold", "Completed", "Cancelled"],
      default: "Planned",
      index: true,
    },
    plannedStartDate: { type: Date },
    plannedEndDate: { type: Date },
    actualStartDate: { type: Date },
    actualEndDate: { type: Date },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    stages: [StageSchema],
    jobCards: [JobCardSchema],
    materials: [MaterialSchema],
    consumptionLog: [ConsumptionSchema],
    scrapLog: [ScrapSchema],
    outputLog: [OutputSchema],
    materialCost: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },
    statusTimeline: [TimelineSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

WorkOrderSchema.index({ companyId: 1, workOrderNumber: 1 }, { unique: true });
WorkOrderSchema.index({ companyId: 1, status: 1 });

export const WorkOrder = model<IWorkOrder>("WorkOrder", WorkOrderSchema);
export default WorkOrder;
