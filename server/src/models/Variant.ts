import { Schema, model, Document, Types } from "mongoose";

export interface IVariantAttribute {
  key: string;
  value: string;
}

export interface IVariant extends Document {
  companyId: Types.ObjectId;
  productId?: Types.ObjectId;
  name: string;
  sku: string;
  barcode?: string;
  attributes?: IVariantAttribute[];
  price?: number;
  costPrice?: number;
  stockQuantity: number;
  minStockLevel: number;
  status: "active" | "discontinued" | "out_of_stock";
  image?: string;
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    barcode: { type: String, trim: true },
    attributes: [
      {
        key: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
      },
    ],
    price: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    stockQuantity: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["active", "discontinued", "out_of_stock"],
      default: "active",
      index: true,
    },
    image: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

VariantSchema.index({ companyId: 1, sku: 1 }, { unique: true });
VariantSchema.index({ companyId: 1, productId: 1 });

export const Variant = model<IVariant>("Variant", VariantSchema);
export default Variant;
