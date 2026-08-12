import { Schema, model, Document, Types } from "mongoose";

export interface ICompanyBranding {
  displayName?: string;
  primaryColor?: string;
  logo?: string;
}

export interface ICompanySettings {
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  language?: string;
  fiscalYear?: string;
  defaultWarehouse?: string;
  defaultFactory?: string;
  notificationPreferences?: Record<string, boolean>;
}

export interface ICompany extends Document {
  name: string;
  code: string;
  industry?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  gstNumber?: string;
  website?: string;
  currency: string;
  timezone: string;
  status: "active" | "inactive" | "suspended" | "pending";
  subscriptionPlan: "free" | "starter" | "growth" | "enterprise";
  branding?: ICompanyBranding;
  settings?: ICompanySettings;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    industry: { type: String, trim: true, index: true },
    logo: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    website: { type: String, trim: true },
    currency: { type: String, default: "USD" },
    timezone: { type: String, default: "UTC" },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "pending"],
      default: "active",
      index: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "starter", "growth", "enterprise"],
      default: "free",
    },
    branding: {
      displayName: { type: String, trim: true },
      primaryColor: { type: String, trim: true },
      logo: { type: String, trim: true },
    },
    settings: {
      currency: { type: String, default: "USD" },
      timezone: { type: String, default: "UTC" },
      dateFormat: { type: String, default: "YYYY-MM-DD" },
      language: { type: String, default: "en" },
      fiscalYear: { type: String, default: "April-March" },
      defaultWarehouse: { type: String, trim: true },
      defaultFactory: { type: String, trim: true },
      notificationPreferences: { type: Schema.Types.Mixed, default: {} },
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

CompanySchema.index({ name: "text", code: "text", industry: "text" });

export const Company = model<ICompany>("Company", CompanySchema);
export default Company;

