import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  companyId: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  password?: string;
  role: string;
  roleId?: Schema.Types.ObjectId;
  departmentId?: Schema.Types.ObjectId;
  status: "active" | "inactive";
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    password: { type: String, select: false },
    passwordHash: {
      type: String,
      required: function (this: any) {
        return !this.password && !this.passwordHash;
      },
    },
    role: {
      type: String,
      default: "Employee",
    },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ companyId: 1, email: 1 });
UserSchema.index({ companyId: 1, status: 1 });

// Pre-validate hook to populate passwordHash if password is provided
UserSchema.pre("validate", async function (next) {
  const user = this as any;
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(user.password, salt);
    user.password = undefined;
  }
  next();
});

// Pre-save hook to hash password with bcrypt on save
UserSchema.pre("save", async function (next) {
  const user = this as any;
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(user.password, salt);
    user.password = undefined;
  } else if (user.isModified("passwordHash") && user.passwordHash) {
    if (!user.passwordHash.startsWith("$2a$") && !user.passwordHash.startsWith("$2b$")) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
    }
  }
  next();
});

// Method to verify passwords
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model<IUser>("User", UserSchema);
export default User;
