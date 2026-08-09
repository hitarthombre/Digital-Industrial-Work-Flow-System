import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";
import { Role } from "../models/Role";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  companyId?: string;
  roleId?: string;
  permissions?: string[];
}

interface AccessTokenPayload {
  userId: string;
  companyId: string;
  roleId?: string;
  role: string;
}

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "diws_access_token_secret_key_2026_industrial_workflow";

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Access token is missing or malformed",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token is missing",
      });
      return;
    }

    let decoded: AccessTokenPayload;
    try {
      decoded = jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        res.status(401).json({
          success: false,
          message: "Access token has expired",
        });
        return;
      }
      res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.status !== "active") {
      res.status(401).json({
        success: false,
        message: "User account is suspended, inactive, or not found",
      });
      return;
    }

    // Load role permissions
    let permissions: string[] = [];
    if (user.roleId) {
      const roleObj = await Role.findById(user.roleId);
      if (roleObj) {
        permissions = roleObj.permissions;
      }
    } else {
      const roleObj = await Role.findOne({ name: user.role });
      if (roleObj) {
        permissions = roleObj.permissions;
      }
    }

    // Attach details onto request object
    req.user = user;
    req.companyId = user.companyId.toString();
    req.roleId = user.roleId ? user.roleId.toString() : undefined;
    req.permissions = permissions;

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Authentication processing failed",
      errors: [error.message],
    });
  }
};
