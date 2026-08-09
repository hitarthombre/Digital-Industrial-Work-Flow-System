import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { AuthenticatedRequest } from "../middleware/auth";

// Validation Schemas
export const RegisterSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, "Company name must be at least 2 characters"),
    companyCode: z.string().min(2, "Company code must be at least 2 characters").toUpperCase(),
    industry: z.string().optional(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const RefreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export const ForgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export const ResetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const VerifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(1, "Verification token is required"),
  }),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];
      const result = await authService.register(req.body, ipAddress, userAgent);

      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];
      const result = await authService.login(req.body.email, req.body.password, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.refreshAccessToken(req.body.refreshToken);

      res.status(200).json({
        success: true,
        message: "Access token refreshed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = (req.body && req.body.sessionId) || (req.user as any)?.sessionId;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      if (sessionId && req.user && req.companyId) {
        await authService.logout(sessionId, req.user._id.toString(), req.companyId, ipAddress, userAgent);
      }

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];
      const result = await authService.forgotPassword(req.body.email, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.resetToken ? { resetToken: result.resetToken } : undefined,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];
      await authService.resetPassword(req.body.token, req.body.newPassword, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: "Password reset successful. Please login with your new password.",
      });
    } catch (error) {
      next(error);
    }
  }

  async sendVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];
      const result = await authService.sendEmailVerification(req.user!._id.toString(), req.companyId!, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.verificationToken ? { verificationToken: result.verificationToken } : undefined,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];
      await authService.verifyEmail(token, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: "Email verified successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.getCurrentUserProfile(req.user!._id.toString(), req.companyId!);

      res.status(200).json({
        success: true,
        message: "Current user profile retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;
