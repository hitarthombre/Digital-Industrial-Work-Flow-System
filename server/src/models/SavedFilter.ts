import { Schema, model, Document, Types } from "mongoose";

export interface ISavedFilter extends Document {
  companyId: Types.ObjectId;
  userId: Types.ObjectId;
  module: string;
  name: string;
  filters: Record<string, any>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SavedFilterSchema = new Schema<ISavedFilter>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Which list the preset belongs to, e.g. "sales_orders", "work_orders"
    module: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    filters: { type: Schema.Types.Mixed, default: {} },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SavedFilterSchema.index({ userId: 1, module: 1, name: 1 }, { unique: true });

export const SavedFilter = model<ISavedFilter>("SavedFilter", SavedFilterSchema);
export default SavedFilter;
