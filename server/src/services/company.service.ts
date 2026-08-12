import { Types } from "mongoose";
import { Company, ICompany, ICompanyBranding, ICompanySettings } from "../models/Company";
import { auditService } from "./audit.service";

export interface CreateCompanyInput {
  name: string;
  code: string;
  industry?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  gstNumber?: string;
  website?: string;
  currency?: string;
  timezone?: string;
  status?: "active" | "inactive" | "suspended" | "pending";
  subscriptionPlan?: "free" | "starter" | "growth" | "enterprise";
  branding?: ICompanyBranding;
  settings?: ICompanySettings;
}

export interface UpdateCompanyInput {
  name?: string;
  industry?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  gstNumber?: string;
  website?: string;
  currency?: string;
  timezone?: string;
  branding?: ICompanyBranding;
  settings?: ICompanySettings;
}

export interface CompanyQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  industry?: string;
}

export class CompanyService {
  /**
   * Retrieve companies based on tenant isolation rules and optional filters.
   */
  async getCompanies(
    userCompanyId: string,
    isPlatformAdmin: boolean,
    query: CompanyQueryFilters
  ) {
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(Math.max(query.limit || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: false };

    // Tenant isolation: Non-platform admins can only retrieve their own company
    if (!isPlatformAdmin) {
      filter._id = userCompanyId;
    } else if (userCompanyId) {
      // Platform admin can filter or default to tenant
      if (query.search || query.status || query.industry) {
        // use query filters if provided
      } else {
        // default to user's company or all depending on filter
      }
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.industry) {
      filter.industry = query.industry;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, "i");
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { industry: searchRegex },
        { email: searchRegex },
      ];
    }

    const [companies, total] = await Promise.all([
      Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Company.countDocuments(filter),
    ]);

