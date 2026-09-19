import { Customer, ICustomer } from "../models/Customer";
import { Types } from "mongoose";

export class CustomerService {
  async getCustomers(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      segment?: string;
      creditStanding?: string;
    }
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {
      companyId: new Types.ObjectId(companyId),
      isDeleted: false,
    };

    if (query.status && query.status !== "ALL") {
      filter.status = query.status;
    }
    if (query.segment && query.segment !== "ALL") {
      filter.segment = query.segment;
    }
    if (query.creditStanding && query.creditStanding !== "ALL") {
      filter.creditStanding = query.creditStanding;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { email: searchRegex },
        { "contactPerson.name": searchRegex },
      ];
    }

    const [data, total] = await Promise.all([
      Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("accountManagerId", "firstName lastName email")
        .exec(),
      Customer.countDocuments(filter),
    ]);

    const metrics = await Customer.aggregate([
      { $match: { companyId: new Types.ObjectId(companyId), isDeleted: false } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] },
          },
          totalLifetimeSales: { $sum: "$lifetimeSales" },
          blockedCreditCount: {
            $sum: { $cond: [{ $eq: ["$creditStanding", "BLOCKED"] }, 1, 0] },
          },
        },
      },
    ]);

    const metricSummary = metrics[0] || {
      totalCustomers: total,
      activeCustomers: 0,
      totalLifetimeSales: 0,
      blockedCreditCount: 0,
    };

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      metrics: metricSummary,
    };
  }

  async getCustomerById(id: string, companyId: string): Promise<ICustomer | null> {
    return Customer.findOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
      isDeleted: false,
    }).populate("accountManagerId", "firstName lastName email phone");
  }

  async createCustomer(data: any, companyId: string, userId: string): Promise<ICustomer> {
    const customer = new Customer({
      ...data,
      companyId: new Types.ObjectId(companyId),
      createdBy: new Types.ObjectId(userId),
    });
    return customer.save();
  }

  async updateCustomer(id: string, data: any, companyId: string): Promise<ICustomer | null> {
    return Customer.findOneAndUpdate(
      { _id: id, companyId: new Types.ObjectId(companyId), isDeleted: false },
      { $set: data },
      { new: true }
    );
  }

  async deleteCustomer(id: string, companyId: string): Promise<boolean> {
    const result = await Customer.findOneAndUpdate(
      { _id: id, companyId: new Types.ObjectId(companyId) },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    return !!result;
  }

  async getCustomerOrders(id: string, companyId: string) {
    const customer = await Customer.findOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
      isDeleted: false,
    });
    if (!customer) return [];
    return customer.orders || [];
  }

  async addCustomerDocument(id: string, docData: any, companyId: string): Promise<ICustomer | null> {
    return Customer.findOneAndUpdate(
      { _id: id, companyId: new Types.ObjectId(companyId), isDeleted: false },
      { $push: { documents: docData } },
      { new: true }
    );
  }

  async removeCustomerDocument(id: string, docId: string, companyId: string): Promise<ICustomer | null> {
    return Customer.findOneAndUpdate(
      { _id: id, companyId: new Types.ObjectId(companyId), isDeleted: false },
      { $pull: { documents: { _id: docId } } },
      { new: true }
    );
  }
}

export const customerService = new CustomerService();
