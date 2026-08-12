import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import winston from 'winston';
import dotenv from 'dotenv';
import dns from 'dns';
import nodemailer from 'nodemailer';
import { connectDB } from './config/db';
import authRouter from "./routes/auth.routes";
import companyRouter from "./routes/company.routes";
import userRouter from "./routes/user.routes";
import roleRouter from "./routes/role.routes";
import permissionRouter from "./routes/permission.routes";
import sessionRouter from "./routes/session.routes";
import auditRouter from "./routes/audit.routes";
import fileRouter from "./routes/file.routes";
import errorHandler from "./middleware/errorHandler";
import { roleService } from "./services/role.service";

// Set IPv4 first for DNS lookup globally
dns.setDefaultResultOrder('ipv4first');

// Load environment variables
dotenv.config();

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database & Seed System Roles/Permissions
connectDB().then(async () => {
  await roleService.initDefaultRolesAndPermissions();
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/companies", companyRouter);
app.use("/api/users", userRouter);
app.use("/api/roles", roleRouter);
app.use("/api/permissions", permissionRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/audit", auditRouter);
app.use("/api/files", fileRouter);

// Baseline health check API
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'up',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongooseConnectionState()
  });
});

// Live Cloud Test Email API (Publicly callable via browser or curl)
app.get(['/api/health/test-email', '/api/auth/test-email'], async (req: Request, res: Response) => {
  const targetEmail = (req.query.email as string) || 'hitarththombre@gmail.com';
  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // 1. Try Resend HTTPS API (Port 443) if configured
  if (resendApiKey) {
    try {
      const resendFrom = process.env.RESEND_FROM || "DIWS Notifications <onboarding@resend.dev>";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [targetEmail],
          subject: 'DIWS Live Cloud Email Test (via Resend HTTPS)',
          text: `Hello! This is a test email sent from DIWS live server via Resend HTTPS API.`,
          html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #4f46e5; border-radius: 8px;">
            <h2 style="color: #4f46e5;">DIWS Cloud Email Test via Resend HTTPS ✅</h2>
            <p>This email confirms that your Render/cloud server sent an email successfully over HTTPS Port 443!</p>
            <p><b>Target Email:</b> ${targetEmail}</p>
            <p><b>Provider:</b> Resend HTTPS API</p>
            <p><b>Timestamp:</b> ${new Date().toISOString()}</p>
          </div>`,
        }),
      });

      if (response.ok) {
        const resData: any = await response.json();
        return res.status(200).json({
          success: true,
          message: `Test email sent successfully via Resend HTTPS API to ${targetEmail}`,
          provider: "Resend (HTTPS Port 443)",
          emailId: resData.id,
        });
      }
    } catch (resendErr: any) {
      console.error('[Test Email API - Resend Error]', resendErr);
    }
  }

  // 2. Direct SMTP Test
  if (!smtpUser || !smtpPass) {
    return res.status(400).json({
      success: false,
      message: 'SMTP credentials missing in server environment variables',
      smtpUser: smtpUser || 'MISSING',
      smtpPass: smtpPass ? 'CONFIGURED' : 'MISSING',
    });
  }

  try {
    const resolvedIps = await dns.promises.resolve4(smtpHost).catch(() => []);
    const targetHost = resolvedIps && resolvedIps.length > 0 ? resolvedIps[0] : smtpHost;

    const transporter = nodemailer.createTransport({
      host: targetHost,
      port: smtpPort,
      secure: smtpPort === 465,
      family: 4,
      connectionTimeout: 4000, // 4s timeout for fast response
      greetingTimeout: 4000,
      socketTimeout: 5000,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        servername: smtpHost,
        rejectUnauthorized: false,
      },
    } as nodemailer.TransportOptions);

    const info = await transporter.sendMail({
      from: `"DIWS Test" <${smtpUser}>`,
      to: targetEmail,
      subject: 'DIWS Live Cloud SMTP Test Email',
      text: `Hello! This is a test email sent from the live DIWS backend server on ${process.env.NODE_ENV || 'production'}.`,
      html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #4f46e5; border-radius: 8px;">
        <h2 style="color: #4f46e5;">DIWS Live Cloud Email Test ✅</h2>
        <p>This email confirms that your cloud server is successfully connected to Gmail SMTP and able to send emails!</p>
        <p><b>Target Email:</b> ${targetEmail}</p>
        <p><b>SMTP Host:</b> ${smtpHost}:${smtpPort}</p>
        <p><b>Timestamp:</b> ${new Date().toISOString()}</p>
      </div>`,
    });

    return res.status(200).json({
      success: true,
      message: `Test email sent successfully to ${targetEmail}`,
      details: {
        to: targetEmail,
        messageId: info.messageId,
        smtpHost,
        smtpPort,
        smtpUser,
        resolvedIps,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Test Email API Error]', error);

    const isCloudFirewallBlock = error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH' || error.code === 'ESOCKET';

    return res.status(isCloudFirewallBlock ? 200 : 500).json({
      success: !isCloudFirewallBlock,
      status: isCloudFirewallBlock ? 'smtp_blocked_by_host' : 'error',
      message: isCloudFirewallBlock
        ? `Render Free Tier blocks outbound SMTP TCP ports (25/587/465). Direct TCP connection to ${smtpHost}:${smtpPort} timed out.`
        : `Failed to send test email: ${error.message}`,
      cloudExplanation: isCloudFirewallBlock
        ? 'Render Free Web Services block outbound SMTP TCP ports to prevent spam. To send live emails from Render Free Tier, get a free API Key from resend.com (free 3,000 emails/month over HTTPS Port 443) and add RESEND_API_KEY to your Render environment variables.'
        : undefined,
      error: error.message,
      code: error.code,
      details: {
        to: targetEmail,
        smtpHost,
        smtpPort,
        smtpUser,
      },
    });
  }
});

// Helper function to check mongoose connection state
function mongooseConnectionState(): string {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const stateCode = require('mongoose').connection.readyState;
  return states[stateCode] || 'unknown';
}

// Global Error Handler (must be defined last)
app.use(errorHandler as any);

// Start Server
app.listen(PORT, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;
