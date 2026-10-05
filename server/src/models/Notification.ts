import { Schema, model, Document } from "mongoose";

export type NotificationType =
  | "low_stock"
  | "new_order"
  | "approval_request"
  | "dispatch_update"
  | "production_update"
  | "purchase_update"
  | "sales_update"
  | "order_status"
  | "task_reminder"
  | "system_alert";

export interface INotification extends Document {
  companyId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  status: "unread" | "read";
  link?: string;
  referenceKey?: string;
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
      enum: [
        "low_stock",
        "new_order",
        "approval_request",
        "dispatch_update",
        "production_update",
        "purchase_update",
        "sales_update",
        "order_status",
        "task_reminder",
        "system_alert",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
    // In-app route the notification points to, e.g. /app/sales/orders/:id
    link: { type: String, trim: true },
    // Dedupe key for scheduled reminders, e.g. "invoice-overdue:<id>"
    referenceKey: { type: String, trim: true, index: true },
    readAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const Notification = model<INotification>("Notification", NotificationSchema);
export default Notification;
