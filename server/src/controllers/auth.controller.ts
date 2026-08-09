import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Company } from "../models/Company";
import { User } from "../models/User";
import { AuthenticatedRequest } from "../middleware/auth";

// JWT expiration time & secret configuration
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtsecretkeychangeinproduction";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Zod schemas for validation
export const RegisterSchema = z.object({
  body: z.object({
    // Company Info
    companyName: z.string().min(2, "Company name must be at least 2 characters"),
    companyCode: z.string().min(2, "Company code must be at least 2 characters").toUpperCase(),
    industry: z.string().optional(),
    
    // User Info (Administrator)
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

// Company Registration + User Sign Up Controller
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyName, companyCode, industry, firstName, lastName, email, password } = req.body;

    // Check if company code already exists
    const existingCompany = await Company.findOne({ code: companyCode });
    if (existingCompany) {
      res.status(400).json({
        success: false,
        message: `Company with code '${companyCode}' already exists`,
      });
      return;
    }

    // Check if user email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "Email address is already registered",
      });
      return;
    }

    // 1. Create the Company
    const company = await Company.create({
      name: companyName,
      code: companyCode,
      industry,
    });

    // 2. Hash the user password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Create the User (Assigned as administrator by default)
    const user = await User.create({
      companyId: company._id,
      firstName,
      lastName,
      email,
      passwordHash,
      role: "admin",
      status: "active",
    });

    // 4. Generate JWT
    const token = jwt.sign(
      { userId: user._id, companyId: company._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.status(201).json({
      success: true,
      message: "Company and administrator registered successfully",
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        company: {
          id: company._id,
          name: company.name,
          code: company.code,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// User Login Controller
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and populate company details
    const user = await User.findOne({ email }).populate("companyId");
    if (!user || user.status !== "active") {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Verify Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Update user's login date
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, companyId: user.companyId.toString() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Profile Controller
export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(404).json({
        success: false,
        message: "User profile not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
        companyId: req.companyId,
      },
    });
  } catch (error) {
    next(error);
  }
};
