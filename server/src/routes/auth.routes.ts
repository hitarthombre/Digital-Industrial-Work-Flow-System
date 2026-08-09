import { Router } from "express";
import { register, login, getProfile, RegisterSchema, LoginSchema } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validation";
import { authenticate } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/register", validateRequest(RegisterSchema), register);
router.post("/login", validateRequest(LoginSchema), login);

// Private routes
router.get("/profile", authenticate as any, getProfile as any);

export default router;
