import { Inventory, IInventory, ItemCategoryType, InventoryStatusType } from "../models/Inventory";
import { StockMovement, IStockMovement } from "../models/StockMovement";
import { StockAdjustment, IStockAdjustment } from "../models/StockAdjustment";
import { LowStockAlert, ILowStockAlert } from "../models/LowStockAlert";
import { StockTransfer } from "../models/StockTransfer";
import { Warehouse } from "../models/Warehouse";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";
import { logger } from "../config/logger";
import { Types } from "mongoose";

export interface StockInInput {
  warehouseId: string;
  productId?: string;
  sku: string;
  itemName: string;
  itemCategory?: ItemCategoryType;
  quantity: number;
  unit?: string;
  unitCost?: number;
  minThreshold?: number;
  maxThreshold?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  locationInWarehouse?: string;
  referenceNumber?: string;
  reason?: string;
  notes?: string;
}

export interface StockOutInput {
  warehouseId: string;
  productId?: string;
  sku: string;
  itemName?: string;
  itemCategory?: ItemCategoryType;
  quantity: number;
  unit?: string;
  referenceNumber?: string;
  reason?: string;
  notes?: string;
}

export interface TransferItemInput {
  sku: string;
  itemName: string;
  quantity: number;
  unit?: string;
}

export interface StockTransferInput {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  items: TransferItemInput[];
  referenceNumber?: string;
  notes?: string;
}

export interface StockAdjustmentInput {
  warehouseId: string;
  sku: string;
  itemName: string;
  newQuantity: number;
  unitCost?: number;
  reason: string;
  notes?: string;
}

