import { Schema, model, Document } from "mongoose";

export interface IEmailVerification extends Document {
  userId: Schema.Types.ObjectId;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailVerificationSchema = new Schema<IEmailVerification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    verifiedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const EmailVerification = model<IEmailVerification>("EmailVerification", EmailVerificationSchema);
export default EmailVerification;
