import { Schema, model, Document, Types } from "mongoose";

export type ItemCategoryType = "raw_material" | "finished_goods" | "packaging" | "components" | "other";
export type InventoryStatusType = "in_stock" | "low_stock" | "out_of_stock" | "overstocked";

export interface IInventory extends Document {
  companyId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  factoryId?: Types.ObjectId;
  productId?: Types.ObjectId;
  sku: string;
  itemName: string;
  itemCategory: ItemCategoryType;
  quantity: number;
  reservedQuantity: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  minThreshold: number;
  maxThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  locationInWarehouse?: string;
  status: InventoryStatusType;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    factoryId: { type: Schema.Types.ObjectId, ref: "Factory", index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    itemName: { type: String, required: true, trim: true },
    itemCategory: {
      type: String,
      enum: ["raw_material", "finished_goods", "packaging", "components", "other"],
      default: "finished_goods",
      index: true,
    },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "units", trim: true },
    unitCost: { type: Number, default: 0, min: 0 },
    totalValue: { type: Number, default: 0, min: 0 },
    minThreshold: { type: Number, default: 10, min: 0 },
    maxThreshold: { type: Number, default: 1000, min: 0 },
    reorderPoint: { type: Number, default: 20, min: 0 },
    reorderQuantity: { type: Number, default: 50, min: 0 },
    locationInWarehouse: { type: String, trim: true },
    status: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock", "overstocked"],
      default: "in_stock",
      index: true,
    },
  },
  { timestamps: true }
);

InventorySchema.index({ companyId: 1, warehouseId: 1, sku: 1 }, { unique: true });
InventorySchema.index({ companyId: 1, itemCategory: 1 });
InventorySchema.index({ companyId: 1, status: 1 });

export const Inventory = model<IInventory>("Inventory", InventorySchema);
export default Inventory;