export interface InventoryQueryParams {
  search?: string;
  type?: string;
  itemCategory?: string;
  warehouseId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class InventoryService {
  /**
   * Helper to evaluate inventory status based on stock level thresholds
   */
  private calculateStatus(quantity: number, minThreshold: number, maxThreshold: number): InventoryStatusType {
    if (quantity <= 0) return "out_of_stock";
    if (quantity <= minThreshold) return "low_stock";
    if (maxThreshold > 0 && quantity > maxThreshold) return "overstocked";
    return "in_stock";
  }

  /**
   * Helper to check and maintain low stock alert records and send notification
   */
  private async syncLowStockAlert(
    companyId: string,
    userId: string,
    inventory: IInventory
  ): Promise<ILowStockAlert | null> {
    if (inventory.quantity <= inventory.minThreshold) {
      const severity = inventory.quantity === 0 ? "critical" : "warning";
      
      let alert = await LowStockAlert.findOne({
        companyId,
        inventoryId: inventory._id,
        status: { $in: ["active", "acknowledged"] },
      });

      if (alert) {
        alert.currentQuantity = inventory.quantity;
        alert.minThreshold = inventory.minThreshold;
        alert.severity = severity;
        alert.status = "active"; // Re-trigger active if updated
        await alert.save();
      } else {
        alert = await LowStockAlert.create({
          companyId,
          inventoryId: inventory._id,
          sku: inventory.sku,
          itemName: inventory.itemName,
          itemCategory: inventory.itemCategory,
          warehouseId: inventory.warehouseId,
          currentQuantity: inventory.quantity,
          minThreshold: inventory.minThreshold,
          severity,
          status: "active",
          triggeredAt: new Date(),
        });

        // Trigger notification
        try {
          await notificationService.createNotification(
            companyId,
            userId,
            `Low Stock Warning: ${inventory.itemName} (${inventory.sku})`,
            `Stock quantity for ${inventory.itemName} is ${inventory.quantity} ${inventory.unit}, which is at or below the minimum threshold of ${inventory.minThreshold}.`,
            "low_stock"
          );
        } catch (notifErr: any) {
          logger.warn(`Failed to dispatch low stock notification: ${notifErr.message}`);
        }
      }
      return alert;
    } else {
      // Resolve any active alerts for this item
      await LowStockAlert.updateMany(
        { companyId, inventoryId: inventory._id, status: { $in: ["active", "acknowledged"] } },
        { status: "resolved", resolvedAt: new Date() }
      );
      return null;
    }
  }

  /**
   * Record Stock In (Receiving Inventory)
   */
  async stockIn(companyId: string, userId: string, input: StockInInput) {
    const warehouse = await Warehouse.findOne({ _id: input.warehouseId, companyId, isDeleted: { $ne: true } });
    if (!warehouse) {
      throw new Error("Warehouse location not found");
    }

    const qty = Number(input.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error("Quantity must be a positive number");
    }

    const uppercaseSku = input.sku.trim().toUpperCase();

    let inventory = await Inventory.findOne({
      companyId,
      warehouseId: input.warehouseId,
      sku: uppercaseSku,
    });

    if (inventory) {
      inventory.quantity += qty;
      inventory.itemName = input.itemName.trim();
      if (input.itemCategory) inventory.itemCategory = input.itemCategory;
      if (input.unitCost !== undefined) inventory.unitCost = Number(input.unitCost);
      if (input.minThreshold !== undefined) inventory.minThreshold = Number(input.minThreshold);
      if (input.maxThreshold !== undefined) inventory.maxThreshold = Number(input.maxThreshold);
      if (input.locationInWarehouse) inventory.locationInWarehouse = input.locationInWarehouse.trim();
      inventory.totalValue = Number((inventory.quantity * inventory.unitCost).toFixed(2));
      inventory.status = this.calculateStatus(inventory.quantity, inventory.minThreshold, inventory.maxThreshold);
      await inventory.save();
    } else {
      const unitCost = Number(input.unitCost || 0);
      const minThreshold = Number(input.minThreshold ?? 10);
      const maxThreshold = Number(input.maxThreshold ?? 1000);
      inventory = await Inventory.create({
        companyId,
        warehouseId: input.warehouseId,
        productId: input.productId ? new Types.ObjectId(input.productId) : undefined,
        sku: uppercaseSku,
        itemName: input.itemName.trim(),
        itemCategory: input.itemCategory || "finished_goods",
        quantity: qty,
        unit: input.unit || "units",
        unitCost,
        totalValue: Number((qty * unitCost).toFixed(2)),
        minThreshold,
        maxThreshold,
        reorderPoint: Number(input.reorderPoint ?? 20),
        reorderQuantity: Number(input.reorderQuantity ?? 50),
        locationInWarehouse: input.locationInWarehouse?.trim(),
        status: this.calculateStatus(qty, minThreshold, maxThreshold),
      });
    }

    const refNo = input.referenceNumber?.trim() || `STK-IN-${Date.now().toString().slice(-6)}`;
    const totalVal = Number((qty * inventory.unitCost).toFixed(2));

    const movement = await StockMovement.create({
      companyId,
      warehouseId: input.warehouseId,
      inventoryId: inventory._id,
      productId: inventory.productId,
      sku: inventory.sku,
      itemName: inventory.itemName,
      type: "stock_in",
      itemCategory: inventory.itemCategory,
      quantity: qty,
      unit: inventory.unit,
      unitCost: inventory.unitCost,
      totalValue: totalVal,
      referenceNumber: refNo,
      reason: input.reason || "Inventory Stock In",
      notes: input.notes,
      performedBy: userId,
    });

    await this.syncLowStockAlert(companyId, userId, inventory);

    // Immutable Audit Log entry
    await auditService.log({
      companyId,
      userId,
      action: "STOCK_IN",
      module: "inventory",
      referenceId: movement._id.toString(),
      after: {
        sku: inventory.sku,
        quantityAdded: qty,
        newQuantity: inventory.quantity,
        warehouseId: input.warehouseId,
        referenceNumber: refNo,
      },
    });

    logger.info(`[Stock In] ${qty} ${inventory.unit} added for SKU ${inventory.sku} at Warehouse ${input.warehouseId}`);

    return {
      success: true,
      message: "Stock in recorded successfully",
      inventory,
      movement,
    };
  }

  /**
   * Record Stock Out (Dispatching Inventory)
   */
  async stockOut(companyId: string, userId: string, input: StockOutInput) {
    const warehouse = await Warehouse.findOne({ _id: input.warehouseId, companyId, isDeleted: { $ne: true } });
    if (!warehouse) {
      throw new Error("Warehouse location not found");
    }

    const qty = Number(input.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error("Quantity must be a positive number");
    }

    const uppercaseSku = input.sku.trim().toUpperCase();

    const inventory = await Inventory.findOne({
      companyId,
      warehouseId: input.warehouseId,
      sku: uppercaseSku,
    });

    if (!inventory) {
      throw new Error(`Item with SKU ${uppercaseSku} does not exist in selected warehouse`);
    }

    if (inventory.quantity < qty) {
      throw new Error(`Insufficient stock available. Current stock: ${inventory.quantity} ${inventory.unit}, requested: ${qty}`);
    }

    inventory.quantity -= qty;
    inventory.totalValue = Number((inventory.quantity * inventory.unitCost).toFixed(2));
    inventory.status = this.calculateStatus(inventory.quantity, inventory.minThreshold, inventory.maxThreshold);
    await inventory.save();

    const refNo = input.referenceNumber?.trim() || `STK-OUT-${Date.now().toString().slice(-6)}`;
    const totalVal = Number((qty * inventory.unitCost).toFixed(2));

    const movement = await StockMovement.create({
      companyId,
      warehouseId: input.warehouseId,
      inventoryId: inventory._id,
      productId: inventory.productId,
      sku: inventory.sku,
      itemName: inventory.itemName,
      type: "stock_out",
      itemCategory: inventory.itemCategory,
      quantity: qty,
      unit: inventory.unit,
      unitCost: inventory.unitCost,
      totalValue: totalVal,
      referenceNumber: refNo,
      reason: input.reason || "Inventory Stock Out",
      notes: input.notes,
      performedBy: userId,
    });

    await this.syncLowStockAlert(companyId, userId, inventory);

    // Immutable Audit Log entry
    await auditService.log({
      companyId,
      userId,
      action: "STOCK_OUT",
      module: "inventory",
      referenceId: movement._id.toString(),
      after: {
        sku: inventory.sku,
        quantityRemoved: qty,
        remainingQuantity: inventory.quantity,
        warehouseId: input.warehouseId,
        referenceNumber: refNo,
      },
    });

    logger.info(`[Stock Out] ${qty} ${inventory.unit} issued for SKU ${inventory.sku} from Warehouse ${input.warehouseId}`);

    return {
      success: true,
      message: "Stock out recorded successfully",
      inventory,
      movement,
    };
  }

  /**
   * Record Stock Transfer between Warehouses
   */
  async transfer(companyId: string, userId: string, input: StockTransferInput) {
    if (input.sourceWarehouseId === input.destinationWarehouseId) {
      throw new Error("Source and destination warehouses cannot be the same");
    }

    const [sourceWarehouse, destWarehouse] = await Promise.all([
      Warehouse.findOne({ _id: input.sourceWarehouseId, companyId, isDeleted: { $ne: true } }),
      Warehouse.findOne({ _id: input.destinationWarehouseId, companyId, isDeleted: { $ne: true } }),
    ]);

    if (!sourceWarehouse) throw new Error("Source warehouse not found");
    if (!destWarehouse) throw new Error("Destination warehouse not found");

    if (!input.items || input.items.length === 0) {
      throw new Error("Transfer must include at least one item");
    }

    const transferRef = input.referenceNumber?.trim() || `TRF-${Date.now().toString().slice(-6)}`;
    const createdMovements: IStockMovement[] = [];
    const updatedInventories: IInventory[] = [];

    // Verify all items have enough stock first
    for (const item of input.items) {
      const sku = item.sku.trim().toUpperCase();
      const qty = Number(item.quantity);

      if (isNaN(qty) || qty <= 0) {
        throw new Error(`Invalid transfer quantity for item ${sku}`);
      }

      const sourceInv = await Inventory.findOne({
        companyId,
        warehouseId: input.sourceWarehouseId,
        sku,
      });

      if (!sourceInv || sourceInv.quantity < qty) {
        throw new Error(`Insufficient stock for SKU ${sku} at source warehouse ${sourceWarehouse.name}. Available: ${sourceInv?.quantity || 0}`);
      }
    }

    let totalTransferQuantity = 0;

    for (const item of input.items) {
      const sku = item.sku.trim().toUpperCase();
      const qty = Number(item.quantity);
      totalTransferQuantity += qty;

      // 1. Deduct from Source Inventory
      const sourceInv = await Inventory.findOne({
        companyId,
        warehouseId: input.sourceWarehouseId,
        sku,
      })!;

      sourceInv!.quantity -= qty;
      sourceInv!.totalValue = Number((sourceInv!.quantity * sourceInv!.unitCost).toFixed(2));
      sourceInv!.status = this.calculateStatus(sourceInv!.quantity, sourceInv!.minThreshold, sourceInv!.maxThreshold);
      await sourceInv!.save();
      updatedInventories.push(sourceInv!);
      await this.syncLowStockAlert(companyId, userId, sourceInv!);

      // 2. Add to Destination Inventory
      let destInv = await Inventory.findOne({
        companyId,
        warehouseId: input.destinationWarehouseId,
        sku,
      });

      if (destInv) {
        destInv.quantity += qty;
        destInv.totalValue = Number((destInv.quantity * destInv.unitCost).toFixed(2));
        destInv.status = this.calculateStatus(destInv.quantity, destInv.minThreshold, destInv.maxThreshold);
        await destInv.save();
      } else {
        destInv = await Inventory.create({
          companyId,
          warehouseId: input.destinationWarehouseId,
          productId: sourceInv!.productId,
          sku,
          itemName: sourceInv!.itemName,
          itemCategory: sourceInv!.itemCategory,
          quantity: qty,
          unit: sourceInv!.unit,
          unitCost: sourceInv!.unitCost,
          totalValue: Number((qty * sourceInv!.unitCost).toFixed(2)),
          minThreshold: sourceInv!.minThreshold,
          maxThreshold: sourceInv!.maxThreshold,
          reorderPoint: sourceInv!.reorderPoint,
          reorderQuantity: sourceInv!.reorderQuantity,
          status: this.calculateStatus(qty, sourceInv!.minThreshold, sourceInv!.maxThreshold),
        });
      }
      updatedInventories.push(destInv);
      await this.syncLowStockAlert(companyId, userId, destInv);

      // 3. Create Movement record
      const movement = await StockMovement.create({
        companyId,
        warehouseId: input.sourceWarehouseId,
        destinationWarehouseId: input.destinationWarehouseId,
        inventoryId: sourceInv!._id,
        productId: sourceInv!.productId,
        sku,
        itemName: sourceInv!.itemName,
        type: "transfer",
        itemCategory: sourceInv!.itemCategory,
        quantity: qty,
        unit: sourceInv!.unit,
        unitCost: sourceInv!.unitCost,
        totalValue: Number((qty * sourceInv!.unitCost).toFixed(2)),
        referenceNumber: transferRef,
        reason: `Transferred from ${sourceWarehouse.name} to ${destWarehouse.name}`,
        notes: input.notes,
        performedBy: userId,
      });

      createdMovements.push(movement);
    }

    // Record StockTransfer document
    const stockTransferDoc = await StockTransfer.create({
      companyId,
      transferNumber: transferRef,
      sourceWarehouseId: input.sourceWarehouseId,
      destinationWarehouseId: input.destinationWarehouseId,
      items: input.items.map((i) => ({
        itemCode: i.sku.trim().toUpperCase(),
        itemName: i.itemName.trim(),
        quantity: i.quantity,
        unit: i.unit || "units",
      })),
      totalQuantity: totalTransferQuantity,
      status: "completed",
      notes: input.notes,
      createdBy: userId,
    });

    // Immutable Audit Log
    await auditService.log({
      companyId,
      userId,
      action: "STOCK_TRANSFER",
      module: "inventory",
      referenceId: stockTransferDoc._id.toString(),
      after: {
        transferNumber: transferRef,
        sourceWarehouse: sourceWarehouse.name,
        destinationWarehouse: destWarehouse.name,
        itemCount: input.items.length,
        totalQuantity: totalTransferQuantity,
      },
    });

    logger.info(`[Stock Transfer] ${totalTransferQuantity} items transferred from ${sourceWarehouse.name} to ${destWarehouse.name} (Ref: ${transferRef})`);

    return {
      success: true,
      message: "Stock transfer completed successfully",
      transfer: stockTransferDoc,
      movements: createdMovements,
    };
  }

  /**
   * Record Stock Adjustment (Inventory Audit / Correction)
   */
  async adjust(companyId: string, userId: string, input: StockAdjustmentInput) {
    const warehouse = await Warehouse.findOne({ _id: input.warehouseId, companyId, isDeleted: { $ne: true } });
    if (!warehouse) {
      throw new Error("Warehouse location not found");
    }

    const newQty = Number(input.newQuantity);
    if (isNaN(newQty) || newQty < 0) {
      throw new Error("New quantity cannot be negative");
    }

    const uppercaseSku = input.sku.trim().toUpperCase();

    let inventory = await Inventory.findOne({
      companyId,
      warehouseId: input.warehouseId,
      sku: uppercaseSku,
    });

    const previousQty = inventory ? inventory.quantity : 0;
    const diffQty = newQty - previousQty;

    if (inventory) {
      inventory.quantity = newQty;
      inventory.itemName = input.itemName.trim();
      if (input.unitCost !== undefined) inventory.unitCost = Number(input.unitCost);
      inventory.totalValue = Number((newQty * inventory.unitCost).toFixed(2));
      inventory.status = this.calculateStatus(newQty, inventory.minThreshold, inventory.maxThreshold);
      await inventory.save();
    } else {
      const unitCost = Number(input.unitCost || 0);
      inventory = await Inventory.create({
        companyId,
        warehouseId: input.warehouseId,
        sku: uppercaseSku,
        itemName: input.itemName.trim(),
        itemCategory: "finished_goods",
        quantity: newQty,
        unit: "units",
        unitCost,
        totalValue: Number((newQty * unitCost).toFixed(2)),
        minThreshold: 10,
        maxThreshold: 1000,
        status: this.calculateStatus(newQty, 10, 1000),
      });
    }

    const refNo = `ADJ-${Date.now().toString().slice(-6)}`;
    const totalAdjValue = Number((Math.abs(diffQty) * inventory.unitCost).toFixed(2));

    const adjustment = await StockAdjustment.create({
      companyId,
      warehouseId: input.warehouseId,
      inventoryId: inventory._id,
      sku: inventory.sku,
      itemName: inventory.itemName,
      previousQuantity: previousQty,
      newQuantity: newQty,
      differenceQuantity: diffQty,
      unitCost: inventory.unitCost,
      totalAdjustmentValue: totalAdjValue,
      reason: input.reason,
      referenceNumber: refNo,
      notes: input.notes,
      performedBy: userId,
    });

    const movement = await StockMovement.create({
      companyId,
      warehouseId: input.warehouseId,
      inventoryId: inventory._id,
      productId: inventory.productId,
      sku: inventory.sku,
      itemName: inventory.itemName,
      type: "adjustment",
      itemCategory: inventory.itemCategory,
      quantity: Math.abs(diffQty),
      unit: inventory.unit,
      unitCost: inventory.unitCost,
      totalValue: totalAdjValue,
      referenceNumber: refNo,
      reason: `Stock Adjustment: ${input.reason} (${diffQty >= 0 ? '+' : ''}${diffQty})`,
      notes: input.notes,
      performedBy: userId,
    });

    await this.syncLowStockAlert(companyId, userId, inventory);

    // Immutable Audit Log
    await auditService.log({
      companyId,
      userId,
      action: "STOCK_ADJUSTMENT",
      module: "inventory",
      referenceId: adjustment._id.toString(),
      after: {
        sku: inventory.sku,
        previousQuantity: previousQty,
        newQuantity: newQty,
        difference: diffQty,
        reason: input.reason,
      },
    });

    logger.info(`[Stock Adjustment] SKU ${inventory.sku} adjusted from ${previousQty} to ${newQty} (Diff: ${diffQty})`);

    return {
      success: true,
      message: "Stock adjustment recorded successfully",
      inventory,
      adjustment,
      movement,
    };
  }

  /**
   * Get Stock Movement History with filters & pagination
   */
  async getHistory(companyId: string, params: InventoryQueryParams = {}) {
    const query: any = { companyId };

    if (params.type && params.type !== "ALL") {
      query.type = params.type;
    }
    if (params.itemCategory && params.itemCategory !== "ALL") {
      query.itemCategory = params.itemCategory;
    }
    if (params.warehouseId && params.warehouseId !== "ALL") {
      query.warehouseId = params.warehouseId;
    }

    if (params.startDate || params.endDate) {
      query.createdAt = {};
      if (params.startDate) query.createdAt.$gte = new Date(params.startDate);
      if (params.endDate) query.createdAt.$lte = new Date(params.endDate);
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      const regex = new RegExp(q, "i");
      query.$or = [
        { sku: regex },
        { itemName: regex },
        { referenceNumber: regex },
        { reason: regex },
      ];
    }

    const page = Math.max(Number(params.page || 1), 1);
    const limit = Math.max(Number(params.limit || 15), 1);
    const skip = (page - 1) * limit;

    const [data, total, allMovements] = await Promise.all([
      StockMovement.find(query)
        .populate("warehouseId", "name code location")
        .populate("destinationWarehouseId", "name code location")
        .populate("performedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      StockMovement.countDocuments(query),
      StockMovement.find({ companyId }),
    ]);

    const totalStockInQty = allMovements.filter((m) => m.type === "stock_in").reduce((acc, m) => acc + m.quantity, 0);
    const totalStockOutQty = allMovements.filter((m) => m.type === "stock_out").reduce((acc, m) => acc + m.quantity, 0);
    const totalValuation = allMovements.reduce((acc, m) => acc + (m.totalValue || 0), 0);

    return {
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        totalMovements: total,
        totalStockInQty,
        totalStockOutQty,
        totalValuation,
        rawMaterialMovements: allMovements.filter((m) => m.itemCategory === "raw_material").length,
        finishedGoodsMovements: allMovements.filter((m) => m.itemCategory === "finished_goods").length,
      },
    };
  }

  /**
   * Get Raw Material Stock items
   */
  async getRawMaterials(companyId: string, params: InventoryQueryParams = {}) {
    const query: any = { companyId, itemCategory: "raw_material" };

    if (params.warehouseId && params.warehouseId !== "ALL") query.warehouseId = params.warehouseId;
    if (params.status && params.status !== "ALL") query.status = params.status;

    if (params.search && params.search.trim()) {
      const regex = new RegExp(params.search.trim(), "i");
      query.$or = [{ sku: regex }, { itemName: regex }, { locationInWarehouse: regex }];
    }

    const page = Math.max(Number(params.page || 1), 1);
    const limit = Math.max(Number(params.limit || 15), 1);
    const skip = (page - 1) * limit;

    const [items, total, allRawMaterials] = await Promise.all([
      Inventory.find(query)
        .populate("warehouseId", "name code location")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Inventory.countDocuments(query),
      Inventory.find({ companyId, itemCategory: "raw_material" }),
    ]);

    const totalQuantity = allRawMaterials.reduce((acc, i) => acc + i.quantity, 0);
    const totalValuation = allRawMaterials.reduce((acc, i) => acc + i.totalValue, 0);
    const lowStockCount = allRawMaterials.filter((i) => i.quantity <= i.minThreshold).length;

    return {
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalItems: total,
        totalQuantity,
        totalValuation,
        lowStockCount,
      },
    };
  }

