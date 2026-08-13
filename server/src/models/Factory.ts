import { Schema, model, Document, Types } from "mongoose";

export interface IFactoryLocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface IFactory extends Document {
  companyId: Types.ObjectId;
  name: string;
  code: string;
  location?: IFactoryLocation;
  managerId?: Types.ObjectId;
  contactEmail?: string;
  contactPhone?: string;
  capacity?: number;
  status: "active" | "inactive" | "maintenance" | "closed";
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FactorySchema = new Schema<IFactory>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    location: {
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    managerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    contactEmail: { type: String, lowercase: true, trim: true },
    contactPhone: { type: String, trim: true },
    capacity: { type: Number },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance", "closed"],
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

FactorySchema.index({ companyId: 1, code: 1 }, { unique: true });
FactorySchema.index({ companyId: 1, name: 1 });
FactorySchema.index({ name: "text", code: "text", "location.city": "text" });

export const Factory = model<IFactory>("Factory", FactorySchema);
export default Factory;
