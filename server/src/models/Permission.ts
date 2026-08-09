import { Schema, model, Document } from "mongoose";

export interface IPermission extends Document {
  code: string;
  module: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
  {
    code: { type: String, required: true, unique: true, trim: true, index: true },
    module: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

export const Permission = model<IPermission>("Permission", PermissionSchema);
export default Permission;
