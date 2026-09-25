import { Request, Response, NextFunction } from "express";
import { customerService } from "../services/customer.service";
import z from "zod";

export const CreateCustomerSchema = z
  .object({
    name: z.string().min(2, "Customer name must be at least 2 characters").optional(),
    companyName: z.string().min(2, "Company name must be at least 2 characters").optional(),
    code: z.string().optional(),
    contactName: z.string().optional(),
    email: z.string().email("Valid email address is required").optional().or(z.literal("")),
    phone: z.string().optional(),
    customerType: z
      .enum(["corporate", "individual", "distributor", "government", "enterprise"])
      .optional(),
    status: z.enum(["active", "inactive", "on_hold", "lead", "vip"]).optional(),
    creditLimit: z.number().min(0, "Credit limit must be a positive number").optional(),
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
    primaryContact: z
      .object({
        name: z.string().optional(),
        email: z.string().email("Valid contact email is required").optional().or(z.literal("")),
        phone: z.string().optional(),
        role: z.string().optional(),
      })
      .optional(),
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
        id: z.string().optional(),
        name: z.string(),
        email: z.string().optional(),
      })
      .optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.name || data.companyName, {
    message: "Either customer name or companyName must be provided",
    path: ["name"],
  });

export const UpdateCustomerSchema = z.object({
  name: z.string().min(2, "Customer name must be at least 2 characters").optional(),
  companyName: z.string().min(2, "Company name must be at least 2 characters").optional(),
  code: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email("Valid email address is required").optional().or(z.literal("")),
  phone: z.string().optional(),
  customerType: z
    .enum(["corporate", "individual", "distributor", "government", "enterprise"])
    .optional(),
  status: z.enum(["active", "inactive", "on_hold", "lead", "vip"]).optional(),
  creditLimit: z.number().min(0, "Credit limit must be a positive number").optional(),
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
  primaryContact: z
    .object({
      name: z.string().optional(),
      email: z.string().email("Valid contact email is required").optional().or(z.literal("")),
      phone: z.string().optional(),
      role: z.string().optional(),
    })
    .optional(),
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
      id: z.string().optional(),
      name: z.string(),
      email: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const UploadDocumentSchema = z.object({
  title: z.string().min(1, "Document title is required"),
  docType: z
    .enum(["contract", "tax_certificate", "nda", "credit_application", "purchase_order", "other"])
    .optional(),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  fileSize: z.number().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

export const CreateOrderSchema = z.object({
  orderNumber: z.string().optional(),
  date: z.string().optional(),
  totalAmount: z.number().min(0, "Total amount must be greater than or equal to 0"),
  currency: z.string().optional(),
  status: z
    .enum(["draft", "confirmed", "processing", "shipped", "delivered", "cancelled"])
    .optional(),
  paymentStatus: z.enum(["paid", "pending", "partially_paid", "overdue"]).optional(),
  itemsCount: z.number().min(1).optional(),
  itemsSummary: z.string().optional(),
  deliveryDate: z.string().optional(),
});

export class CustomerController {
  // GET /api/customers
  async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { search, status, customerType, creditStatus, page, limit } = req.query;

      const result = await customerService.getCustomers(companyId, {
        search: search as string,
        status: status as string,
        customerType: customerType as string,
        creditStatus: creditStatus as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 12,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/customers/:id
  async getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const { customer, creditStatus } = await customerService.getCustomerById(companyId, id);

      res.status(200).json({
        success: true,
        data: customer,
        creditStatus,
      });
    } catch (error: any) {
      if (error.message === "Customer record not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // POST /api/customers
  async createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      const customer = await customerService.createCustomer(companyId, userId, req.body);

      res.status(201).json({
        success: true,
        message: "Customer account created successfully",
        data: customer,
      });
    } catch (error: any) {
      if (error.message && error.message.includes("already exists")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // PUT /api/customers/:id
  async updateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const customer = await customerService.updateCustomer(companyId, id, req.body);

      res.status(200).json({
        success: true,
        message: "Customer updated successfully",
        data: customer,
      });
    } catch (error: any) {
      if (error.message === "Customer record not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // DELETE /api/customers/:id
  async deleteCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      await customerService.deleteCustomer(companyId, id);

      res.status(200).json({
        success: true,
        message: "Customer account deactivated successfully",
      });
    } catch (error: any) {
      if (error.message === "Customer record not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // GET /api/customers/:id/orders
  async getCustomerOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const result = await customerService.getCustomerOrders(companyId, id);

      res.status(200).json({
        success: true,
        data: result.orders,
        stats: result.stats,
      });
    } catch (error: any) {
      if (error.message === "Customer record not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // POST /api/customers/:id/orders
  async addCustomerOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;

      const order = await customerService.addCustomerOrder(companyId, id, req.body);

      res.status(201).json({
        success: true,
        message: "Sales order recorded successfully",
        data: order,
      });
    } catch (error: any) {
      if (error.message === "Customer record not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // POST /api/customers/:id/documents
  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id } = req.params;
      const { title, docType, fileName, fileUrl, fileSize, expiryDate, notes } = req.body;

      const fileData = req.file
        ? {
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            fileSize: req.file.size,
          }
        : {};

      const newDoc = await customerService.uploadDocument(companyId, id, {
        title,
        docType,
        fileName,
        fileUrl,
        fileSize,
        expiryDate,
        notes,
        ...fileData,
      });

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: newDoc,
      });
    } catch (error: any) {
      if (error.message === "Customer record not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // DELETE /api/customers/:id/documents/:docId
  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const { id, docId } = req.params;

      await customerService.deleteDocument(companyId, id, docId);

      res.status(200).json({
        success: true,
        message: "Document removed successfully",
      });
    } catch (error: any) {
      if (error.message === "Customer record not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }
}

export const customerController = new CustomerController();
export default customerController;
