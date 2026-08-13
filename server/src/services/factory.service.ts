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
}

export const factoryService = new FactoryService();
export default factoryService;
