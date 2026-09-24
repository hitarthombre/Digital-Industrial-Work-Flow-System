import { Supplier, ISupplier, ISupplierDocumentSub, IPurchaseHistorySub, IPerformanceMetrics } from "../models/Supplier";
import { Types } from "mongoose";

export interface SupplierFilterParams {
  search?: string;
  status?: string;
  category?: string;
  minRating?: number;
  complianceStatus?: string;
  page?: number;
  limit?: number;
}

export interface CreateSupplierInput {
  name: string;
  code?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  category?: "raw_material" | "components" | "packaging" | "machinery" | "logistics" | "services" | "other";
  status?: "active" | "inactive" | "under_review" | "blocked";
  rating?: number;
  complianceStatus?: "compliant" | "pending_audit" | "non_compliant";
  primaryContact?: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    isPrimary?: boolean;
  };
  contacts?: Array<{
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  }>;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  taxId?: string;
  paymentTerms?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {}

export class SupplierService {
  /**
   * Helper to generate auto supplier code if missing (e.g. SUP-1001)
   */
  private async generateSupplierCode(companyId: string): Promise<string> {
    const count = await Supplier.countDocuments({ companyId });
    const sequence = (count + 1).toString().padStart(4, "0");
    return `SUP-${sequence}`;
  }

  /**
   * Get filtered & paginated supplier directory with summary stats
   */
  async getSuppliers(companyId: string, params: SupplierFilterParams = {}) {
    const query: any = { companyId, isDeleted: { $ne: true } };

    if (params.status && params.status !== "ALL") {
      query.status = params.status;
    }
    if (params.category && params.category !== "ALL") {
      query.category = params.category;
    }
    if (params.complianceStatus && params.complianceStatus !== "ALL") {
      query.complianceStatus = params.complianceStatus;
    }
    if (params.minRating && params.minRating > 0) {
      query.rating = { $gte: Number(params.minRating) };
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      const regex = new RegExp(q, "i");
      query.$or = [
        { name: regex },
        { code: regex },
        { contactPerson: regex },
        { email: regex },
        { taxId: regex },
        { "primaryContact.name": regex },
        { "primaryContact.email": regex },
        { tags: { $in: [regex] } },
      ];
    }

    const page = Math.max(Number(params.page || 1), 1);
    const limit = Math.max(Number(params.limit || 12), 1);
    const skip = (page - 1) * limit;

    const [data, total, allSuppliers] = await Promise.all([
      Supplier.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Supplier.countDocuments(query),
      Supplier.find({ companyId, isDeleted: { $ne: true } }),
    ]);

    const stats = {
      totalSuppliers: allSuppliers.length,
      activeCount: allSuppliers.filter((s) => s.status === "active").length,
      compliantCount: allSuppliers.filter((s) => s.complianceStatus === "compliant").length,
      avgRating: allSuppliers.length
        ? Number((allSuppliers.reduce((acc, s) => acc + (s.rating || 5), 0) / allSuppliers.length).toFixed(1))
        : 5.0,
      totalSpend: allSuppliers.reduce((acc, s) => acc + (s.totalSpend || 0), 0),
    };

    return {
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats,
    };
  }

  /**
   * Get single supplier details along with performance metrics
   */
  async getSupplierById(companyId: string, supplierId: string) {
    const supplier = await Supplier.findOne({ _id: supplierId, companyId, isDeleted: { $ne: true } });
    if (!supplier) {
      throw new Error("Supplier record not found");
    }

    const performanceMetrics: IPerformanceMetrics = supplier.getPerformanceMetrics();

    return {
      supplier,
      performanceMetrics,
    };
  }

