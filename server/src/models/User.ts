import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  companyId: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: "admin" | "manager" | "operator";
  roleId?: Schema.Types.ObjectId;
  departmentId?: Schema.Types.ObjectId;
  status: "active" | "inactive";
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "manager", "operator"],
      default: "operator",
    },
    roleId: { type: Schema.Types.ObjectId, ref: "Role" },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Method to verify passwords
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model<IUser>("User", UserSchema);
export default User;
