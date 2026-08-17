import { Factory, IFactory, IFactoryLocation } from "../models/Factory";
import { User } from "../models/User";
import { auditService } from "./audit.service";
import { Types } from "mongoose";

export interface CreateFactoryInput {
  name: string;
  code: string;
  location?: IFactoryLocation;
  managerId?: string;
  contactEmail?: string;
  contactPhone?: string;
  capacity?: number;
  status?: "active" | "inactive" | "maintenance" | "closed";
}

export interface UpdateFactoryInput {
  name?: string;
  code?: string;
  location?: IFactoryLocation;
  managerId?: string | null;
  contactEmail?: string;
  contactPhone?: string;
  capacity?: number;
  status?: "active" | "inactive" | "maintenance" | "closed";
}

export interface GetFactoriesOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class FactoryService {
  async createFactory(
    companyId: string,
    userId: string,
    data: CreateFactoryInput
  ): Promise<IFactory> {
    const formattedCode = data.code.trim().toUpperCase();

    // Check if code or name already exists within the company
    const existingCode = await Factory.findOne({
      companyId,
      code: formattedCode,
      isDeleted: false,
    });
    if (existingCode) {
      throw new Error(`Factory with code '${formattedCode}' already exists in your company`);
    }

    const existingName = await Factory.findOne({
      companyId,
      name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
      isDeleted: false,
    });
    if (existingName) {
      throw new Error(`Factory with name '${data.name.trim()}' already exists in your company`);
    }

    // Verify manager user if provided
    if (data.managerId) {
      if (!Types.ObjectId.isValid(data.managerId)) {
        throw new Error("Invalid Manager ID format");
      }
      const managerUser = await User.findOne({
        _id: data.managerId,
        companyId,
        status: "active",
      });
      if (!managerUser) {
        throw new Error("Selected manager user does not exist or is inactive in your company");
      }
    }

    const factory = await Factory.create({
      companyId,
      name: data.name.trim(),
      code: formattedCode,
      location: data.location,
      managerId: data.managerId ? new Types.ObjectId(data.managerId) : undefined,
      contactEmail: data.contactEmail?.trim().toLowerCase(),
      contactPhone: data.contactPhone?.trim(),
      capacity: data.capacity,
      status: data.status || "active",
      createdBy: new Types.ObjectId(userId),
    });

    await auditService.log({
      companyId,
      userId,
      action: "FACTORY_CREATED",
      module: "factories",
      referenceId: factory._id.toString(),
      after: factory.toObject(),
    });

    const populatedFactory = await Factory.findById(factory._id)
      .populate("managerId", "firstName lastName email role")
      .populate("createdBy", "firstName lastName email");

    return populatedFactory || factory;
  }

  async updateFactory(
    factoryId: string,
    companyId: string,
    userId: string,
    data: UpdateFactoryInput
  ): Promise<IFactory> {
    if (!Types.ObjectId.isValid(factoryId)) {
      throw new Error("Invalid Factory ID format");
    }

    const factory = await Factory.findOne({
      _id: factoryId,
      companyId,
      isDeleted: false,
    });

    if (!factory) {
      throw new Error("Factory not found or access denied");
    }

    const beforeState = factory.toObject();

    // Check duplicate code if code is being updated
    if (data.code && data.code.trim().toUpperCase() !== factory.code) {
      const formattedCode = data.code.trim().toUpperCase();
      const existingCode = await Factory.findOne({
        companyId,
        code: formattedCode,
        isDeleted: false,
        _id: { $ne: factoryId },
      });
      if (existingCode) {
        throw new Error(`Factory with code '${formattedCode}' already exists in your company`);
      }
      factory.code = formattedCode;
    }

    // Check duplicate name if name is being updated
    if (data.name && data.name.trim() !== factory.name) {
      const trimmedName = data.name.trim();
      const existingName = await Factory.findOne({
        companyId,
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
        isDeleted: false,
        _id: { $ne: factoryId },
      });
      if (existingName) {
        throw new Error(`Factory with name '${trimmedName}' already exists in your company`);
      }
      factory.name = trimmedName;
    }

    // Manager ID update or clearance
    if (data.managerId !== undefined) {
      if (!data.managerId || data.managerId === "") {
        factory.managerId = undefined;
      } else {
        if (!Types.ObjectId.isValid(data.managerId)) {
          throw new Error("Invalid Manager ID format");
        }
        const managerUser = await User.findOne({
          _id: data.managerId,
          companyId,
          status: "active",
        });
        if (!managerUser) {
          throw new Error("Selected manager user does not exist or is inactive in your company");
        }
        factory.managerId = new Types.ObjectId(data.managerId);
      }
    }

    // Update location details if provided
    if (data.location !== undefined) {
      factory.location = {
        ...factory.location,
        ...data.location,
      };
    }

    // Update remaining optional fields
    if (data.contactEmail !== undefined) {
      factory.contactEmail = data.contactEmail ? data.contactEmail.trim().toLowerCase() : undefined;
    }
    if (data.contactPhone !== undefined) {
      factory.contactPhone = data.contactPhone ? data.contactPhone.trim() : undefined;
    }
    if (data.capacity !== undefined) {
      factory.capacity = data.capacity;
    }
    if (data.status !== undefined) {
      factory.status = data.status;
    }

    await factory.save();

    await auditService.log({
      companyId,
      userId,
      action: "FACTORY_UPDATED",
      module: "factories",
      referenceId: factory._id.toString(),
      before: beforeState,
      after: factory.toObject(),
    });

    const populatedFactory = await Factory.findById(factory._id)
      .populate("managerId", "firstName lastName email role")
      .populate("createdBy", "firstName lastName email");

    return populatedFactory || factory;
  }

