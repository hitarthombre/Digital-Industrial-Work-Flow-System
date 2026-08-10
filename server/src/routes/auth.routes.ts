import { Router } from "express";
import {
  authController,
  RegisterSchema,
  LoginSchema,
  RefreshSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
} from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validation";
import { authenticate } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/register", validateRequest(RegisterSchema), (req: any, res: any, next: any) => authController.register(req, res, next));
router.post("/login", validateRequest(LoginSchema), (req: any, res: any, next: any) => authController.login(req, res, next));
router.post("/refresh", validateRequest(RefreshSchema), (req: any, res: any, next: any) => authController.refresh(req, res, next));
router.post("/forgot-password", validateRequest(ForgotPasswordSchema), (req: any, res: any, next: any) => authController.forgotPassword(req, res, next));
router.post("/reset-password", validateRequest(ResetPasswordSchema), (req: any, res: any, next: any) => authController.resetPassword(req, res, next));
router.get("/verify-email", validateRequest(VerifyEmailSchema), (req: any, res: any, next: any) => authController.verifyEmail(req, res, next));

// Protected routes
router.post("/logout", authenticate as any, (req: any, res: any, next: any) => authController.logout(req, res, next));
router.get("/me", authenticate as any, (req: any, res: any, next: any) => authController.getMe(req, res, next));
router.get("/profile", authenticate as any, (req: any, res: any, next: any) => authController.getMe(req, res, next));
router.post("/send-verification", authenticate as any, (req: any, res: any, next: any) => authController.sendVerification(req, res, next));

export default router;
