import { Notification, INotification } from "../models/Notification";
import { queueService } from "./queue.service";
import nodemailer from "nodemailer";
import dns from "dns";

class NotificationService {
  constructor() {
    // Register background job handler for notification dispatching (e.g., sending emails)
    queueService.registerHandler("SEND_EMAIL_NOTIFICATION", async (data: { email: string; subject: string; body: string }) => {
      console.log(`[Notification Worker] Sending email to: ${data.email}`);
      console.log(`[Notification Worker] Subject: ${data.subject}`);
      
      const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
      const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (!smtpUser || !smtpPass) {
        console.warn("[Notification Worker] SMTP credentials are not fully configured in env. Simulating success.");
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log(`[Notification Worker] Email sent successfully (Mock Mode).`);
        return;
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        family: 4, // Force IPv4 to avoid IPv6 ENETUNREACH errors
        lookup: (hostname: string, options: any, callback: any) => {
          dns.lookup(hostname, { family: 4 }, callback);
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      } as nodemailer.TransportOptions);

      await transporter.sendMail({
        from: `"DIWS Notifications" <${smtpUser}>`,
        to: data.email,
        subject: data.subject,
        text: data.body,
        html: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #6366f1; margin-top: 0;">DIWS Notification</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #334155;">${data.body.replace(/\n/g, "<br/>")}</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">This is an automated system email from the Digital Industrial Work-Flow System.</p>
        </div>`,
      });

      console.log(`[Notification Worker] Email sent successfully via SMTP.`);
    });
  }

  // Create an in-app notification and optionally trigger an email dispatch job in the background
  async createNotification(
    companyId: string,
    userId: string,
    title: string,
    message: string,
    type: INotification["type"],
    userEmail?: string
  ): Promise<INotification> {
    const notification = await Notification.create({
      companyId,
      userId,
      title,
      message,
      type,
      status: "unread",
    });

    console.log(`[Notification] Created: ${title} (User: ${userId})`);

    // If an email address is provided, schedule a background job to send the email notification
    if (userEmail) {
      queueService.addJob("SEND_EMAIL_NOTIFICATION", {
        email: userEmail,
        subject: `DIWS Notification: ${title}`,
        body: message,
      });
    }

    return notification;
  }

  // Retrieve unread notifications for a specific user
  async getUnreadNotifications(userId: string): Promise<INotification[]> {
    return Notification.find({ userId, status: "unread" }).sort({ createdAt: -1 });
  }

  // Mark a specific notification as read
  async markAsRead(notificationId: string): Promise<INotification | null> {
    return Notification.findByIdAndUpdate(
      notificationId,
      { status: "read", readAt: new Date() },
      { new: true }
    );
  }

  // Mark all notifications for a user as read
  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { userId, status: "unread" },
      { status: "read", readAt: new Date() }
    );
  }
}

export const notificationService = new NotificationService();
export default notificationService;
