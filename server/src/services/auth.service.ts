import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User, IUser } from "../models/User";
import { Company } from "../models/Company";
import { Role } from "../models/Role";
import { PasswordReset } from "../models/PasswordReset";
import { EmailVerification } from "../models/EmailVerification";
import { sessionService } from "./session.service";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "diws_access_token_secret_key_2026_industrial_workflow";
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

export interface RegisterInput {
  companyName: string;
  companyCode: string;
  industry?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export class AuthService {
  // Generate Access Token (short lived)
  generateAccessToken(payload: { userId: string; companyId: string; roleId?: string; role: string }): string {
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_IN as any,
    });
  }

  // 1. User & Company Registration
  async register(data: RegisterInput, ipAddress?: string, userAgent?: string) {
    const existingCompany = await Company.findOne({ code: data.companyCode });
    if (existingCompany) {
      throw new Error(`Company code '${data.companyCode}' is already registered`);
    }

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new Error("User email is already registered");
    }

    // Create Company
    const company = await Company.create({
      name: data.companyName,
      code: data.companyCode,
      industry: data.industry,
      status: "active",
    });

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Find Company Owner System Role
    const ownerRole = await Role.findOne({ name: "Company Owner" });

    // Create Administrator User
    const user = await User.create({
      companyId: company._id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: ownerRole ? ownerRole.name : "Company Owner",
      roleId: ownerRole ? ownerRole._id : undefined,
      status: "active",
      isEmailVerified: false,
    });

    // Create Session and Refresh Token
    const { sessionId, refreshToken } = await sessionService.createSession(
      user._id.toString(),
      company._id.toString(),
      ipAddress,
      userAgent
    );

    // Generate Access Token
    const accessToken = this.generateAccessToken({
      userId: user._id.toString(),
      companyId: company._id.toString(),
      roleId: user.roleId ? user.roleId.toString() : undefined,
      role: user.role,
    });

    // Audit Log
    await auditService.log({
      companyId: company._id.toString(),
      userId: user._id.toString(),
      action: "auth:register",
      module: "auth",
      referenceId: user._id.toString(),
      ipAddress,
      userAgent,
    });

    // Generate initial verification token automatically
    await this.sendEmailVerification(user._id.toString(), company._id.toString());

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      company: {
        id: company._id,
        name: company.name,
        code: company.code,
      },
      accessToken,
      refreshToken,
      sessionId,
    };
  }

  // 2. User Login
  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await User.findOne({ email }).populate("roleId");
    
    if (!user) {
      // Audit Failed Login
      await auditService.log({
        action: "auth:failed_login",
        module: "auth",
        before: { email },
        ipAddress,
        userAgent,
      });
      throw new Error("Invalid email or password");
    }

    if (user.status !== "active") {
      await auditService.log({
        companyId: user.companyId.toString(),
        userId: user._id.toString(),
        action: "auth:failed_login_suspended",
        module: "auth",
        ipAddress,
        userAgent,
      });
      throw new Error("Your account is currently inactive or suspended");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await auditService.log({
        companyId: user.companyId.toString(),
        userId: user._id.toString(),
        action: "auth:failed_login",
        module: "auth",
        ipAddress,
        userAgent,
      });
      throw new Error("Invalid email or password");
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Create Refresh Token Session
    const { sessionId, refreshToken } = await sessionService.createSession(
      user._id.toString(),
      user.companyId.toString(),
      ipAddress,
      userAgent
    );

    // Generate Access Token
    const accessToken = this.generateAccessToken({
      userId: user._id.toString(),
      companyId: user.companyId.toString(),
      roleId: user.roleId ? (user.roleId as any)._id?.toString() || user.roleId.toString() : undefined,
      role: user.role,
    });

    // Audit Successful Login
    await auditService.log({
      companyId: user.companyId.toString(),
      userId: user._id.toString(),
      action: "auth:login",
      module: "auth",
      referenceId: sessionId,
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user._id,
        companyId: user.companyId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken,
      sessionId,
    };
  }

  // 3. Refresh Access Token
  async refreshAccessToken(refreshToken: string) {
    const session = await sessionService.validateRefreshToken(refreshToken);
    const user = await User.findById(session.userId);

    if (!user || user.status !== "active") {
      throw new Error("User account unavailable or suspended");
    }

    const accessToken = this.generateAccessToken({
      userId: user._id.toString(),
      companyId: user.companyId.toString(),
      roleId: user.roleId ? user.roleId.toString() : undefined,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    };
  }

  // 4. Logout
  async logout(sessionId: string, userId: string, companyId: string, ipAddress?: string, userAgent?: string) {
    await sessionService.revokeSession(sessionId, userId);
    
    await auditService.log({
      companyId,
      userId,
      action: "auth:logout",
      module: "auth",
      referenceId: sessionId,
      ipAddress,
      userAgent,
    });

    return true;
  }

  // 5. Forgot Password Request
  async forgotPassword(email: string, ipAddress?: string, userAgent?: string) {
    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal email non-existence to avoid account enumeration
      return { success: true, message: "If that email exists in our system, password reset instructions have been sent." };
    }

    // Generate secure random reset token
    const rawResetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawResetToken).digest("hex");

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    await PasswordReset.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    // Log Audit Event
    await auditService.log({
      companyId: user.companyId.toString(),
      userId: user._id.toString(),
      action: "auth:forgot_password",
      module: "auth",
      ipAddress,
      userAgent,
    });

    // Send Email Notification in Background Queue
    const resetUrl = `http://localhost:5173/reset-password?token=${rawResetToken}`;
    await notificationService.createNotification(
      user.companyId.toString(),
      user._id.toString(),
      "Password Reset Requested",
      `Use the following link to reset your password (valid for 1 hour): ${resetUrl}\n\nReset Token: ${rawResetToken}`,
      "system_alert",
      user.email
    );

    return {
      success: true,
      message: "If that email exists in our system, password reset instructions have been sent.",
      // Provide raw token in dev response for seamless testing
      resetToken: rawResetToken,
    };
  }

  // 6. Reset Password Execution
  async resetPassword(rawToken: string, newPassword: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const resetRecord = await PasswordReset.findOne({ tokenHash });

    if (!resetRecord) {
      throw new Error("Invalid or expired password reset token");
    }

    if (resetRecord.usedAt) {
      throw new Error("Password reset token has already been used");
    }

    if (new Date() > resetRecord.expiresAt) {
      throw new Error("Password reset token has expired");
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) {
      throw new Error("User account not found");
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Mark token as used
    resetRecord.usedAt = new Date();
    await resetRecord.save();

    // Revoke all existing sessions for security
    await sessionService.revokeAllUserSessions(user._id.toString());

    // Audit Log
    await auditService.log({
      companyId: user.companyId.toString(),
      userId: user._id.toString(),
      action: "auth:reset_password",
      module: "auth",
      ipAddress,
      userAgent,
    });

    return true;
  }

  // 7. Send Email Verification Token
  async sendEmailVerification(userId: string, companyId: string, ipAddress?: string, userAgent?: string) {
    const user = await User.findOne({ _id: userId, companyId });
    if (!user) {
      throw new Error("User account not found");
    }

    if (user.isEmailVerified) {
      return { success: true, message: "User email is already verified" };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration

    await EmailVerification.create({
      userId: user._id,
      email: user.email,
      tokenHash,
      expiresAt,
    });

    // Audit Log
    await auditService.log({
      companyId: user.companyId.toString(),
      userId: user._id.toString(),
      action: "auth:send_verification",
      module: "auth",
      ipAddress,
      userAgent,
    });

    // Trigger Email Dispatch
    const verifyUrl = `http://localhost:5173/verify-email?token=${rawToken}`;
    await notificationService.createNotification(
      companyId,
      userId,
      "Verify Your Email Address",
      `Please verify your email address by clicking: ${verifyUrl}\n\nVerification Token: ${rawToken}`,
      "system_alert",
      user.email
    );

    return {
      success: true,
      message: "Email verification link has been sent.",
      verificationToken: rawToken,
    };
  }

  // 8. Verify Email Token
  async verifyEmail(rawToken: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const verificationRecord = await EmailVerification.findOne({ tokenHash });

    if (!verificationRecord) {
      throw new Error("Invalid or expired email verification token");
    }

    if (verificationRecord.verifiedAt) {
      throw new Error("Email has already been verified using this token");
    }

    if (new Date() > verificationRecord.expiresAt) {
      throw new Error("Email verification token has expired");
    }

    const user = await User.findById(verificationRecord.userId);
    if (!user) {
      throw new Error("User account not found");
    }

    user.isEmailVerified = true;
    await user.save();

    verificationRecord.verifiedAt = new Date();
    await verificationRecord.save();

    // Audit Log
    await auditService.log({
      companyId: user.companyId.toString(),
      userId: user._id.toString(),
      action: "auth:email_verified",
      module: "auth",
      ipAddress,
      userAgent,
    });

    return true;
  }

  // 9. Current User Profile
  async getCurrentUserProfile(userId: string, companyId: string) {
    const user = await User.findOne({ _id: userId, companyId })
      .select("-passwordHash")
      .populate("roleId", "name permissions")
      .populate("companyId", "name code industry logo status");

    if (!user) {
      throw new Error("User profile not found");
    }

    let permissions: string[] = [];
    if (user.roleId && (user.roleId as any).permissions) {
      permissions = (user.roleId as any).permissions;
    } else {
      const roleObj = await Role.findOne({ name: user.role });
      if (roleObj) {
        permissions = roleObj.permissions;
      }
    }

    return {
      user,
      permissions,
    };
  }
}

export const authService = new AuthService();
export default authService;
