import { Schema, model, Document } from "mongoose";

export interface INotification extends Document {
  companyId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  title: string;
  message: string;
  type: "low_stock" | "new_order" | "approval_request" | "dispatch_update" | "production_update" | "purchase_update" | "system_alert";
  status: "unread" | "read";
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["low_stock", "new_order", "approval_request", "dispatch_update", "production_update", "purchase_update", "system_alert"],
      required: true,
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
    readAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const Notification = model<INotification>("Notification", NotificationSchema);
export default Notification;
