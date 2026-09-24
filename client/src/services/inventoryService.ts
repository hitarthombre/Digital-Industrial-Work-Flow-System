import { api } from "./api";

export interface IStockMovementItem {
  _id: string;
  companyId: string;
  warehouseId: any;
  productId?: string;
  sku: string;
  itemName: string;
  type: "stock_in" | "stock_out" | "adjustment" | "transfer";
  itemCategory: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
  quantity: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  referenceNumber: string;
  reason?: string;
  notes?: string;
  performedBy?: any;
  createdAt: string;
  updatedAt: string;
}

export interface StockLevelItem {
  sku: string;
  itemName: string;
  itemCategory: string;
  unit: string;
  stockIn: number;
  stockOut: number;
  currentStock: number;
  unitCost: number;
  totalValue: number;
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

export interface RecordMovementInput {
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

const STORAGE_KEY = "diws_inventory_movements_v1";

const INITIAL_LOCAL_MOVEMENTS: IStockMovementItem[] = [
  {
    _id: "mov-001",
    companyId: "comp-1",
    warehouseId: { _id: "wh-1", name: "Central Hub Warehouse", code: "WH-CENTRAL-01" },
    sku: "SRV-800-NOBRK-KEY",
    itemName: "Heavy-Duty Brushless Servo Motor 3.5kW",
    type: "stock_in",
    itemCategory: "finished_goods",
    quantity: 50,
    unit: "pcs",
    unitCost: 890.0,
    totalValue: 44500.0,
    referenceNumber: "PO-RECEIPT-9081",
    reason: "Goods Receipt Note from ApexMotion",
    notes: "Batch inspection passed IP67 standards",
    createdAt: "2026-09-20T10:15:00Z",
    updatedAt: "2026-09-20T10:15:00Z",
  },
  {
    _id: "mov-002",
    companyId: "comp-1",
    warehouseId: { _id: "wh-1", name: "Central Hub Warehouse", code: "WH-CENTRAL-01" },
    sku: "END-CAR-06-STD",
    itemName: "Carbide 4-Flute End Mill Set (AlTiN)",
    type: "stock_in",
    itemCategory: "raw_material",
    quantity: 150,
    unit: "sets",
    unitCost: 72.0,
    totalValue: 10800.0,
    referenceNumber: "PO-RECEIPT-9082",
    reason: "Supplier Delivery TitanCraft",
    notes: "Raw tooling replenishment",
    createdAt: "2026-09-21T14:30:00Z",
    updatedAt: "2026-09-21T14:30:00Z",
  },
  {
    _id: "mov-003",
    companyId: "comp-1",
    warehouseId: { _id: "wh-1", name: "Central Hub Warehouse", code: "WH-CENTRAL-01" },
    sku: "SRV-800-NOBRK-KEY",
    itemName: "Heavy-Duty Brushless Servo Motor 3.5kW",
    type: "stock_out",
    itemCategory: "finished_goods",
    quantity: 5,
    unit: "pcs",
    unitCost: 890.0,
    totalValue: 4450.0,
    referenceNumber: "DISPATCH-4401",
    reason: "Sales Order Dispatch to Customer",
    notes: "Shipped via Express Logistics",
    createdAt: "2026-09-22T09:00:00Z",
    updatedAt: "2026-09-22T09:00:00Z",
  },
  {
    _id: "mov-004",
    companyId: "comp-1",
    warehouseId: { _id: "wh-1", name: "Central Hub Warehouse", code: "WH-CENTRAL-01" },
    sku: "END-CAR-06-STD",
    itemName: "Carbide 4-Flute End Mill Set (AlTiN)",
    type: "stock_out",
    itemCategory: "raw_material",
    quantity: 30,
    unit: "sets",
    unitCost: 72.0,
    totalValue: 2160.0,
    referenceNumber: "WORK-ORDER-771",
    reason: "Issue to CNC Machining Floor",
    notes: "Production floor consumption",
    createdAt: "2026-09-23T11:20:00Z",
    updatedAt: "2026-09-23T11:20:00Z",
  },
];

class InventoryService {
  private getLocalMovements(): IStockMovementItem[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOCAL_MOVEMENTS));
      return INITIAL_LOCAL_MOVEMENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOCAL_MOVEMENTS));
      return INITIAL_LOCAL_MOVEMENTS;
    }
  }

  private saveLocalMovements(items: IStockMovementItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  async getMovements(params: InventoryFilterParams = {}) {
    try {
      const response = await api.get<{
        success: boolean;
        data: IStockMovementItem[];
        pagination: any;
        stats: any;
      }>("/inventory/movements", { params: params as any });

      if (response && response.data) {
        return response;
      }
    } catch (_) {
      // Fallback
    }

    let items = this.getLocalMovements();

    if (params.type && params.type !== "ALL") {
      items = items.filter((m) => m.type === params.type);
    }
    if (params.itemCategory && params.itemCategory !== "ALL") {
      items = items.filter((m) => m.itemCategory === params.itemCategory);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      items = items.filter(
        (m) =>
          m.sku.toLowerCase().includes(q) ||
          m.itemName.toLowerCase().includes(q) ||
          (m.referenceNumber && m.referenceNumber.toLowerCase().includes(q))
      );
    }

    const page = params.page || 1;
    const limit = params.limit || 15;
    const total = items.length;
    const paginated = items.slice((page - 1) * limit, page * limit);

    const all = this.getLocalMovements();
    const stockIn = all.filter((m) => m.type === "stock_in").reduce((sum, m) => sum + m.quantity, 0);
    const stockOut = all.filter((m) => m.type === "stock_out").reduce((sum, m) => sum + m.quantity, 0);
    const totalValuation = all.reduce((sum, m) => sum + (m.totalValue || 0), 0);

    return {
      success: true,
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        totalMovements: total,
        totalStockInQty: stockIn,
        totalStockOutQty: stockOut,
        totalValuation,
        rawMaterialMovements: all.filter((m) => m.itemCategory === "raw_material").length,
        finishedGoodsMovements: all.filter((m) => m.itemCategory === "finished_goods").length,
      },
    };
  }

  async recordMovement(input: RecordMovementInput): Promise<IStockMovementItem> {
    try {
      const response = await api.post<{ success: boolean; data: IStockMovementItem }>("/inventory/movements", input);
      if (response && response.data) {
        return response.data;
      }
    } catch (_) {
      // Fallback
    }

    const items = this.getLocalMovements();
    const unitCost = input.unitCost || 0;
    const totalValue = Number((input.quantity * unitCost).toFixed(2));

    const newMovement: IStockMovementItem = {
      _id: `mov-${Date.now()}`,
      companyId: "comp-1",
      warehouseId: { _id: input.warehouseId, name: "Selected Warehouse" },
      sku: input.sku.toUpperCase(),
      itemName: input.itemName,
      type: input.type,
      itemCategory: input.itemCategory || "finished_goods",
      quantity: input.quantity,
      unit: input.unit || "units",
      unitCost,
      totalValue,
      referenceNumber: input.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      reason: input.reason || "Manual Entry",
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    items.unshift(newMovement);
    this.saveLocalMovements(items);
    return newMovement;
  }

  async getStockLevels() {
    try {
      const response = await api.get<{
        success: boolean;
        stockItems: StockLevelItem[];
        rawMaterials: StockLevelItem[];
        finishedGoods: StockLevelItem[];
        summary: any;
      }>("/inventory/stock-levels");

      if (response && response.stockItems) {
        return response;
      }
    } catch (_) {
      // Fallback
    }

    const movements = this.getLocalMovements();
    const stockMap: Record<string, StockLevelItem> = {};

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
