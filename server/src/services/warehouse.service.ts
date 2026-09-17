import { Warehouse, IWarehouse, IWarehouseLocation } from "../models/Warehouse";
import { StockTransfer, IStockTransfer, ITransferItem } from "../models/StockTransfer";
import { User } from "../models/User";
import { auditService } from "./audit.service";
import { Types } from "mongoose";

export interface CreateWarehouseInput {
  name: string;
  code: string;
  type?: "raw_material" | "finished_goods" | "distribution" | "cold_storage" | "general";
  description?: string;
  address?: string;
  location?: IWarehouseLocation;
  capacity?: number;
  currentUsage?: number;
  managerId?: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: "active" | "inactive" | "maintenance" | "full" | "closed";
}

export interface UpdateWarehouseInput {
  name?: string;
  code?: string;
  type?: "raw_material" | "finished_goods" | "distribution" | "cold_storage" | "general";
  description?: string;
  address?: string;
  location?: IWarehouseLocation;
  capacity?: number;
  currentUsage?: number;
  managerId?: string | null;
  contactEmail?: string;
  contactPhone?: string;
  status?: "active" | "inactive" | "maintenance" | "full" | "closed";
}

export interface GetWarehousesOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface StockTransferInput {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  items: ITransferItem[];
  notes?: string;
}

export class WarehouseService {
  async createWarehouse(
    companyId: string,
    userId: string,
    data: CreateWarehouseInput
  ): Promise<IWarehouse> {
    const formattedCode = data.code.trim().toUpperCase();

    // Check code uniqueness per company
    const existingCode = await Warehouse.findOne({
      companyId,
      code: formattedCode,
      isDeleted: false,
    });
    if (existingCode) {
      throw new Error(`Warehouse with code '${formattedCode}' already exists in your company`);
    }

    // Check name uniqueness per company
    const existingName = await Warehouse.findOne({
      companyId,
      name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
      isDeleted: false,
    });
    if (existingName) {
      throw new Error(`Warehouse with name '${data.name.trim()}' already exists in your company`);
    }

    // Verify manager if provided
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

    const warehouse = await Warehouse.create({
      companyId,
      name: data.name.trim(),
      code: formattedCode,
      type: data.type || "general",
      description: data.description?.trim(),
      address: data.address?.trim(),
      location: data.location,
      capacity: data.capacity !== undefined ? data.capacity : 0,
      currentUsage: data.currentUsage !== undefined ? data.currentUsage : 0,
      managerId: data.managerId ? new Types.ObjectId(data.managerId) : undefined,
      contactEmail: data.contactEmail?.trim().toLowerCase(),
      contactPhone: data.contactPhone?.trim(),
      status: data.status || "active",
      createdBy: new Types.ObjectId(userId),
    });

    await auditService.log({
      companyId,
      userId,
      action: "WAREHOUSE_CREATED",
      module: "warehouses",
      referenceId: warehouse._id.toString(),
      after: warehouse.toObject(),
    });

    const populatedWarehouse = await Warehouse.findById(warehouse._id)
      .populate("managerId", "firstName lastName email role")
      .populate("createdBy", "firstName lastName email");

    return populatedWarehouse || warehouse;
  }

