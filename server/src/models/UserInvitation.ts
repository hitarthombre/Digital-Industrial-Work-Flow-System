import { Schema, model, Document } from "mongoose";

export interface IUserInvitation extends Document {
  companyId: Schema.Types.ObjectId;
  email: string;
  role: string;
  roleId?: Schema.Types.ObjectId;
  departmentId?: Schema.Types.ObjectId;
  invitedBy: Schema.Types.ObjectId;
  token: string;
  status: "pending" | "accepted" | "expired";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserInvitationSchema = new Schema<IUserInvitation>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, required: true, default: "Employee" },
    roleId: { type: Schema.Types.ObjectId, ref: "Role" },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

UserInvitationSchema.index({ companyId: 1, email: 1 });
UserInvitationSchema.index({ token: 1, status: 1 });

export const UserInvitation = model<IUserInvitation>("UserInvitation", UserInvitationSchema);
export default UserInvitation;