  /**
   * Get Finished Goods Stock items
   */
  async getFinishedGoods(companyId: string, params: InventoryQueryParams = {}) {
    const query: any = { companyId, itemCategory: "finished_goods" };

    if (params.warehouseId && params.warehouseId !== "ALL") query.warehouseId = params.warehouseId;
    if (params.status && params.status !== "ALL") query.status = params.status;

    if (params.search && params.search.trim()) {
      const regex = new RegExp(params.search.trim(), "i");
      query.$or = [{ sku: regex }, { itemName: regex }, { locationInWarehouse: regex }];
    }

    const page = Math.max(Number(params.page || 1), 1);
    const limit = Math.max(Number(params.limit || 15), 1);
    const skip = (page - 1) * limit;

    const [items, total, allFinishedGoods] = await Promise.all([
      Inventory.find(query)
        .populate("warehouseId", "name code location")
        .populate("productId", "name sku price category")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Inventory.countDocuments(query),
      Inventory.find({ companyId, itemCategory: "finished_goods" }),
    ]);

    const totalQuantity = allFinishedGoods.reduce((acc, i) => acc + i.quantity, 0);
    const totalValuation = allFinishedGoods.reduce((acc, i) => acc + i.totalValue, 0);
    const lowStockCount = allFinishedGoods.filter((i) => i.quantity <= i.minThreshold).length;

    return {
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalItems: total,
        totalQuantity,
        totalValuation,
        lowStockCount,
      },
    };
  }

  /**
   * Get Low Stock Alerts & Trigger Service Check
   */
  async getLowStockAlerts(companyId: string, params: InventoryQueryParams = {}) {
    // 1. Conduct automatic check of inventory table
    const lowStockInventories = await Inventory.find({
      companyId,
      $expr: { $lte: ["$quantity", "$minThreshold"] },
    }).populate("warehouseId", "name code location");

    for (const inv of lowStockInventories) {
      const severity = inv.quantity === 0 ? "critical" : "warning";
      const existingAlert = await LowStockAlert.findOne({
        companyId,
        inventoryId: inv._id,
        status: { $in: ["active", "acknowledged"] },
      });

      if (existingAlert) {
        existingAlert.currentQuantity = inv.quantity;
        existingAlert.minThreshold = inv.minThreshold;
        existingAlert.severity = severity;
        await existingAlert.save();
      } else {
        await LowStockAlert.create({
          companyId,
          inventoryId: inv._id,
          sku: inv.sku,
          itemName: inv.itemName,
          itemCategory: inv.itemCategory,
          warehouseId: inv.warehouseId._id,
          currentQuantity: inv.quantity,
          minThreshold: inv.minThreshold,
          severity,
          status: "active",
          triggeredAt: new Date(),
        });
      }
    }

    // 2. Query alerts
    const statusFilter = params.status && params.status !== "ALL" ? params.status : "active";
    const alerts = await LowStockAlert.find({ companyId, status: statusFilter })
      .populate("inventoryId")
      .populate("warehouseId", "name code location")
      .populate("acknowledgedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    const criticalCount = alerts.filter((a) => a.severity === "critical").length;
    const warningCount = alerts.filter((a) => a.severity === "warning").length;

    return {
      success: true,
      count: alerts.length,
      summary: {
        totalActiveAlerts: alerts.length,
        criticalCount,
        warningCount,
      },
      data: alerts,
    };
  }

  /**
   * Get Consolidated Inventory Reports
   */
  async getReports(companyId: string) {
    const [inventories, movements, alerts] = await Promise.all([
      Inventory.find({ companyId }).populate("warehouseId", "name code location"),
      StockMovement.find({ companyId }).sort({ createdAt: -1 }).limit(10),
      LowStockAlert.find({ companyId, status: "active" }).populate("warehouseId", "name code"),
    ]);

    const totalSKUs = inventories.length;
    const totalInventoryValue = inventories.reduce((sum, item) => sum + item.totalValue, 0);

    const rawMaterials = inventories.filter((i) => i.itemCategory === "raw_material");
    const finishedGoods = inventories.filter((i) => i.itemCategory === "finished_goods");
    const packaging = inventories.filter((i) => i.itemCategory === "packaging");
    const components = inventories.filter((i) => i.itemCategory === "components");

    const outOfStockCount = inventories.filter((i) => i.quantity === 0).length;
    const lowStockCount = inventories.filter((i) => i.quantity > 0 && i.quantity <= i.minThreshold).length;
    const inStockCount = inventories.filter((i) => i.quantity > i.minThreshold).length;

    return {
      success: true,
      reportDate: new Date().toISOString(),
      summary: {
        totalSKUs,
        totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
        inStockCount,
        lowStockCount,
        outOfStockCount,
      },
      categoryBreakdown: {
        rawMaterials: {
          count: rawMaterials.length,
          value: Number(rawMaterials.reduce((acc, i) => acc + i.totalValue, 0).toFixed(2)),
        },
        finishedGoods: {
          count: finishedGoods.length,
          value: Number(finishedGoods.reduce((acc, i) => acc + i.totalValue, 0).toFixed(2)),
        },
        packaging: {
          count: packaging.length,
          value: Number(packaging.reduce((acc, i) => acc + i.totalValue, 0).toFixed(2)),
        },
        components: {
          count: components.length,
          value: Number(components.reduce((acc, i) => acc + i.totalValue, 0).toFixed(2)),
        },
      },
      activeLowStockAlerts: alerts,
      recentMovements: movements,
    };
  }

  /**
   * Legacy Helper method for backward compatibility
   */
  async getMovements(companyId: string, params: InventoryQueryParams = {}) {
    return this.getHistory(companyId, params);
  }

  /**
   * Legacy Helper method for backward compatibility
   */
  async getStockLevels(companyId: string) {
    const rawResult = await this.getRawMaterials(companyId, { limit: 100 });
    const fgResult = await this.getFinishedGoods(companyId, { limit: 100 });
    const allInventories = await Inventory.find({ companyId });

    return {
      success: true,
      stockItems: allInventories,
      rawMaterials: rawResult.data,
      finishedGoods: fgResult.data,
      summary: {
        totalSKUs: allInventories.length,
        rawMaterialSKUs: rawResult.summary.totalItems,
        finishedGoodsSKUs: fgResult.summary.totalItems,
        totalInventoryValue: allInventories.reduce((sum, item) => sum + item.totalValue, 0),
      },
    };
  }

  /**
   * Legacy Record movement fallback
   */
  async recordMovement(companyId: string, userId: string, input: any) {
    if (input.type === "stock_in") {
      const res = await this.stockIn(companyId, userId, input);
      return res.movement;
    } else if (input.type === "stock_out") {
      const res = await this.stockOut(companyId, userId, input);
      return res.movement;
    } else if (input.type === "adjustment") {
      const res = await this.adjust(companyId, userId, {
        warehouseId: input.warehouseId,
        sku: input.sku,
        itemName: input.itemName,
        newQuantity: input.quantity,
        unitCost: input.unitCost,
        reason: input.reason || "Manual Adjustment",
        notes: input.notes,
      });
      return res.movement;
    } else {
      throw new Error(`Unsupported movement type: ${input.type}`);
    }
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
