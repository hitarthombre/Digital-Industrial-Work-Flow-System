import { Request, Response, NextFunction } from "express";
import { Supplier } from "../models/Supplier";
import z from "zod";

export const CreateSupplierSchema = z.object({
  name: z.string().min(2, "Supplier name must be at least 2 characters"),
  code: z.string().min(2, "Supplier code is required"),
  category: z.enum([
    "raw_material",
    "components",
    "packaging",
    "machinery",
    "logistics",
    "services",
    "other",
  ]),
  status: z.enum(["active", "inactive", "under_review", "blocked"]).optional(),
  rating: z.number().min(1).max(5).optional(),
  complianceStatus: z.enum(["compliant", "pending_audit", "non_compliant"]).optional(),
  primaryContact: z.object({
    name: z.string().min(1, "Contact name is required"),
    email: z.string().email("Valid contact email is required"),
    phone: z.string().optional(),
    role: z.string().optional(),
  }),
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

export class SupplierController {
  // GET /api/suppliers
  async getSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { search, status, category, minRating, page = 1, limit = 12 } = req.query;

      const query: any = { companyId, isDeleted: { $ne: true } };

      if (status && status !== "ALL") {
        query.status = status;
      }
      if (category && category !== "ALL") {
        query.category = category;
      }
      if (minRating && minRating !== "ALL") {
        query.rating = { $gte: Number(minRating) };
      }
      if (search && typeof search === "string" && search.trim()) {
        const q = search.trim();
        query.$or = [
          { name: { $regex: q, $options: "i" } },
          { code: { $regex: q, $options: "i" } },
          { "primaryContact.name": { $regex: q, $options: "i" } },
          { "primaryContact.email": { $regex: q, $options: "i" } },
          { tags: { $in: [new RegExp(q, "i")] } },
        ];
      }

      const pageNum = Math.max(Number(page), 1);
      const limitNum = Math.max(Number(limit), 1);
      const skip = (pageNum - 1) * limitNum;

      const [data, total] = await Promise.all([
        Supplier.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Supplier.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        data,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/suppliers/:id
  async getSupplierById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const supplier = await Supplier.findOne({ _id: id, companyId, isDeleted: { $ne: true } });

      if (!supplier) {
        res.status(404).json({ success: false, message: "Supplier record not found" });
        return;
      }

      res.status(200).json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/suppliers
  async createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      const supplier = await Supplier.create({
        ...req.body,
        companyId,
        createdBy: userId,
      });

      res.status(201).json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/suppliers/:id
  async updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const supplier = await Supplier.findOneAndUpdate(
        { _id: id, companyId, isDeleted: { $ne: true } },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!supplier) {
        res.status(404).json({ success: false, message: "Supplier record not found" });
        return;
      }

      res.status(200).json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/suppliers/:id
  async deleteSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const supplier = await Supplier.findOneAndUpdate(
        { _id: id, companyId },
        { $set: { isDeleted: true } },
        { new: true }
      );

      if (!supplier) {
        res.status(404).json({ success: false, message: "Supplier record not found" });
        return;
      }

      res.status(200).json({ success: true, message: "Supplier deactivated successfully" });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/suppliers/:id/purchase-history
  async getPurchaseHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const supplier = await Supplier.findOne({ _id: id, companyId, isDeleted: { $ne: true } });

      if (!supplier) {
        res.status(404).json({ success: false, message: "Supplier not found" });
        return;
      }

      const history = supplier.purchaseHistory || [];

      res.status(200).json({
        success: true,
        data: history,
        stats: {
          totalSpend: supplier.totalSpend || 0,
          totalOrders: supplier.totalOrders || history.length,
          completedOrders: history.filter((h) => h.status === "delivered").length,
          onTimeDeliveryRate: 98,
          avgRating: supplier.rating || 5,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/suppliers/:id/documents
  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;
      const { title, docType, expiryDate, notes } = req.body;

      const supplier = await Supplier.findOne({ _id: id, companyId, isDeleted: { $ne: true } });

      if (!supplier) {
        res.status(404).json({ success: false, message: "Supplier not found" });
        return;
      }

      const isExpiring =
        expiryDate && new Date(expiryDate) < new Date(Date.now() + 30 * 86400000);
      const isExpired = expiryDate && new Date(expiryDate) < new Date();

      const newDoc: any = {
        title: title || "Compliance Certificate",
        docType: docType || "iso_certificate",
        fileName: req.file ? req.file.originalname : `${(title || "document").toLowerCase().replace(/\s+/g, "_")}.pdf`,
        fileUrl: req.file ? `/uploads/${req.file.filename}` : "#",
        fileSize: req.file ? req.file.size : 1024 * 500,
        uploadedAt: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        status: isExpired ? "expired" : isExpiring ? "expiring_soon" : "valid",
        notes,
      };

      const docs = supplier.documents || [];
      docs.unshift(newDoc);
      supplier.documents = docs as any;
      await supplier.save();

      res.status(201).json({
        success: true,
        data: docs[0],
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/suppliers/:id/documents/:docId
  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id, docId } = req.params;

      const supplier = await Supplier.findOne({ _id: id, companyId, isDeleted: { $ne: true } });

      if (!supplier) {
        res.status(404).json({ success: false, message: "Supplier not found" });
        return;
      }

      if (supplier.documents) {
        supplier.documents = supplier.documents.filter((d: any) => d._id.toString() !== docId);
        await supplier.save();
      }

      res.status(200).json({ success: true, message: "Document removed successfully" });
    } catch (error) {
      next(error);
    }
  }
}

export const supplierController = new SupplierController();
export default supplierController;
