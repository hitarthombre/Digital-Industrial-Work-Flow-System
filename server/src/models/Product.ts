import { Schema, model, Document, Types } from "mongoose";

export interface IUom {
  unit: string; // e.g. 'pcs', 'kg', 'meter', 'liter', 'box'
  baseUnit?: string;
  conversionFactor?: number;
  allowedUnits?: string[];
}

export interface ICustomAttribute {
  key: string;
  value: any;
  unit?: string;
}

export interface IProductImage {
  url: string;
  publicId?: string;
  isPrimary?: boolean;
  uploadedAt?: Date;
}

export interface IProductDocument {
  _id?: Types.ObjectId;
  title: string;
  docType: "datasheet" | "user_manual" | "cad_drawing" | "compliance" | "other";
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  publicId?: string;
  uploadedAt?: Date;
  notes?: string;
}

export interface IEmbeddedVariant {
  _id?: Types.ObjectId;
  name: string;
  sku: string;
  barcode?: string;
  attributes?: Array<{ key: string; value: string }>;
  price?: number;
  costPrice?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  status?: "active" | "discontinued" | "out_of_stock";
  image?: string;
}

export interface IProduct extends Document {
  companyId: Types.ObjectId;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId?: Types.ObjectId;
  categoryName?: string;
  type: "finished_good" | "raw_material" | "semi_finished" | "component" | "packaging" | "service" | "other";
  status: "active" | "draft" | "discontinued" | "archived";
  price: number;
  costPrice: number;
  taxRate: number;
  stockQuantity: number;
  minStockLevel: number;
  reorderQuantity: number;
  uom: IUom;
  attributes?: ICustomAttribute[];
  variants?: IEmbeddedVariant[];
  imageUrl?: string;
  images?: IProductImage[];
  documents?: IProductDocument[];
  tags?: string[];
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UomSchema = new Schema<IUom>(
  {
    unit: { type: String, required: true, trim: true },
    baseUnit: { type: String, trim: true },
    conversionFactor: { type: Number, default: 1 },
    allowedUnits: [{ type: String, trim: true }],
  },
  { _id: false }
);

const CustomAttributeSchema = new Schema<ICustomAttribute>(
  {
    key: { type: String, required: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
    unit: { type: String, trim: true },
  },
  { _id: false }
);

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const ProductDocumentSchema = new Schema<IProductDocument>(
  {
    title: { type: String, required: true, trim: true },
    docType: {
      type: String,
      enum: ["datasheet", "user_manual", "cad_drawing", "compliance", "other"],
      default: "datasheet",
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    publicId: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const EmbeddedVariantSchema = new Schema<IEmbeddedVariant>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    barcode: { type: String, trim: true },
    attributes: [
      {
        key: { type: String, trim: true },
        value: { type: String, trim: true },
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
    },
    image: { type: String, trim: true },
  },
  { timestamps: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    barcode: { type: String, trim: true },
    description: { type: String, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    categoryName: { type: String, trim: true },
    type: {
      type: String,
      enum: ["finished_good", "raw_material", "semi_finished", "component", "packaging", "service", "other"],
      default: "finished_good",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "draft", "discontinued", "archived"],
      default: "active",
      index: true,
    },
    price: { type: Number, default: 0, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    stockQuantity: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 0, min: 0 },
    reorderQuantity: { type: Number, default: 0, min: 0 },
    uom: {
      type: UomSchema,
      required: true,
      default: () => ({ unit: "pcs", conversionFactor: 1 }),
    },
    attributes: [CustomAttributeSchema],
    variants: [EmbeddedVariantSchema],
    imageUrl: { type: String, trim: true },
    images: [ProductImageSchema],
    documents: [ProductDocumentSchema],
    tags: [{ type: String, trim: true }],
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ProductSchema.index({ companyId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ companyId: 1, name: 1 });

export const Product = model<IProduct>("Product", ProductSchema);
export default Product;
