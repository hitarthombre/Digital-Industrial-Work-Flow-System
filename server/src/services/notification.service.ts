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
      
      const resendApiKey = process.env.RESEND_API_KEY;
      const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
      const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      const htmlBody = `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6366f1; margin-top: 0;">DIWS Notification</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #334155;">${data.body.replace(/\n/g, "<br/>")}</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">This is an automated system email from the Digital Industrial Work-Flow System.</p>
      </div>`;

      // 1. If Resend API Key is configured, use Resend HTTPS API (Port 443 - never blocked on cloud)
      if (resendApiKey) {
        try {
          console.log(`[Notification Worker] Sending email via Resend HTTPS API (Port 443)...`);
          const resendFrom = process.env.RESEND_FROM || "DIWS Notifications <onboarding@resend.dev>";
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: resendFrom,
              to: [data.email],
              subject: data.subject,
              text: data.body,
              html: htmlBody,
            }),
          });

          if (response.ok) {
            const resData: any = await response.json();
            console.log(`[Notification Worker] Email sent successfully via Resend HTTPS API! ID: ${resData.id}`);
            return;
          } else {
            const errText = await response.text();
            console.error(`[Notification Worker] Resend API error: ${errText}`);
          }
        } catch (resendErr: any) {
          console.error(`[Notification Worker] Resend API Exception: ${resendErr.message}`);
        }
      }

      // 2. Fallback to Nodemailer SMTP
      if (!smtpUser || !smtpPass) {
        console.warn("[Notification Worker] SMTP credentials not configured. Simulating email success.");
        await new Promise((resolve) => setTimeout(resolve, 500));
        return;
      }

      // Explicitly resolve hostname to IPv4 address to bypass unroutable IPv6 on cloud containers
      let targetHost = smtpHost;
      try {
        const ipv4Addresses = await dns.promises.resolve4(smtpHost);
        if (ipv4Addresses && ipv4Addresses.length > 0) {
          targetHost = ipv4Addresses[0];
        }
      } catch (dnsErr: any) {
        console.warn(`[Notification Worker] DNS resolve4 warning: ${dnsErr.message}`);
      }

      try {
        const transporter = nodemailer.createTransport({
          host: targetHost,
          port: smtpPort,
          secure: smtpPort === 465,
          family: 4,
          connectionTimeout: 5000, // 5s timeout
          greetingTimeout: 5000,
          socketTimeout: 8000,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            servername: smtpHost,
            rejectUnauthorized: false,
          },
        } as nodemailer.TransportOptions);

        await transporter.sendMail({
          from: `"DIWS Notifications" <${smtpUser}>`,
          to: data.email,
          subject: data.subject,
          text: data.body,
          html: htmlBody,
        });

        console.log(`[Notification Worker] Email sent successfully via SMTP to ${data.email}.`);
      } catch (err: any) {
        if (err.code === "ETIMEDOUT" || err.code === "ENETUNREACH" || err.code === "ESOCKET") {
          console.warn(`[Notification Worker Warning] Direct SMTP connection to ${smtpHost}:${smtpPort} timed out.`);
          console.warn(`[Cloud Notice] Render Free Tier restricts outbound SMTP ports (25/587/465). To send emails on Render Free Tier, add RESEND_API_KEY in environment variables.`);
          return; // Prevent infinite queue retries on blocked cloud ports
        }
        throw err;
      }
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
