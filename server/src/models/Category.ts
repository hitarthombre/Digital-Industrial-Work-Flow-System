import { Schema, model, Document, Types } from "mongoose";

export interface ICategory extends Document {
  companyId: Types.ObjectId;
  name: string;
  code: string;
  slug?: string;
  description?: string;
  parentCategoryId?: Types.ObjectId;
  status: "active" | "inactive";
  icon?: string;
  image?: string;
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    description: { type: String, trim: true },
    parentCategoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    icon: { type: String, trim: true },
    image: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

CategorySchema.index({ companyId: 1, code: 1 }, { unique: true });
CategorySchema.index({ companyId: 1, name: 1 });

export const Category = model<ICategory>("Category", CategorySchema);
export default Category;