  async getFactories(
    companyId: string,
    options: GetFactoriesOptions = {}
  ): Promise<{
    factories: IFactory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(options.page || 1, 1);
    const limit = Math.min(Math.max(options.limit || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filter: any = {
      companyId,
      isDeleted: false,
    };

    if (options.status) {
      filter.status = options.status;
    }

    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { contactEmail: searchRegex },
        { "location.city": searchRegex },
        { "location.state": searchRegex },
        { "location.address": searchRegex },
      ];
    }

    const sortField = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [factories, total] = await Promise.all([
      Factory.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("managerId", "firstName lastName email role")
        .populate("createdBy", "firstName lastName email"),
      Factory.countDocuments(filter),
    ]);

    return {
      factories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFactoryById(factoryId: string, companyId: string): Promise<IFactory | null> {
    if (!Types.ObjectId.isValid(factoryId)) {
      return null;
    }

    return Factory.findOne({
      _id: factoryId,
      companyId,
      isDeleted: false,
    })
      .populate("managerId", "firstName lastName email role phone status")
      .populate("createdBy", "firstName lastName email");
  }

  async deleteFactory(factoryId: string, companyId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(factoryId)) {
      throw new Error("Invalid Factory ID format");
    }

    const factory = await Factory.findOne({
      _id: factoryId,
      companyId,
      isDeleted: false,
    });

    if (!factory) {
      throw new Error("Factory not found or access denied");
    }

    const beforeState = factory.toObject();

    factory.isDeleted = true;
    factory.deletedAt = new Date();
    factory.deletedBy = new Types.ObjectId(userId);
    factory.status = "inactive";

    await factory.save();

    await auditService.log({
      companyId,
      userId,
      action: "FACTORY_DELETED",
      module: "factories",
      referenceId: factory._id.toString(),
      before: beforeState,
      after: factory.toObject(),
    });

    return true;
  }

  async updateFactoryStatus(
    factoryId: string,
    companyId: string,
    userId: string,
    status: "active" | "inactive" | "maintenance" | "closed"
  ): Promise<IFactory> {
    if (!Types.ObjectId.isValid(factoryId)) {
      throw new Error("Invalid Factory ID format");
    }

    const factory = await Factory.findOne({
      _id: factoryId,
      companyId,
      isDeleted: false,
    });

    if (!factory) {
      throw new Error("Factory not found or access denied");
    }

    const beforeState = factory.toObject();

    factory.status = status;
    await factory.save();

    await auditService.log({
      companyId,
      userId,
      action: "FACTORY_STATUS_UPDATED",
      module: "factories",
      referenceId: factory._id.toString(),
      before: beforeState,
      after: factory.toObject(),
    });

    const populatedFactory = await Factory.findById(factory._id)
      .populate("managerId", "firstName lastName email role phone status")
      .populate("createdBy", "firstName lastName email");

    return populatedFactory || factory;
  }
}

export const factoryService = new FactoryService();
export default factoryService;
