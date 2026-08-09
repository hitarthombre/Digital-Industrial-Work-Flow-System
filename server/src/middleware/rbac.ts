import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Company Owner & Company Admin have full administrative privileges
    if (req.user.role === "Company Owner" || req.user.role === "Company Admin") {
      next();
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of the following roles: ${roles.join(", ")}`,
      });
      return;
    }

    next();
  };
};

// Granular Permission-based authorization middleware
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Company Owner & Company Admin bypass granular permission checks
    if (req.user.role === "Company Owner" || req.user.role === "Company Admin") {
      next();
      return;
    }

    const userPermissions = req.permissions || [];
    const hasAllPermissions = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Insufficient permissions. Required: ${requiredPermissions.join(", ")}`,
      });
      return;
    }

    next();
  };
};
