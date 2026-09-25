import {
  Customer,
  ICustomer,
  ICustomerDocumentSub,
  ICustomerOrderSub,
  ICreditStatusInfo,
  CustomerType,
  CustomerStatus,
  CreditStatus,
  CustomerDocType,
  CustomerOrderStatus,
  CustomerPaymentStatus,
} from "../models/Customer";
import { Types } from "mongoose";

export interface CustomerFilterParams {
  search?: string;
  status?: string;
  customerType?: string;
  creditStatus?: string;
  page?: number;
  limit?: number;
}

export interface CreateCustomerInput {
  name?: string;
  companyName?: string;
  code?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  customerType?: CustomerType;
  status?: CustomerStatus;
  creditLimit?: number;
  creditStanding?: {
    limit?: number;
    usedCredit?: number;
    availableCredit?: number;
    status?: CreditStatus;
    score?: number;
    paymentTerms?: string;
  };
  primaryContact?: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  taxId?: string;
  accountManager?: {
    id?: Types.ObjectId | string;
    name: string;
    email?: string;
  };
  tags?: string[];
  notes?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

export interface CustomerDocumentInput {
  title: string;
  docType?: CustomerDocType;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  expiryDate?: string | Date;
  notes?: string;
}

export interface CustomerOrderInput {
  orderNumber?: string;
  date?: string | Date;
  totalAmount: number;
  currency?: string;
  status?: CustomerOrderStatus;
  paymentStatus?: CustomerPaymentStatus;
  itemsCount?: number;
  itemsSummary?: string;
  deliveryDate?: string | Date;
}

export class CustomerService {
  /**
   * Helper to generate auto customer code if missing (e.g. CUST-0001)
   */
  private async generateCustomerCode(companyId: string): Promise<string> {
    const count = await Customer.countDocuments({ companyId });
    const sequence = (count + 1).toString().padStart(4, "0");
    return `CUST-${sequence}`;
  }

