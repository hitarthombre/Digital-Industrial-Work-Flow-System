import { Router } from "express";
import {
  companyController,
  CreateCompanySchema,
  UpdateCompanySchema,
  CompanySettingsSchema,
  CompanyBrandingSchema,
  CompanyStatusSchema,
} from "../controllers/company.controller";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";

const router = Router();

// Apply global authentication to all company routes
router.use(authenticate as any);

// Retrieve all companies (tenant-restricted for standard users, full listing for platform admin)
router.get(
  "/",
  requirePermission("company:read") as any,
  (req: any, res: any, next: any) => companyController.getCompanies(req, res, next)
);

// Create new company tenant
router.post(
  "/",
  requirePermission("company:create") as any,
  validateRequest(CreateCompanySchema),
  (req: any, res: any, next: any) => companyController.createCompany(req, res, next)
);

// Retrieve single company profile by ID (enforces tenant isolation)
router.get(
  "/:id",
  enforceTenantIsolation as any,
  requirePermission("company:read") as any,
  (req: any, res: any, next: any) => companyController.getCompanyById(req, res, next)
);

// Update company profile details
router.put(
  "/:id",
  enforceTenantIsolation as any,
  requirePermission("company:update") as any,
  validateRequest(UpdateCompanySchema),
  (req: any, res: any, next: any) => companyController.updateCompany(req, res, next)
);

// Delete / deactivate company
router.delete(
  "/:id",
  enforceTenantIsolation as any,
  requirePermission("company:delete") as any,
  (req: any, res: any, next: any) => companyController.deleteCompany(req, res, next)
);

// Get company settings
router.get(
  "/:id/settings",
  enforceTenantIsolation as any,
  requirePermission("company:settings:read") as any,
  (req: any, res: any, next: any) => companyController.getCompanySettings(req, res, next)
);

// Update company settings
router.put(
  "/:id/settings",
  enforceTenantIsolation as any,
  requirePermission("company:settings:update") as any,
  validateRequest(CompanySettingsSchema),
  (req: any, res: any, next: any) => companyController.updateCompanySettings(req, res, next)
);

// Update company branding
router.put(
  "/:id/branding",
  enforceTenantIsolation as any,
  requirePermission("company:branding:update") as any,
  validateRequest(CompanyBrandingSchema),
  (req: any, res: any, next: any) => companyController.updateCompanyBranding(req, res, next)
);

// Update company operational status
router.patch(
  "/:id/status",
  enforceTenantIsolation as any,
  requirePermission("company:status:update") as any,
  validateRequest(CompanyStatusSchema),
  (req: any, res: any, next: any) => companyController.updateCompanyStatus(req, res, next)
);

export default router;
