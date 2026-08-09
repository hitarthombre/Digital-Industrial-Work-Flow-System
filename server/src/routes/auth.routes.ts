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
router.post("/register", validateRequest(RegisterSchema), (req, res, next) => authController.register(req, res, next));
router.post("/login", validateRequest(LoginSchema), (req, res, next) => authController.login(req, res, next));
router.post("/refresh", validateRequest(RefreshSchema), (req, res, next) => authController.refresh(req, res, next));
router.post("/forgot-password", validateRequest(ForgotPasswordSchema), (req, res, next) => authController.forgotPassword(req, res, next));
router.post("/reset-password", validateRequest(ResetPasswordSchema), (req, res, next) => authController.resetPassword(req, res, next));
router.get("/verify-email", validateRequest(VerifyEmailSchema), (req, res, next) => authController.verifyEmail(req, res, next));

// Protected routes
router.post("/logout", authenticate as any, (req: any, res, next) => authController.logout(req, res, next));
router.get("/me", authenticate as any, (req: any, res, next) => authController.getMe(req, res, next));
router.get("/profile", authenticate as any, (req: any, res, next) => authController.getMe(req, res, next));
router.post("/send-verification", authenticate as any, (req: any, res, next) => authController.sendVerification(req, res, next));

export default router;