    return {
      companies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieve single company by ID with strict tenant boundary check.
   * Supports 'my-company' alias for authenticated user's workspace.
   */
  async getCompanyById(companyId: string, userCompanyId: string, isPlatformAdmin: boolean): Promise<ICompany | null> {
    const targetCompanyId = (companyId === "my-company" || !companyId) ? userCompanyId : companyId;

    if (!isPlatformAdmin && targetCompanyId !== userCompanyId) {
      throw new Error("Forbidden: Cross-tenant data access is strictly prohibited");
    }

    const company = await Company.findOne({ _id: targetCompanyId, isDeleted: false });
    return company;
  }

  /**
   * Create a new company.
   */
  async createCompany(data: CreateCompanyInput, userId?: string, ipAddress?: string, userAgent?: string): Promise<ICompany> {
    const uppercaseCode = data.code.trim().toUpperCase();
    const existing = await Company.findOne({ code: uppercaseCode });
    if (existing) {
      throw new Error(`Company code '${uppercaseCode}' is already registered`);
    }

    const defaultSettings: ICompanySettings = {
      currency: data.currency || "USD",
      timezone: data.timezone || "UTC",
      dateFormat: "YYYY-MM-DD",
      language: "en",
      fiscalYear: "April-March",
      notificationPreferences: {
        emailAlerts: true,
        lowStockAlerts: true,
        orderUpdates: true,
      },
      ...data.settings,
    };

    const defaultBranding: ICompanyBranding = {
      displayName: data.branding?.displayName || data.name,
      primaryColor: data.branding?.primaryColor || "#4f46e5",
      logo: data.branding?.logo || data.logo || "",
    };

    const company = await Company.create({
      name: data.name,
      code: uppercaseCode,
      industry: data.industry,
      logo: data.logo || defaultBranding.logo,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
      gstNumber: data.gstNumber,
      website: data.website,
      currency: data.currency || "USD",
      timezone: data.timezone || "UTC",
      status: data.status || "active",
      subscriptionPlan: data.subscriptionPlan || "free",
      branding: defaultBranding,
      settings: defaultSettings,
      isDeleted: false,
    });

    await auditService.log({
      companyId: company._id.toString(),
      userId,
      action: "company:create",
      module: "company",
      referenceId: company._id.toString(),
      after: company.toObject(),
      ipAddress,
      userAgent,
    });

    return company;
  }

  /**
   * Update existing company profile details.
   */
  async updateCompany(
    companyId: string,
    userCompanyId: string,
    isPlatformAdmin: boolean,
    data: UpdateCompanyInput,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ICompany> {
    const targetCompanyId = (companyId === "my-company" || !companyId) ? userCompanyId : companyId;

    if (!isPlatformAdmin && targetCompanyId !== userCompanyId) {
      throw new Error("Forbidden: Cross-tenant data access is strictly prohibited");
    }

    const company = await Company.findOne({ _id: targetCompanyId, isDeleted: false });
    if (!company) {
      throw new Error("Company not found or deleted");
    }

    const beforeState = company.toObject();

    if (data.name !== undefined) company.name = data.name;
    if (data.industry !== undefined) company.industry = data.industry;
    if (data.email !== undefined) company.email = data.email;
    if (data.phone !== undefined) company.phone = data.phone;
    if (data.address !== undefined) company.address = data.address;
    if (data.city !== undefined) company.city = data.city;
    if (data.state !== undefined) company.state = data.state;
    if (data.country !== undefined) company.country = data.country;
    if (data.postalCode !== undefined) company.postalCode = data.postalCode;
    if (data.gstNumber !== undefined) company.gstNumber = data.gstNumber;
    if (data.website !== undefined) company.website = data.website;
    if (data.logo !== undefined) {
      company.logo = data.logo;
      if (company.branding) company.branding.logo = data.logo;
    }
    if (data.currency !== undefined) {
      company.currency = data.currency;
      if (company.settings) company.settings.currency = data.currency;
    }
    if (data.timezone !== undefined) {
      company.timezone = data.timezone;
      if (company.settings) company.settings.timezone = data.timezone;
    }

    if (data.branding) {
      company.branding = {
        ...company.branding,
        ...data.branding,
      };
    }

    if (data.settings) {
      company.settings = {
        ...company.settings,
        ...data.settings,
      };
    }

    await company.save();

    await auditService.log({
      companyId: company._id.toString(),
      userId,
      action: "company:update",
      module: "company",
      referenceId: company._id.toString(),
      before: beforeState,
      after: company.toObject(),
      ipAddress,
      userAgent,
    });

    return company;
  }

  /**
   * Retrieve company settings.
   */
  async getCompanySettings(companyId: string, userCompanyId: string, isPlatformAdmin: boolean): Promise<ICompanySettings> {
    const targetCompanyId = (companyId === "my-company" || !companyId) ? userCompanyId : companyId;

    if (!isPlatformAdmin && targetCompanyId !== userCompanyId) {
      throw new Error("Forbidden: Cross-tenant data access is strictly prohibited");
    }

    const company = await Company.findOne({ _id: targetCompanyId, isDeleted: false });
    if (!company) {
      throw new Error("Company not found or deleted");
    }

    return company.settings || {
      currency: company.currency,
      timezone: company.timezone,
      dateFormat: "YYYY-MM-DD",
      language: "en",
      fiscalYear: "April-March",
    };
  }

  /**
   * Update company settings.
   */
  async updateCompanySettings(
    companyId: string,
    userCompanyId: string,
    isPlatformAdmin: boolean,
    settingsData: Partial<ICompanySettings>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ICompanySettings> {
    const targetCompanyId = (companyId === "my-company" || !companyId) ? userCompanyId : companyId;

    if (!isPlatformAdmin && targetCompanyId !== userCompanyId) {
      throw new Error("Forbidden: Cross-tenant data access is strictly prohibited");
    }

    const company = await Company.findOne({ _id: targetCompanyId, isDeleted: false });
    if (!company) {
      throw new Error("Company not found or deleted");
    }

    const beforeSettings = company.settings ? { ...company.settings } : {};

    company.settings = {
      ...(company.settings || {}),
      ...settingsData,
    };

    if (settingsData.currency) {
      company.currency = settingsData.currency;
    }
    if (settingsData.timezone) {
      company.timezone = settingsData.timezone;
    }

    await company.save();

    await auditService.log({
      companyId: company._id.toString(),
      userId,
      action: "company:settings_update",
      module: "company",
      referenceId: company._id.toString(),
      before: beforeSettings,
      after: company.settings,
      ipAddress,
      userAgent,
    });

    return company.settings;
  }

  /**
   * Update company branding.
   */
  async updateCompanyBranding(
    companyId: string,
    userCompanyId: string,
    isPlatformAdmin: boolean,
    brandingData: Partial<ICompanyBranding>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ICompanyBranding> {
    const targetCompanyId = (companyId === "my-company" || !companyId) ? userCompanyId : companyId;

    if (!isPlatformAdmin && targetCompanyId !== userCompanyId) {
      throw new Error("Forbidden: Cross-tenant data access is strictly prohibited");
    }

    const company = await Company.findOne({ _id: targetCompanyId, isDeleted: false });
    if (!company) {
      throw new Error("Company not found or deleted");
    }

    const beforeBranding = company.branding ? { ...company.branding } : {};

    company.branding = {
      ...(company.branding || {}),
      ...brandingData,
    };

    if (brandingData.logo) {
      company.logo = brandingData.logo;
    }

    await company.save();

    await auditService.log({
      companyId: company._id.toString(),
      userId,
      action: "company:branding_update",
      module: "company",
      referenceId: company._id.toString(),
      before: beforeBranding,
      after: company.branding,
      ipAddress,
      userAgent,
    });

    return company.branding;
  }

  /**
   * Update company status (Active, Inactive, Suspended, Pending).
   */
  async updateCompanyStatus(
    companyId: string,
    userCompanyId: string,
    isPlatformAdmin: boolean,
    status: "active" | "inactive" | "suspended" | "pending",
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ICompany> {
    const targetCompanyId = (companyId === "my-company" || !companyId) ? userCompanyId : companyId;

    if (!isPlatformAdmin && targetCompanyId !== userCompanyId) {
      throw new Error("Forbidden: Cross-tenant data access is strictly prohibited");
    }

    const company = await Company.findOne({ _id: targetCompanyId, isDeleted: false });
    if (!company) {
      throw new Error("Company not found or deleted");
    }

    const beforeStatus = company.status;
    company.status = status;
    await company.save();

    await auditService.log({
      companyId: company._id.toString(),
      userId,
      action: "company:status_update",
      module: "company",
      referenceId: company._id.toString(),
      before: { status: beforeStatus },
      after: { status: company.status },
      ipAddress,
      userAgent,
    });

    return company;
  }

  /**
   * Perform soft deletion / deactivation of company.
   */
  async deleteCompany(
    companyId: string,
    userCompanyId: string,
    isPlatformAdmin: boolean,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    const targetCompanyId = (companyId === "my-company" || !companyId) ? userCompanyId : companyId;

    if (!isPlatformAdmin && targetCompanyId !== userCompanyId) {
      throw new Error("Forbidden: Cross-tenant data access is strictly prohibited");
    }

    const company = await Company.findOne({ _id: targetCompanyId, isDeleted: false });
    if (!company) {
      throw new Error("Company not found or already deleted");
    }

    const beforeState = company.toObject();

    company.isDeleted = true;
    company.deletedAt = new Date();
    company.deletedBy = new Types.ObjectId(userId);
    company.status = "inactive";
    await company.save();

    await auditService.log({
      companyId: company._id.toString(),
      userId,
      action: "company:delete",
      module: "company",
      referenceId: company._id.toString(),
      before: beforeState,
      after: company.toObject(),
      ipAddress,
      userAgent,
    });

    return true;
  }
}

export const companyService = new CompanyService();
export default companyService;
