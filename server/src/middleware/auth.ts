import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  companyId?: string;
}

interface JwtPayload {
  userId: string;
  companyId: string;
}

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
        message: "Authentication token missing or invalid",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET || "supersecretjwtsecretkeychangeinproduction";

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    const user = await User.findById(decoded.userId);
    if (!user || user.status !== "active") {
      res.status(401).json({
        success: false,
        message: "User account suspended or not found",
      });
      return;
    }

    // Attach user and companyId to request object
    req.user = user;
    req.companyId = user.companyId.toString();

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        message: "Authentication token expired",
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// Middleware to authorize specific user roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions",
      });
      return;
    }
    next();
  };
};