  async updateWarehouse(
    warehouseId: string,
    companyId: string,
    userId: string,
    data: UpdateWarehouseInput
  ): Promise<IWarehouse> {
    if (!Types.ObjectId.isValid(warehouseId)) {
      throw new Error("Invalid Warehouse ID format");
    }

    const warehouse = await Warehouse.findOne({
      _id: warehouseId,
      companyId,
      isDeleted: false,
    });

    if (!warehouse) {
      throw new Error("Warehouse not found or access denied");
    }

    const beforeState = warehouse.toObject();

    if (data.code && data.code.trim().toUpperCase() !== warehouse.code) {
      const formattedCode = data.code.trim().toUpperCase();
      const existingCode = await Warehouse.findOne({
        companyId,
        code: formattedCode,
        isDeleted: false,
        _id: { $ne: warehouseId },
      });
      if (existingCode) {
        throw new Error(`Warehouse with code '${formattedCode}' already exists in your company`);
      }
      warehouse.code = formattedCode;
    }

    if (data.name && data.name.trim() !== warehouse.name) {
      const trimmedName = data.name.trim();
      const existingName = await Warehouse.findOne({
        companyId,
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
        isDeleted: false,
        _id: { $ne: warehouseId },
      });
      if (existingName) {
        throw new Error(`Warehouse with name '${trimmedName}' already exists in your company`);
      }
      warehouse.name = trimmedName;
    }

    if (data.type !== undefined) {
      warehouse.type = data.type;
    }
    if (data.description !== undefined) {
      warehouse.description = data.description ? data.description.trim() : undefined;
    }
    if (data.address !== undefined) {
      warehouse.address = data.address ? data.address.trim() : undefined;
    }

    if (data.managerId !== undefined) {
      if (!data.managerId || data.managerId === "") {
        warehouse.managerId = undefined;
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
        warehouse.managerId = new Types.ObjectId(data.managerId);
      }
    }

    if (data.location !== undefined) {
      warehouse.location = {
        ...warehouse.location,
        ...data.location,
      };
    }

    if (data.contactEmail !== undefined) {
      warehouse.contactEmail = data.contactEmail ? data.contactEmail.trim().toLowerCase() : undefined;
    }
    if (data.contactPhone !== undefined) {
      warehouse.contactPhone = data.contactPhone ? data.contactPhone.trim() : undefined;
    }
    if (data.capacity !== undefined) {
      warehouse.capacity = data.capacity;
    }
    if (data.currentUsage !== undefined) {
      warehouse.currentUsage = data.currentUsage;
    }
    if (data.status !== undefined) {
      warehouse.status = data.status;
    }

    await warehouse.save();

    await auditService.log({
      companyId,
      userId,
      action: "WAREHOUSE_UPDATED",
      module: "warehouses",
      referenceId: warehouse._id.toString(),
      before: beforeState,
      after: warehouse.toObject(),
    });

    const populatedWarehouse = await Warehouse.findById(warehouse._id)
      .populate("managerId", "firstName lastName email role")
      .populate("createdBy", "firstName lastName email");

    return populatedWarehouse || warehouse;
  }

