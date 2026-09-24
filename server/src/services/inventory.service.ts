import { StockMovement, IStockMovement } from "../models/StockMovement";
import { Warehouse } from "../models/Warehouse";
import { Types } from "mongoose";

export interface CreateStockMovementInput {
  warehouseId: string;
  productId?: string;
  sku: string;
  itemName: string;
  type: "stock_in" | "stock_out" | "adjustment" | "transfer";
  itemCategory?: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
  quantity: number;
  unit?: string;
  unitCost?: number;
  referenceNumber?: string;
  reason?: string;
  notes?: string;
}

export interface InventoryFilterParams {
  search?: string;
  type?: string;
  itemCategory?: string;
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class InventoryService {
  /**
   * Record a new stock movement (Stock In, Stock Out, Stock Adjustment)
   */
  async recordMovement(
    companyId: string,
    userId: string,
    input: CreateStockMovementInput
  ): Promise<IStockMovement> {
    const warehouse = await Warehouse.findOne({ _id: input.warehouseId, companyId, isDeleted: { $ne: true } });
    if (!warehouse) {
      throw new Error("Warehouse location not found");
    }

    const qty = Number(input.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error("Quantity must be a positive number");
    }

    const unitCost = Number(input.unitCost || 0);
    const totalValue = Number((qty * unitCost).toFixed(2));

    const movement = await StockMovement.create({
      companyId,
      warehouseId: input.warehouseId,
      productId: input.productId ? input.productId : undefined,
      sku: input.sku.trim().toUpperCase(),
      itemName: input.itemName.trim(),
      type: input.type,
      itemCategory: input.itemCategory || "finished_goods",
      quantity: qty,
      unit: input.unit || "units",
      unitCost,
      totalValue,
      referenceNumber: input.referenceNumber ? input.referenceNumber.trim() : `REF-${Date.now().toString().slice(-6)}`,
      reason: input.reason,
      notes: input.notes,
      performedBy: userId,
    });

    return movement;
  }

  /**
   * Get filtered stock movements & audit log
   */
  async getMovements(companyId: string, params: InventoryFilterParams = {}) {
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
        .populate("performedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      StockMovement.countDocuments(query),
      StockMovement.find({ companyId }),
    ]);

    const totalStockInQty = allMovements
      .filter((m) => m.type === "stock_in")
      .reduce((acc, m) => acc + m.quantity, 0);

    const totalStockOutQty = allMovements
      .filter((m) => m.type === "stock_out")
      .reduce((acc, m) => acc + m.quantity, 0);

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
   * Get current inventory stock levels breakdown (raw materials vs finished goods)
   */
  async getStockLevels(companyId: string) {
    const movements = await StockMovement.find({ companyId });

    // Aggregate by SKU and Warehouse
    const stockMap: Record<string, {
      sku: string;
      itemName: string;
      itemCategory: string;
      unit: string;
      stockIn: number;
      stockOut: number;
      currentStock: number;
      unitCost: number;
      totalValue: number;
    }> = {};

    movements.forEach((m) => {
      const key = m.sku;
      if (!stockMap[key]) {
        stockMap[key] = {
          sku: m.sku,
          itemName: m.itemName,
          itemCategory: m.itemCategory,
          unit: m.unit,
          stockIn: 0,
          stockOut: 0,
          currentStock: 0,
          unitCost: m.unitCost || 0,
          totalValue: 0,
        };
      }

      if (m.type === "stock_in") {
        stockMap[key].stockIn += m.quantity;
        stockMap[key].currentStock += m.quantity;
      } else if (m.type === "stock_out") {
        stockMap[key].stockOut += m.quantity;
        stockMap[key].currentStock -= m.quantity;
      } else if (m.type === "adjustment") {
        stockMap[key].currentStock += m.quantity;
      }

      stockMap[key].totalValue = Math.max(0, stockMap[key].currentStock * stockMap[key].unitCost);
    });

    const stockItems = Object.values(stockMap);

    const rawMaterials = stockItems.filter((i) => i.itemCategory === "raw_material");
    const finishedGoods = stockItems.filter((i) => i.itemCategory === "finished_goods");

    return {
      success: true,
      stockItems,
      rawMaterials,
      finishedGoods,
      summary: {
        totalSKUs: stockItems.length,
        rawMaterialSKUs: rawMaterials.length,
        finishedGoodsSKUs: finishedGoods.length,
        totalInventoryValue: stockItems.reduce((acc, i) => acc + i.totalValue, 0),
      },
    };
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
