import { Response, NextFunction } from "express";
import { z } from "zod";
import { companyService } from "../services/company.service";
import { AuthenticatedRequest } from "../middleware/auth";

export const CreateCompanySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Company name must be at least 2 characters"),
    code: z.string().min(2, "Company code must be at least 2 characters").toUpperCase(),
    industry: z.string().optional(),
    logo: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    gstNumber: z.string().optional(),
    website: z.string().optional(),
    currency: z.string().optional(),
    timezone: z.string().optional(),
    status: z.enum(["active", "inactive", "suspended", "pending"]).optional(),
    subscriptionPlan: z.enum(["free", "starter", "growth", "enterprise"]).optional(),
    branding: z
      .object({
        displayName: z.string().optional(),
        primaryColor: z.string().optional(),
        logo: z.string().optional(),
      })
      .optional(),
    settings: z
      .object({
        currency: z.string().optional(),
        timezone: z.string().optional(),
        dateFormat: z.string().optional(),
        language: z.string().optional(),
        fiscalYear: z.string().optional(),
        defaultWarehouse: z.string().optional(),
        defaultFactory: z.string().optional(),
        notificationPreferences: z.record(z.boolean()).optional(),
      })
      .optional(),
  }),
});

export const UpdateCompanySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Company name must be at least 2 characters").optional(),
    industry: z.string().optional(),
    logo: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    gstNumber: z.string().optional(),
    website: z.string().optional(),
    currency: z.string().optional(),
    timezone: z.string().optional(),
    branding: z
      .object({
        displayName: z.string().optional(),
        primaryColor: z.string().optional(),
        logo: z.string().optional(),
      })
      .optional(),
    settings: z
      .object({
        currency: z.string().optional(),
        timezone: z.string().optional(),
        dateFormat: z.string().optional(),
        language: z.string().optional(),
        fiscalYear: z.string().optional(),
        defaultWarehouse: z.string().optional(),
        defaultFactory: z.string().optional(),
        notificationPreferences: z.record(z.boolean()).optional(),
      })
      .optional(),
  }),
});

export const CompanySettingsSchema = z.object({
  body: z.object({
    currency: z.string().optional(),
    timezone: z.string().optional(),
    dateFormat: z.string().optional(),
    language: z.string().optional(),
    fiscalYear: z.string().optional(),
    defaultWarehouse: z.string().optional(),
    defaultFactory: z.string().optional(),
    notificationPreferences: z.record(z.boolean()).optional(),
  }),
});

export const CompanyBrandingSchema = z.object({
  body: z.object({
    displayName: z.string().optional(),
    primaryColor: z.string().optional(),
    logo: z.string().optional(),
  }),
});

export const CompanyStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "inactive", "suspended", "pending"], {
      required_error: "Status is required",
      invalid_type_error: "Status must be active, inactive, suspended, or pending",
    }),
  }),
});

export class CompanyController {
  private isPlatformAdmin(req: AuthenticatedRequest): boolean {
    return req.user?.role === "Platform Admin" || req.user?.role === "Super Admin";
  }

  async getCompanies(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const industry = req.query.industry as string;

      const result = await companyService.getCompanies(
        req.companyId!,
        this.isPlatformAdmin(req),
        { page, limit, search, status, industry }
      );

      res.status(200).json({
        success: true,
        message: "Companies retrieved successfully",
        data: result.companies,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCompanyById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.params.id;
      const company = await companyService.getCompanyById(
        companyId,
        req.companyId!,
        this.isPlatformAdmin(req)
      );

      if (!company) {
        res.status(404).json({
          success: false,
          message: "Company not found or access denied",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Company retrieved successfully",
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCompany(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];
      const company = await companyService.createCompany(
        req.body,
        req.user?._id?.toString(),
        ipAddress,
        userAgent
      );

      res.status(201).json({
        success: true,
        message: "Company created successfully",
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCompany(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.params.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const company = await companyService.updateCompany(
        companyId,
        req.companyId!,
        this.isPlatformAdmin(req),
        req.body,
        req.user!._id.toString(),
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: "Company updated successfully",
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCompanySettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.params.id;
      const settings = await companyService.getCompanySettings(
        companyId,
        req.companyId!,
        this.isPlatformAdmin(req)
      );

      res.status(200).json({
        success: true,
        message: "Company settings retrieved successfully",
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCompanySettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.params.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const settings = await companyService.updateCompanySettings(
        companyId,
        req.companyId!,
        this.isPlatformAdmin(req),
        req.body,
        req.user!._id.toString(),
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: "Company settings updated successfully",
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCompanyBranding(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.params.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const branding = await companyService.updateCompanyBranding(
        companyId,
        req.companyId!,
        this.isPlatformAdmin(req),
        req.body,
        req.user!._id.toString(),
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: "Company branding updated successfully",
        data: branding,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCompanyStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.params.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const company = await companyService.updateCompanyStatus(
        companyId,
        req.companyId!,
        this.isPlatformAdmin(req),
        req.body.status,
        req.user!._id.toString(),
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: `Company status updated to ${req.body.status}`,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCompany(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.params.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      await companyService.deleteCompany(
        companyId,
        req.companyId!,
        this.isPlatformAdmin(req),
        req.user!._id.toString(),
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: "Company deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const companyController = new CompanyController();
export default companyController;
