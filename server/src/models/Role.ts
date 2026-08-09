import { Schema, model, Document } from "mongoose";

export interface IRole extends Document {
  companyId?: Schema.Types.ObjectId;
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    permissions: [{ type: String, trim: true }],
    isSystemRole: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

RoleSchema.index({ companyId: 1, name: 1 });

export const Role = model<IRole>("Role", RoleSchema);
export default Role;