  /**
   * Helper to generate order number if missing (e.g. SO-2026-1001)
   */
  private generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SO-${year}-${random}`;
  }

  /**
   * Get filtered & paginated customers directory with summary stats
   */
  async getCustomers(companyId: string, params: CustomerFilterParams = {}) {
    const query: any = { companyId, isDeleted: { $ne: true } };

    if (params.status && params.status !== "ALL") {
      query.status = params.status;
    }
    if (params.customerType && params.customerType !== "ALL") {
      query.customerType = params.customerType;
    }
    if (params.creditStatus && params.creditStatus !== "ALL") {
      query["creditStanding.status"] = params.creditStatus;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      const regex = new RegExp(q, "i");
      query.$or = [
        { name: regex },
        { companyName: regex },
        { code: regex },
        { contactName: regex },
        { email: regex },
        { "primaryContact.name": regex },
        { "primaryContact.email": regex },
        { taxId: regex },
        { tags: { $in: [regex] } },
      ];
    }

    const page = Math.max(Number(params.page || 1), 1);
    const limit = Math.max(Number(params.limit || 12), 1);
    const skip = (page - 1) * limit;

    const [data, total, allCustomers] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Customer.countDocuments(query),
      Customer.find({ companyId, isDeleted: { $ne: true } }),
    ]);

    const stats = {
      totalCustomers: allCustomers.length,
      activeCount: allCustomers.filter((c) => c.status === "active").length,
      vipCount: allCustomers.filter((c) => c.status === "vip").length,
      onHoldCount: allCustomers.filter((c) => c.status === "on_hold").length,
      totalCreditLimit: allCustomers.reduce(
        (sum, c) => sum + (c.creditStanding?.limit || c.creditLimit || 0),
        0
      ),
      totalCreditUsed: allCustomers.reduce(
        (sum, c) => sum + (c.creditStanding?.usedCredit || 0),
        0
      ),
      totalRevenue: allCustomers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0),
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
   * Get single customer details with detailed credit status calculation
   */
  async getCustomerById(companyId: string, customerId: string) {
    const customer = await Customer.findOne({
      _id: customerId,
      companyId,
      isDeleted: { $ne: true },
    });

    if (!customer) {
      throw new Error("Customer record not found");
    }

    const creditStatus: ICreditStatusInfo = customer.getCreditStatus();

    return {
      customer,
      creditStatus,
    };
  }

  /**
   * Create a new customer in the directory
   */
  async createCustomer(companyId: string, userId: string, input: CreateCustomerInput): Promise<ICustomer> {
    const code = input.code
      ? input.code.trim().toUpperCase()
      : await this.generateCustomerCode(companyId);

    // Verify code uniqueness for company
    const existing = await Customer.findOne({
      companyId,
      code,
      isDeleted: { $ne: true },
    });

    if (existing) {
      throw new Error(`Customer code '${code}' already exists in your organization`);
    }

    const companyName = input.companyName || input.name || "Customer Organization";
    const name = input.name || companyName;

    const contactName = input.contactName || input.primaryContact?.name || name;
    const contactEmail =
      input.email ||
      input.primaryContact?.email ||
      `contact@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "") || "customer"}.com`;
    const contactPhone = input.phone || input.primaryContact?.phone || "";

    const primaryContact = {
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      role: input.primaryContact?.role || "Primary Contact",
    };

    const limit = input.creditLimit ?? input.creditStanding?.limit ?? 50000;
    const usedCredit = input.creditStanding?.usedCredit ?? 0;
    const availableCredit = Math.max(limit - usedCredit, 0);

    const creditStanding = {
      limit,
      usedCredit,
      availableCredit,
      status: input.creditStanding?.status || (input.status === "on_hold" ? "credit_hold" : "good"),
      score: input.creditStanding?.score ?? 85,
      paymentTerms: input.creditStanding?.paymentTerms || "Net 30",
    };

    const customer = await Customer.create({
      ...input,
      companyId,
      code,
      name,
      companyName,
      contactName,
      email: contactEmail,
      phone: contactPhone,
      primaryContact,
      creditLimit: limit,
      creditStanding,
      customerType: input.customerType || "corporate",
      status: input.status || "active",
      createdBy: userId,
    });

    return customer;
  }

  /**
   * Update existing customer profile and credit information
   */
  async updateCustomer(companyId: string, customerId: string, input: UpdateCustomerInput): Promise<ICustomer> {
    const customer = await Customer.findOne({
      _id: customerId,
      companyId,
      isDeleted: { $ne: true },
    });

    if (!customer) {
      throw new Error("Customer record not found");
    }

    // Handle name & companyName synchronization
    if (input.companyName && !input.name) input.name = input.companyName;
    if (input.name && !input.companyName) input.companyName = input.name;

    // Handle primaryContact & contactName / email / phone
    if (input.contactName || input.email || input.phone) {
      if (!customer.primaryContact) {
        customer.primaryContact = { name: "", email: "" };
      }
      if (input.contactName) {
        customer.contactName = input.contactName;
        customer.primaryContact.name = input.contactName;
      }
      if (input.email) {
        customer.email = input.email;
        customer.primaryContact.email = input.email;
      }
      if (input.phone) {
        customer.phone = input.phone;
        customer.primaryContact.phone = input.phone;
      }
    }

    if (input.primaryContact) {
      customer.primaryContact = {
        ...customer.primaryContact,
        ...input.primaryContact,
      };
      if (input.primaryContact.name) customer.contactName = input.primaryContact.name;
      if (input.primaryContact.email) customer.email = input.primaryContact.email;
      if (input.primaryContact.phone) customer.phone = input.primaryContact.phone;
    }

    // Handle creditLimit & creditStanding synchronization
    if (input.creditLimit !== undefined) {
      customer.creditLimit = input.creditLimit;
      if (!customer.creditStanding) {
        customer.creditStanding = {
          limit: input.creditLimit,
          usedCredit: 0,
          availableCredit: input.creditLimit,
          status: "good",
          score: 85,
          paymentTerms: "Net 30",
        };
      } else {
        customer.creditStanding.limit = input.creditLimit;
        customer.creditStanding.availableCredit = Math.max(
          input.creditLimit - (customer.creditStanding.usedCredit || 0),
          0
        );
      }
    }

    if (input.creditStanding) {
      const limit = input.creditStanding.limit ?? customer.creditStanding?.limit ?? customer.creditLimit;
      const usedCredit = input.creditStanding.usedCredit ?? customer.creditStanding?.usedCredit ?? 0;
      const availableCredit = Math.max(limit - usedCredit, 0);

      customer.creditLimit = limit;
      customer.creditStanding = {
        limit,
        usedCredit,
        availableCredit,
        status: input.creditStanding.status || customer.creditStanding?.status || "good",
        score: input.creditStanding.score ?? customer.creditStanding?.score ?? 85,
        paymentTerms: input.creditStanding.paymentTerms || customer.creditStanding?.paymentTerms || "Net 30",
      };
    }

    // Update other basic fields
    if (input.name) customer.name = input.name;
    if (input.companyName) customer.companyName = input.companyName;
    if (input.customerType) customer.customerType = input.customerType;
    if (input.status) {
      customer.status = input.status;
      if (input.status === "on_hold" && customer.creditStanding.status !== "suspended") {
        customer.creditStanding.status = "credit_hold";
      }
    }
    if (input.billingAddress) {
      customer.billingAddress = {
        ...customer.billingAddress,
        ...input.billingAddress,
      };
    }
    if (input.shippingAddress) {
      customer.shippingAddress = {
        ...customer.shippingAddress,
        ...input.shippingAddress,
      };
    }
    if (input.taxId !== undefined) customer.taxId = input.taxId;
    if (input.tags !== undefined) customer.tags = input.tags;
    if (input.notes !== undefined) customer.notes = input.notes;
    if (input.accountManager !== undefined) {
      customer.accountManager = {
        id: input.accountManager.id ? new Types.ObjectId(input.accountManager.id.toString()) : undefined,
        name: input.accountManager.name,
        email: input.accountManager.email,
      };
    }

    await customer.save();
    return customer;
  }

  /**
   * Soft delete / deactivate customer
   */
  async deleteCustomer(companyId: string, customerId: string): Promise<boolean> {
    const customer = await Customer.findOneAndUpdate(
      { _id: customerId, companyId, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, status: "inactive" } },
      { new: true }
    );

    if (!customer) {
      throw new Error("Customer record not found");
    }

    return true;
  }

  /**
   * Get customer order history
   */
  async getCustomerOrders(companyId: string, customerId: string) {
    const customer = await Customer.findOne({
      _id: customerId,
      companyId,
      isDeleted: { $ne: true },
    });

    if (!customer) {
      throw new Error("Customer record not found");
    }

    const orders = customer.orders || [];

    const stats = {
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      deliveredCount: orders.filter((o) => o.status === "delivered").length,
      processingCount: orders.filter((o) => ["processing", "confirmed", "shipped"].includes(o.status)).length,
      pendingPaymentCount: orders.filter((o) => o.paymentStatus === "pending" || o.paymentStatus === "overdue").length,
    };

    return {
      orders,
      stats,
    };
  }

  /**
   * Add a new order to customer order history and update credit used & revenue
   */
  async addCustomerOrder(companyId: string, customerId: string, orderData: CustomerOrderInput): Promise<ICustomerOrderSub> {
    const customer = await Customer.findOne({
      _id: customerId,
      companyId,
      isDeleted: { $ne: true },
    });

    if (!customer) {
      throw new Error("Customer record not found");
    }

    const orderNumber = orderData.orderNumber || this.generateOrderNumber();
    const totalAmount = Number(orderData.totalAmount) || 0;

    const newOrder: any = {
      orderNumber,
      date: orderData.date ? new Date(orderData.date) : new Date(),
      totalAmount,
      currency: orderData.currency || "USD",
      status: orderData.status || "confirmed",
      paymentStatus: orderData.paymentStatus || "pending",
      itemsCount: orderData.itemsCount || 1,
      itemsSummary: orderData.itemsSummary || "Industrial Order Items",
      deliveryDate: orderData.deliveryDate ? new Date(orderData.deliveryDate) : undefined,
    };

    if (!customer.orders) {
      customer.orders = [];
    }

    customer.orders.unshift(newOrder as ICustomerOrderSub);

    // Update customer financial stats
    customer.totalOrdersCount = (customer.totalOrdersCount || 0) + 1;
    customer.totalRevenue = (customer.totalRevenue || 0) + totalAmount;

    // If order payment is pending or partial, increment usedCredit
    if (newOrder.paymentStatus !== "paid") {
      const currentUsed = customer.creditStanding?.usedCredit || 0;
      const limit = customer.creditStanding?.limit || customer.creditLimit || 50000;
      const newUsed = currentUsed + totalAmount;

      customer.creditStanding.usedCredit = newUsed;
      customer.creditStanding.availableCredit = Math.max(limit - newUsed, 0);

      // Warning or credit hold if over 90%
      if (newUsed >= limit) {
        customer.creditStanding.status = "credit_hold";
      } else if (newUsed >= limit * 0.9) {
        customer.creditStanding.status = "warning";
      }
    }

    await customer.save();
    return customer.orders[0];
  }

  /**
   * Upload & attach a document to customer document vault
   */
  async uploadDocument(
    companyId: string,
    customerId: string,
    docData: CustomerDocumentInput
  ): Promise<ICustomerDocumentSub> {
    const customer = await Customer.findOne({
      _id: customerId,
      companyId,
      isDeleted: { $ne: true },
    });

    if (!customer) {
      throw new Error("Customer record not found");
    }

    const expiry = docData.expiryDate ? new Date(docData.expiryDate) : undefined;
    let docStatus: "valid" | "expiring_soon" | "expired" | "pending_review" = "valid";

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
      title: docData.title || "Customer Document",
      docType: docData.docType || "contract",
      fileName: docData.fileName || `${(docData.title || "document").toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileUrl: docData.fileUrl || "#",
      fileSize: docData.fileSize || 1024 * 350,
      uploadedAt: new Date(),
      expiryDate: expiry,
      status: docStatus,
      notes: docData.notes,
    };

    if (!customer.documents) {
      customer.documents = [];
    }

    customer.documents.unshift(newDoc as ICustomerDocumentSub);
    await customer.save();

    return customer.documents[0];
  }

  /**
   * Delete document from customer vault
   */
  async deleteDocument(companyId: string, customerId: string, docId: string): Promise<boolean> {
    const customer = await Customer.findOne({
      _id: customerId,
      companyId,
      isDeleted: { $ne: true },
    });

    if (!customer) {
      throw new Error("Customer record not found");
    }

    if (customer.documents) {
      customer.documents = customer.documents.filter(
        (doc: any) => doc._id?.toString() !== docId
      );
      await customer.save();
    }

    return true;
  }
}

export const customerService = new CustomerService();
export default customerService;
