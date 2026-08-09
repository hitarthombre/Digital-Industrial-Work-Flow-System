import { Schema, model, Document } from "mongoose";

export interface IPasswordReset extends Document {
  userId: Schema.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const PasswordReset = model<IPasswordReset>("PasswordReset", PasswordResetSchema);
export default PasswordReset;
