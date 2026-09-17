import { Schema, model, Document, Types } from "mongoose";

export interface IWarehouseLocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface IWarehouse extends Document {
  companyId: Types.ObjectId;
  name: string;
  code: string;
  type: "raw_material" | "finished_goods" | "distribution" | "cold_storage" | "general";
  description?: string;
  address?: string;
  location?: IWarehouseLocation;
  capacity: number;
  currentUsage: number;
  managerId?: Types.ObjectId;
  contactEmail?: string;
  contactPhone?: string;
  status: "active" | "inactive" | "maintenance" | "full" | "closed";
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    type: {
      type: String,
      enum: ["raw_material", "finished_goods", "distribution", "cold_storage", "general"],
      default: "general",
      index: true,
    },
    description: { type: String, trim: true },
    address: { type: String, trim: true },
    location: {
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    capacity: { type: Number, default: 0, min: 0 },
    currentUsage: { type: Number, default: 0, min: 0 },
    managerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    contactEmail: { type: String, lowercase: true, trim: true },
    contactPhone: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance", "full", "closed"],
      default: "active",
      index: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

WarehouseSchema.index({ companyId: 1, code: 1 }, { unique: true });
WarehouseSchema.index({ companyId: 1, name: 1 });
WarehouseSchema.index({ name: "text", code: "text", address: "text", "location.city": "text" });

export const Warehouse = model<IWarehouse>("Warehouse", WarehouseSchema);
export default Warehouse;
