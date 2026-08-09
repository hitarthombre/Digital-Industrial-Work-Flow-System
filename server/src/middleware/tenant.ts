import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

export const enforceTenantIsolation = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.companyId) {
    res.status(401).json({
      success: false,
      message: "Authentication required for tenant isolation checks",
    });
    return;
  }

  // Extract target companyId from params, query, or body
  const targetCompanyId = req.params.companyId || req.query.companyId || req.body.companyId;

  if (targetCompanyId && targetCompanyId.toString() !== req.companyId.toString()) {
    console.warn(`[Tenant Violation Warning] User ${req.user._id} (Company: ${req.companyId}) attempted to access resource belonging to Company: ${targetCompanyId}`);
    res.status(403).json({
      success: false,
      message: "Forbidden: Cross-tenant data access is strictly prohibited",
    });
    return;
  }

  next();
};
