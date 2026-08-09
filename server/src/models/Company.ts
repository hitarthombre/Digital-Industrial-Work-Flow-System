import { Schema, model, Document } from "mongoose";

export interface ICompany extends Document {
  name: string;
  code: string;
  industry?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  currency: string;
  timezone: string;
  status: "active" | "inactive" | "suspended";
  subscriptionPlan: "free" | "starter" | "growth" | "enterprise";
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    industry: { type: String, trim: true },
    logo: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    currency: { type: String, default: "USD" },
    timezone: { type: String, default: "UTC" },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "starter", "growth", "enterprise"],
      default: "free",
    },
  },
  {
    timestamps: true,
  }
);

export const Company = model<ICompany>("Company", CompanySchema);