  async getWarehouses(
    companyId: string,
    options: GetWarehousesOptions = {}
  ): Promise<{
    warehouses: any[];
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

    if (options.type) {
      filter.type = options.type;
    }

    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { address: searchRegex },
        { contactEmail: searchRegex },
        { "location.city": searchRegex },
        { "location.state": searchRegex },
        { "location.address": searchRegex },
      ];
    }

    const sortField = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [warehouses, total] = await Promise.all([
      Warehouse.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("managerId", "firstName lastName email role")
        .populate("createdBy", "firstName lastName email"),
      Warehouse.countDocuments(filter),
    ]);

    const formattedWarehouses = warehouses.map((wh) => {
      const obj = wh.toObject();
      const cap = obj.capacity || 0;
      const usage = obj.currentUsage || 0;
      const availableCapacity = Math.max(0, cap - usage);
      const utilizationPercentage = cap > 0 ? Math.round((usage / cap) * 10000) / 100 : 0;
      return {
        ...obj,
        availableCapacity,
        utilizationPercentage,
      };
    });

    return {
      warehouses: formattedWarehouses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getWarehouseById(warehouseId: string, companyId: string): Promise<any | null> {
    if (!Types.ObjectId.isValid(warehouseId)) {
      return null;
    }

    const warehouse = await Warehouse.findOne({
      _id: warehouseId,
      companyId,
      isDeleted: false,
    })
      .populate("managerId", "firstName lastName email role phone status")
      .populate("createdBy", "firstName lastName email");

    if (!warehouse) {
      return null;
    }

    const obj = warehouse.toObject();
    const cap = obj.capacity || 0;
    const usage = obj.currentUsage || 0;
    const availableCapacity = Math.max(0, cap - usage);
    const utilizationPercentage = cap > 0 ? Math.round((usage / cap) * 10000) / 100 : 0;

    return {
      ...obj,
      availableCapacity,
      utilizationPercentage,
    };
  }

  async deleteWarehouse(warehouseId: string, companyId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(warehouseId)) {
      throw new Error("Invalid Warehouse ID format");
    }

    const warehouse = await Warehouse.findOne({
      _id: warehouseId,
      companyId,
      isDeleted: false,
    });

    if (!warehouse) {
      throw new Error("Warehouse not found or access denied");
    }

    const beforeState = warehouse.toObject();

    warehouse.isDeleted = true;
    warehouse.deletedAt = new Date();
    warehouse.deletedBy = new Types.ObjectId(userId);
    warehouse.status = "inactive";

    await warehouse.save();

    await auditService.log({
      companyId,
      userId,
      action: "WAREHOUSE_DELETED",
      module: "warehouses",
      referenceId: warehouse._id.toString(),
      before: beforeState,
      after: warehouse.toObject(),
    });

    return true;
  }

  async transferStock(
    companyId: string,
    userId: string,
    data: StockTransferInput
  ): Promise<IStockTransfer> {
    const { sourceWarehouseId, destinationWarehouseId, items, notes } = data;

    if (sourceWarehouseId === destinationWarehouseId) {
      throw new Error("Source and destination warehouses cannot be the same");
    }

    if (!Types.ObjectId.isValid(sourceWarehouseId) || !Types.ObjectId.isValid(destinationWarehouseId)) {
      throw new Error("Invalid warehouse ID format");
    }

    const [sourceWh, destWh] = await Promise.all([
      Warehouse.findOne({ _id: sourceWarehouseId, companyId, isDeleted: false }),
      Warehouse.findOne({ _id: destinationWarehouseId, companyId, isDeleted: false }),
    ]);

    if (!sourceWh) {
      throw new Error("Source warehouse not found or access denied");
    }
    if (!destWh) {
      throw new Error("Destination warehouse not found or access denied");
    }

    if (sourceWh.status === "closed" || sourceWh.status === "inactive") {
      throw new Error(`Source warehouse '${sourceWh.name}' is ${sourceWh.status}`);
    }
    if (destWh.status === "closed" || destWh.status === "inactive") {
      throw new Error(`Destination warehouse '${destWh.name}' is ${destWh.status}`);
    }

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    // Validate capacity if destination warehouse has capacity set
    if (destWh.capacity > 0) {
      const projectedUsage = destWh.currentUsage + totalQuantity;
      if (projectedUsage > destWh.capacity) {
        throw new Error(
          `Stock transfer exceeds capacity for destination warehouse '${destWh.name}'. Current: ${destWh.currentUsage}, Transfer: ${totalQuantity}, Capacity: ${destWh.capacity}`
        );
      }
    }

    // Deduct usage from source warehouse and add to destination warehouse
    sourceWh.currentUsage = Math.max(0, sourceWh.currentUsage - totalQuantity);
    destWh.currentUsage = destWh.currentUsage + totalQuantity;

    // Auto-update status if destWh is now full
    if (destWh.capacity > 0 && destWh.currentUsage >= destWh.capacity) {
      destWh.status = "full";
    }

    await Promise.all([sourceWh.save(), destWh.save()]);

    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const transferNumber = `TRF-${timestamp}-${randomSuffix}`;

    const transfer = await StockTransfer.create({
      companyId,
      transferNumber,
      sourceWarehouseId: new Types.ObjectId(sourceWarehouseId),
      destinationWarehouseId: new Types.ObjectId(destinationWarehouseId),
      items,
      totalQuantity,
      transferDate: new Date(),
      status: "completed",
      notes: notes?.trim(),
      createdBy: new Types.ObjectId(userId),
    });

    await auditService.log({
      companyId,
      userId,
      action: "STOCK_TRANSFER_EXECUTED",
      module: "warehouses",
      referenceId: transfer._id.toString(),
      after: transfer.toObject(),
    });

    const populatedTransfer = await StockTransfer.findById(transfer._id)
      .populate("sourceWarehouseId", "name code type")
      .populate("destinationWarehouseId", "name code type")
      .populate("createdBy", "firstName lastName email");

    return populatedTransfer || transfer;
  }
}

export const warehouseService = new WarehouseService();
export default warehouseService;
