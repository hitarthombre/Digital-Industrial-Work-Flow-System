import { Schema, model, Document } from "mongoose";

export interface IAuditLog extends Document {
  companyId?: Schema.Types.ObjectId;
  userId?: Schema.Types.ObjectId;
  action: string;
  module: string;
  referenceId?: string;
  before?: any;
  after?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    action: { type: String, required: true, trim: true, index: true },
    module: { type: String, required: true, trim: true, index: true },
    referenceId: { type: String, trim: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ companyId: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>("AuditLog", AuditLogSchema);
export default AuditLog;
