import { Request, Response, NextFunction } from "express";
import { supplierService } from "../services/supplier.service";
import z from "zod";

export const CreateSupplierSchema = z.object({
  name: z.string().min(2, "Supplier name must be at least 2 characters"),
  code: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email("Valid email address is required").optional().or(z.literal("")),
  phone: z.string().optional(),
  category: z
    .enum([
      "raw_material",
      "components",
      "packaging",
      "machinery",
      "logistics",
      "services",
      "other",
    ])
    .optional(),
  status: z.enum(["active", "inactive", "under_review", "blocked"]).optional(),
  rating: z.number().min(1).max(5).optional(),
  complianceStatus: z.enum(["compliant", "pending_audit", "non_compliant"]).optional(),
  primaryContact: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      role: z.string().optional(),
    })
    .optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial();

export const UploadDocumentSchema = z.object({
  title: z.string().min(1, "Document title is required"),
  docType: z
    .enum([
      "contract",
      "iso_certificate",
      "tax_document",
      "nda",
      "quality_standard",
      "audit_report",
      "other",
    ])
    .optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

export class SupplierController {
  // GET /api/suppliers
  async getSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { search, status, category, minRating, complianceStatus, page, limit } = req.query;

      const result = await supplierService.getSuppliers(companyId, {
        search: search as string,
        status: status as string,
        category: category as string,
        complianceStatus: complianceStatus as string,
        minRating: minRating ? Number(minRating) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 12,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/suppliers/:id
  async getSupplierById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const { supplier, performanceMetrics } = await supplierService.getSupplierById(companyId, id);

      res.status(200).json({
        success: true,
        data: supplier,
        performanceMetrics,
      });
    } catch (error: any) {
      if (error.message === "Supplier record not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // POST /api/suppliers
  async createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      const supplier = await supplierService.createSupplier(companyId, userId, req.body);

      res.status(201).json({
        success: true,
        message: "Supplier created successfully",
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/suppliers/:id
  async updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const supplier = await supplierService.updateSupplier(companyId, id, req.body);

      res.status(200).json({
        success: true,
        message: "Supplier updated successfully",
        data: supplier,
      });
    } catch (error: any) {
      if (error.message === "Supplier record not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // DELETE /api/suppliers/:id
  async deleteSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      await supplierService.deleteSupplier(companyId, id);

      res.status(200).json({
        success: true,
        message: "Supplier deactivated successfully",
      });
    } catch (error: any) {
      if (error.message === "Supplier record not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // GET /api/suppliers/:id/purchase-history
  async getPurchaseHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const result = await supplierService.getPurchaseHistory(companyId, id);

      res.status(200).json({
        success: true,
        data: result.history,
        stats: result.stats,
      });
    } catch (error: any) {
      if (error.message === "Supplier not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // POST /api/suppliers/:id/documents
  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;
      const { title, docType, expiryDate, notes } = req.body;

      const fileData = req.file
        ? {
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            fileSize: req.file.size,
          }
        : {};

      const newDoc = await supplierService.uploadComplianceDocument(companyId, id, {
        title,
        docType,
        expiryDate,
        notes,
        ...fileData,
      });

      res.status(201).json({
        success: true,
        message: "Compliance document uploaded successfully",
        data: newDoc,
      });
    } catch (error: any) {
      if (error.message === "Supplier not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // DELETE /api/suppliers/:id/documents/:docId
  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id, docId } = req.params;

      await supplierService.deleteComplianceDocument(companyId, id, docId);

      res.status(200).json({
        success: true,
        message: "Compliance document deleted successfully",
      });
    } catch (error: any) {
      if (error.message === "Supplier not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }
}

export const supplierController = new SupplierController();
export default supplierController;
