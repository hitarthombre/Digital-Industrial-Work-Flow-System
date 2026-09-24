import { Request, Response, NextFunction } from "express";
import { Customer } from "../models/Customer";
import z from "zod";

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, "Customer name must be at least 2 characters"),
  code: z.string().min(2, "Customer code is required"),
  customerType: z.enum(["corporate", "individual", "distributor", "government", "enterprise"]).optional(),
  status: z.enum(["active", "inactive", "on_hold", "lead", "vip"]).optional(),
  creditStanding: z
    .object({
      limit: z.number().min(0).optional(),
      usedCredit: z.number().min(0).optional(),
      availableCredit: z.number().min(0).optional(),
      status: z.enum(["excellent", "good", "warning", "credit_hold", "suspended"]).optional(),
      score: z.number().min(0).max(100).optional(),
      paymentTerms: z.string().optional(),
    })
    .optional(),
  primaryContact: z.object({
    name: z.string().min(1, "Contact name is required"),
    email: z.string().email("Valid contact email is required"),
    phone: z.string().optional(),
    role: z.string().optional(),
  }),
  billingAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  shippingAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  taxId: z.string().optional(),
  accountManager: z
    .object({
      name: z.string(),
      email: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export class CustomerController {
  // GET /api/customers
  async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { search, status, customerType, page = 1, limit = 12 } = req.query;

      const query: any = { companyId, isDeleted: { $ne: true } };

      if (status && status !== "ALL") {
        query.status = status;
      }
      if (customerType && customerType !== "ALL") {
        query.customerType = customerType;
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
        Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Customer.countDocuments(query),
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

  // GET /api/customers/:id
  async getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const customer = await Customer.findOne({
        _id: id,
        companyId,
        isDeleted: { $ne: true },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "Customer not found" });
        return;
      }

      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/customers
  async createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      const existing = await Customer.findOne({
        companyId,
        code: req.body.code.toUpperCase(),
        isDeleted: { $ne: true },
      });

      if (existing) {
        res.status(400).json({ success: false, message: "Customer code already exists for this organization" });
        return;
      }

      const creditLimit = req.body.creditStanding?.limit ?? 50000;
      const usedCredit = req.body.creditStanding?.usedCredit ?? 0;

      const customer = new Customer({
        ...req.body,
        code: req.body.code.toUpperCase(),
        companyId,
        createdBy: userId,
        creditStanding: {
          limit: creditLimit,
          usedCredit,
          availableCredit: Math.max(creditLimit - usedCredit, 0),
          status: req.body.creditStanding?.status || "good",
          score: req.body.creditStanding?.score || 85,
          paymentTerms: req.body.creditStanding?.paymentTerms || "Net 30",
        },
      });

      await customer.save();

      res.status(201).json({
        success: true,
        message: "Customer account created successfully",
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/customers/:id
  async updateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const customer = await Customer.findOne({
        _id: id,
        companyId,
        isDeleted: { $ne: true },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "Customer account not found" });
        return;
      }

      // Calculate available credit if credit fields provided
      if (req.body.creditStanding) {
        const limit = req.body.creditStanding.limit ?? customer.creditStanding.limit;
        const usedCredit = req.body.creditStanding.usedCredit ?? customer.creditStanding.usedCredit;
        req.body.creditStanding.availableCredit = Math.max(limit - usedCredit, 0);
      }

      Object.assign(customer, req.body);
      await customer.save();

      res.status(200).json({
        success: true,
        message: "Customer updated successfully",
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/customers/:id
  async deleteCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const customer = await Customer.findOne({
        _id: id,
        companyId,
        isDeleted: { $ne: true },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "Customer not found" });
        return;
      }

      customer.isDeleted = true;
      await customer.save();

      res.status(200).json({ success: true, message: "Customer account deactivated successfully" });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/customers/:id/orders
  async getCustomerOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const customer = await Customer.findOne({
        _id: id,
        companyId,
        isDeleted: { $ne: true },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "Customer not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: customer.orders || [],
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/customers/:id/documents
  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;
      const { title, docType, fileName, fileUrl, fileSize, expiryDate, notes } = req.body;

      const customer = await Customer.findOne({
        _id: id,
        companyId,
        isDeleted: { $ne: true },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "Customer not found" });
        return;
      }

      const newDoc = {
        title: title || "Attached Document",
        docType: docType || "contract",
        fileName: fileName || "document.pdf",
        fileUrl: fileUrl || "#",
        fileSize: fileSize || 1024 * 350,
        uploadedAt: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        status: "valid",
        notes,
      };

      customer.documents = customer.documents || [];
      customer.documents.push(newDoc as any);
      await customer.save();

      const addedDoc = customer.documents[customer.documents.length - 1];

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: addedDoc,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/customers/:id/documents/:docId
  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id, docId } = req.params;

      const customer = await Customer.findOne({
        _id: id,
        companyId,
        isDeleted: { $ne: true },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "Customer not found" });
        return;
      }

      if (customer.documents) {
        customer.documents = customer.documents.filter(
          (doc: any) => doc._id.toString() !== docId
        );
        await customer.save();
      }

      res.status(200).json({
        success: true,
        message: "Document removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const customerController = new CustomerController();