  /**
   * Create a new supplier in directory
   */
  async createSupplier(companyId: string, userId: string, input: CreateSupplierInput): Promise<ISupplier> {
    const code = input.code ? input.code.trim().toUpperCase() : await this.generateSupplierCode(companyId);

    // Normalize contact info between top-level and primaryContact object
    const contactName = input.contactPerson || input.primaryContact?.name || input.name;
    const contactEmail = input.email || input.primaryContact?.email || `contact@${input.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
    const contactPhone = input.phone || input.primaryContact?.phone || "";

    const primaryContact = {
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      role: input.primaryContact?.role || "Account Manager",
      isPrimary: true,
    };

    const supplier = await Supplier.create({
      ...input,
      companyId,
      code,
      contactPerson: contactName,
      email: contactEmail,
      phone: contactPhone,
      primaryContact,
      rating: input.rating !== undefined ? input.rating : 5,
      status: input.status || "active",
      complianceStatus: input.complianceStatus || "compliant",
      createdBy: userId,
    });

    return supplier;
  }

  /**
   * Update an existing supplier record
   */
  async updateSupplier(companyId: string, supplierId: string, input: UpdateSupplierInput): Promise<ISupplier> {
    const updatePayload: any = { ...input };

    if (input.contactPerson || input.email || input.phone) {
      if (input.contactPerson) updatePayload["primaryContact.name"] = input.contactPerson;
      if (input.email) updatePayload["primaryContact.email"] = input.email;
      if (input.phone) updatePayload["primaryContact.phone"] = input.phone;
    }

    const supplier = await Supplier.findOneAndUpdate(
      { _id: supplierId, companyId, isDeleted: { $ne: true } },
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      throw new Error("Supplier record not found");
    }

    return supplier;
  }

  /**
   * Soft delete / deactivate supplier
   */
  async deleteSupplier(companyId: string, supplierId: string): Promise<boolean> {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: supplierId, companyId },
      { $set: { isDeleted: true, status: "inactive" } },
      { new: true }
    );

    if (!supplier) {
      throw new Error("Supplier record not found");
    }

    return true;
  }

  /**
   * Upload and record a compliance document in supplier vault
   */
  async uploadComplianceDocument(
    companyId: string,
    supplierId: string,
    docData: {
      title: string;
      docType?: "contract" | "iso_certificate" | "tax_document" | "nda" | "quality_standard" | "audit_report" | "other";
      expiryDate?: string;
      notes?: string;
      fileName?: string;
      fileUrl?: string;
      fileSize?: number;
    }
  ) {
    const supplier = await Supplier.findOne({ _id: supplierId, companyId, isDeleted: { $ne: true } });
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    const expiry = docData.expiryDate ? new Date(docData.expiryDate) : undefined;
    let docStatus: "valid" | "expiring_soon" | "expired" = "valid";

    if (expiry) {
      const now = new Date();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (expiry < now) {
        docStatus = "expired";
      } else if (expiry.getTime() - now.getTime() < thirtyDaysMs) {
        docStatus = "expiring_soon";
      }
    }

    const newDoc: any = {
      title: docData.title || "Compliance Certificate",
      docType: docData.docType || "iso_certificate",
      fileName: docData.fileName || `${(docData.title || "compliance_document").toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileUrl: docData.fileUrl || "#",
      fileSize: docData.fileSize || 1024 * 350,
      uploadedAt: new Date(),
      expiryDate: expiry,
      status: docStatus,
      notes: docData.notes,
    };

    if (!supplier.documents) {
      supplier.documents = [];
    }

    supplier.documents.unshift(newDoc as ISupplierDocumentSub);
    await supplier.save();

    return supplier.documents[0];
  }

  /**
   * Delete compliance document from supplier vault
   */
  async deleteComplianceDocument(companyId: string, supplierId: string, docId: string): Promise<boolean> {
    const supplier = await Supplier.findOne({ _id: supplierId, companyId, isDeleted: { $ne: true } });
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    if (supplier.documents) {
      supplier.documents = supplier.documents.filter((d: any) => d._id?.toString() !== docId);
      await supplier.save();
    }

    return true;
  }

  /**
   * Get purchase history & stats for a supplier
   */
  async getPurchaseHistory(companyId: string, supplierId: string) {
    const supplier = await Supplier.findOne({ _id: supplierId, companyId, isDeleted: { $ne: true } });
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    const history = supplier.purchaseHistory || [];
    const metrics = supplier.getPerformanceMetrics();

    return {
      history,
      stats: {
        totalSpend: metrics.totalSpend,
        totalOrders: metrics.totalOrders,
        completedOrders: history.filter((h) => h.status === "delivered").length,
        onTimeDeliveryRate: metrics.onTimeDeliveryRate,
        avgRating: metrics.qualityRating,
      },
    };
  }
}

export const supplierService = new SupplierService();
export default supplierService;
