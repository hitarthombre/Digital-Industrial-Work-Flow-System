import { Schema, model, Document, Types } from "mongoose";

export interface ITransferItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  unit?: string;
}

export interface IStockTransfer extends Document {
  companyId: Types.ObjectId;
  transferNumber: string;
  sourceWarehouseId: Types.ObjectId;
  destinationWarehouseId: Types.ObjectId;
  items: ITransferItem[];
  totalQuantity: number;
  transferDate: Date;
  status: "pending" | "in_transit" | "completed" | "cancelled";
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransferItemSchema = new Schema<ITransferItem>(
  {
    itemCode: { type: String, required: true, trim: true },
    itemName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, trim: true, default: "units" },
  },
  { _id: false }
);

const StockTransferSchema = new Schema<IStockTransfer>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    transferNumber: { type: String, required: true, uppercase: true, trim: true },
    sourceWarehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    destinationWarehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    items: { type: [TransferItemSchema], required: true },
    totalQuantity: { type: Number, required: true, min: 0 },
    transferDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "in_transit", "completed", "cancelled"],
      default: "completed",
      index: true,
    },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

StockTransferSchema.index({ companyId: 1, transferNumber: 1 }, { unique: true });
StockTransferSchema.index({ companyId: 1, sourceWarehouseId: 1 });
StockTransferSchema.index({ companyId: 1, destinationWarehouseId: 1 });

export const StockTransfer = model<IStockTransfer>("StockTransfer", StockTransferSchema);
export default StockTransfer;
