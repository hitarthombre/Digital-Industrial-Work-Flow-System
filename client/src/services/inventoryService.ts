import { api } from "./api";

export interface IStockMovementItem {
  _id: string;
  companyId?: string;
  warehouseId: any;
  destinationWarehouseId?: any;
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
  _id?: string;
  sku: string;
  itemName: string;
  itemCategory: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
  unit: string;
  quantity?: number;
  stockIn?: number;
  stockOut?: number;
  currentStock: number;
  unitCost: number;
  totalValue: number;
  minThreshold?: number;
  maxThreshold?: number;
  locationInWarehouse?: string;
  status?: "in_stock" | "low_stock" | "out_of_stock" | "overstocked";
  warehouseId?: any;
}

export interface ILowStockAlert {
  _id: string;
  companyId?: string;
  inventoryId?: any;
  sku: string;
  itemName: string;
  itemCategory: string;
  warehouseId: any;
  currentQuantity: number;
  minThreshold: number;
  severity: "warning" | "critical";
  status: "active" | "acknowledged" | "resolved";
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: any;
}

export interface InventoryFilterParams {
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

export interface StockInInput {
  warehouseId: string;
  productId?: string;
  sku: string;
  itemName: string;
  itemCategory?: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
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
  itemCategory?: "raw_material" | "finished_goods" | "packaging" | "components" | "other";
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

export interface InventoryReportData {
  reportDate: string;
  summary: {
    totalSKUs: number;
    totalInventoryValue: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  categoryBreakdown: {
    rawMaterials: { count: number; value: number };
    finishedGoods: { count: number; value: number };
    packaging: { count: number; value: number };
    components: { count: number; value: number };
  };
  activeLowStockAlerts: ILowStockAlert[];
  recentMovements: IStockMovementItem[];
}

const MOVEMENTS_STORAGE_KEY = "diws_inventory_movements_v2";
const STOCK_ITEMS_STORAGE_KEY = "diws_inventory_items_v2";

const INITIAL_LOCAL_ITEMS: StockLevelItem[] = [
  {
    _id: "inv-101",
    sku: "RM-STL-316L",
    itemName: "Stainless Steel Sheet 316L (2mm)",
    itemCategory: "raw_material",
    unit: "sheets",
    currentStock: 145,
    unitCost: 120.0,
    totalValue: 17400.0,
    minThreshold: 30,
    maxThreshold: 500,
    locationInWarehouse: "Rack A-04",
    status: "in_stock",
    warehouseId: { _id: "wh-1", name: "Central Hub Warehouse", code: "WH-CENTRAL-01" },
  },
  {
    _id: "inv-102",
    sku: "RM-ALU-6061",
    itemName: "Aluminum Extrusion Bar 6061-T6",
    itemCategory: "raw_material",
    unit: "meters",
    currentStock: 18,
    unitCost: 45.5,
    totalValue: 819.0,
    minThreshold: 25,
    maxThreshold: 300,
    locationInWarehouse: "Rack B-01",
    status: "low_stock",
    warehouseId: { _id: "wh-1", name: "Central Hub Warehouse", code: "WH-CENTRAL-01" },
  },
  {
    _id: "inv-103",
    sku: "FG-SRV-800",
    itemName: "Heavy-Duty Brushless Servo Motor 3.5kW",
    itemCategory: "finished_goods",
    unit: "pcs",
    currentStock: 42,
    unitCost: 890.0,
    totalValue: 37380.0,
    minThreshold: 10,
    maxThreshold: 100,
    locationInWarehouse: "Zone C-12",
    status: "in_stock",
    warehouseId: { _id: "wh-1", name: "Central Hub Warehouse", code: "WH-CENTRAL-01" },
  },
  {
    _id: "inv-104",
    sku: "FG-PLC-2000",
    itemName: "Industrial Automation PLC Controller Unit",
    itemCategory: "finished_goods",
    unit: "units",
    currentStock: 0,
    unitCost: 1450.0,
    totalValue: 0,
    minThreshold: 5,
    maxThreshold: 50,
    locationInWarehouse: "Zone D-03",
    status: "out_of_stock",
    warehouseId: { _id: "wh-1", name: "Central Hub Warehouse", code: "WH-CENTRAL-01" },
  },
  {
    _id: "inv-105",
    sku: "PKG-BOX-50",
    itemName: "Heavy-Duty Corrugated Shipping Box L",
    itemCategory: "packaging",
    unit: "pcs",
    currentStock: 850,
    unitCost: 4.2,
    totalValue: 3570.0,
    minThreshold: 200,
    maxThreshold: 2000,
    locationInWarehouse: "Mezzanine M-2",
    status: "in_stock",
    warehouseId: { _id: "wh-2", name: "West Coast Assembly Facility", code: "WH-WEST-02" },
  },
  {
    _id: "inv-106",
    sku: "CMP-BRG-6204",
    itemName: "Deep Groove Ball Bearing 6204-2RS",
    itemCategory: "components",
    unit: "pcs",
    currentStock: 8,
    unitCost: 12.5,
    totalValue: 100.0,
    minThreshold: 20,
    maxThreshold: 500,
    locationInWarehouse: "Bin 14-B",
    status: "low_stock",
    warehouseId: { _id: "wh-2", name: "West Coast Assembly Facility", code: "WH-WEST-02" },
  },
];

const INITIAL_LOCAL_MOVEMENTS: IStockMovementItem[] = [
  {
    _id: "mov-001",
    companyId: "comp-1",
    warehouseId: { _id: "wh-1", name: "Central Hub Warehouse", code: "WH-CENTRAL-01" },
    sku: "FG-SRV-800",
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
    sku: "RM-STL-316L",
    itemName: "Stainless Steel Sheet 316L (2mm)",
    type: "stock_in",
    itemCategory: "raw_material",
    quantity: 150,
    unit: "sheets",
    unitCost: 120.0,
    totalValue: 18000.0,
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
    sku: "FG-SRV-800",
    itemName: "Heavy-Duty Brushless Servo Motor 3.5kW",
    type: "stock_out",
    itemCategory: "finished_goods",
    quantity: 8,
    unit: "pcs",
    unitCost: 890.0,
    totalValue: 7120.0,
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
    sku: "RM-ALU-6061",
    itemName: "Aluminum Extrusion Bar 6061-T6",
    type: "adjustment",
    itemCategory: "raw_material",
    quantity: 5,
    unit: "meters",
    unitCost: 45.5,
    totalValue: 227.5,
    referenceNumber: "ADJ-9012",
    reason: "Cycle Count Reconcile Audit (Damaged Stock Written Off)",
    notes: "Verified during Q3 physical count",
    createdAt: "2026-09-25T16:45:00Z",
    updatedAt: "2026-09-25T16:45:00Z",
  },
];

class InventoryService {
  private getLocalItems(): StockLevelItem[] {
    const raw = localStorage.getItem(STOCK_ITEMS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STOCK_ITEMS_STORAGE_KEY, JSON.stringify(INITIAL_LOCAL_ITEMS));
      return INITIAL_LOCAL_ITEMS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.setItem(STOCK_ITEMS_STORAGE_KEY, JSON.stringify(INITIAL_LOCAL_ITEMS));
      return INITIAL_LOCAL_ITEMS;
    }
  }

  private saveLocalItems(items: StockLevelItem[]): void {
    localStorage.setItem(STOCK_ITEMS_STORAGE_KEY, JSON.stringify(items));
  }

  private getLocalMovements(): IStockMovementItem[] {
    const raw = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_LOCAL_MOVEMENTS));
      return INITIAL_LOCAL_MOVEMENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_LOCAL_MOVEMENTS));
      return INITIAL_LOCAL_MOVEMENTS;
    }
  }

  private saveLocalMovements(items: IStockMovementItem[]): void {
    localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(items));
  }

  // --- API Endpoint Methods ---

  // POST /api/inventory/stock-in
  async stockIn(input: StockInInput) {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        inventory: any;
        movement: IStockMovementItem;
      }>("/inventory/stock-in", input);

      if (response && response.success) {
        return response;
      }
    } catch (err: any) {
      // If server returned an explicit error response from backend API validation, rethrow it
      if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
        throw err;
      }
    }

    // Local Fallback implementation
    const items = this.getLocalItems();
    const uppercaseSku = input.sku.trim().toUpperCase();
    let existingItem = items.find((i) => i.sku.toUpperCase() === uppercaseSku);

    const qty = Number(input.quantity);
    const unitCost = Number(input.unitCost || 0);

    if (existingItem) {
      existingItem.currentStock += qty;
      existingItem.itemName = input.itemName.trim();
      if (input.itemCategory) existingItem.itemCategory = input.itemCategory;
      if (input.unitCost !== undefined) existingItem.unitCost = unitCost;
      existingItem.totalValue = existingItem.currentStock * existingItem.unitCost;
      const min = existingItem.minThreshold || 10;
      existingItem.status = existingItem.currentStock <= 0 ? "out_of_stock" : existingItem.currentStock <= min ? "low_stock" : "in_stock";
    } else {
      const min = input.minThreshold ?? 10;
      existingItem = {
        _id: `inv-${Date.now()}`,
        sku: uppercaseSku,
        itemName: input.itemName.trim(),
        itemCategory: input.itemCategory || "finished_goods",
        unit: input.unit || "pcs",
        currentStock: qty,
        unitCost,
        totalValue: qty * unitCost,
        minThreshold: min,
        maxThreshold: input.maxThreshold ?? 1000,
        locationInWarehouse: input.locationInWarehouse || "Main Shelf",
        status: qty <= 0 ? "out_of_stock" : qty <= min ? "low_stock" : "in_stock",
        warehouseId: { _id: input.warehouseId, name: "Selected Warehouse" },
      };
      items.push(existingItem);
    }
    this.saveLocalItems(items);

    const movements = this.getLocalMovements();
    const newMovement: IStockMovementItem = {
      _id: `mov-${Date.now()}`,
      companyId: "comp-1",
      warehouseId: { _id: input.warehouseId, name: "Selected Warehouse" },
      sku: uppercaseSku,
      itemName: input.itemName,
      type: "stock_in",
      itemCategory: input.itemCategory || "finished_goods",
      quantity: qty,
      unit: input.unit || "pcs",
      unitCost,
      totalValue: qty * unitCost,
      referenceNumber: input.referenceNumber || `STK-IN-${Date.now().toString().slice(-6)}`,
      reason: input.reason || "Stock In Receipt",
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    movements.unshift(newMovement);
    this.saveLocalMovements(movements);

    return {
      success: true,
      message: "Stock in recorded successfully",
      inventory: existingItem,
      movement: newMovement,
    };
  }

  // POST /api/inventory/stock-out
  async stockOut(input: StockOutInput) {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        inventory: any;
        movement: IStockMovementItem;
      }>("/inventory/stock-out", input);

      if (response && response.success) {
        return response;
      }
    } catch (err: any) {
      if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
        throw err;
      }
    }

    const items = this.getLocalItems();
    const uppercaseSku = input.sku.trim().toUpperCase();
    const existingItem = items.find((i) => i.sku.toUpperCase() === uppercaseSku);

    const qty = Number(input.quantity);
    if (existingItem && existingItem.currentStock < qty) {
      throw new Error(`Insufficient stock available. Current stock: ${existingItem.currentStock} ${existingItem.unit}`);
    }

    if (existingItem) {
      existingItem.currentStock -= qty;
      existingItem.totalValue = existingItem.currentStock * existingItem.unitCost;
      const min = existingItem.minThreshold || 10;
      existingItem.status = existingItem.currentStock <= 0 ? "out_of_stock" : existingItem.currentStock <= min ? "low_stock" : "in_stock";
      this.saveLocalItems(items);
    }

    const movements = this.getLocalMovements();
    const unitCost = existingItem ? existingItem.unitCost : 0;
    const newMovement: IStockMovementItem = {
      _id: `mov-${Date.now()}`,
      companyId: "comp-1",
      warehouseId: { _id: input.warehouseId, name: "Selected Warehouse" },
      sku: uppercaseSku,
      itemName: input.itemName || existingItem?.itemName || uppercaseSku,
      type: "stock_out",
      itemCategory: input.itemCategory || existingItem?.itemCategory || "finished_goods",
      quantity: qty,
      unit: input.unit || existingItem?.unit || "pcs",
      unitCost,
      totalValue: qty * unitCost,
      referenceNumber: input.referenceNumber || `STK-OUT-${Date.now().toString().slice(-6)}`,
      reason: input.reason || "Stock Out Issue",
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    movements.unshift(newMovement);
    this.saveLocalMovements(movements);

    return {
      success: true,
      message: "Stock out recorded successfully",
      inventory: existingItem,
      movement: newMovement,
    };
  }

  // POST /api/inventory/transfer
  async transfer(input: StockTransferInput) {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        transfer: any;
        movements: IStockMovementItem[];
      }>("/inventory/transfer", input);

      if (response && response.success) {
        return response;
      }
    } catch (err: any) {
      if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
        throw err;
      }
    }

    const items = this.getLocalItems();
    const movements = this.getLocalMovements();
    const transferRef = input.referenceNumber || `TRF-${Date.now().toString().slice(-6)}`;
    const createdMovements: IStockMovementItem[] = [];

    for (const item of input.items) {
      const sku = item.sku.trim().toUpperCase();
      const qty = Number(item.quantity);
      const existingItem = items.find((i) => i.sku.toUpperCase() === sku);

      if (existingItem) {
        existingItem.currentStock = Math.max(0, existingItem.currentStock - qty);
        existingItem.totalValue = existingItem.currentStock * existingItem.unitCost;
        const min = existingItem.minThreshold || 10;
        existingItem.status = existingItem.currentStock <= 0 ? "out_of_stock" : existingItem.currentStock <= min ? "low_stock" : "in_stock";
      }

      const unitCost = existingItem ? existingItem.unitCost : 0;
      const mov: IStockMovementItem = {
        _id: `mov-${Date.now()}-${sku}`,
        companyId: "comp-1",
        warehouseId: { _id: input.sourceWarehouseId, name: "Source Warehouse" },
        destinationWarehouseId: { _id: input.destinationWarehouseId, name: "Destination Warehouse" },
        sku,
        itemName: item.itemName,
        type: "transfer",
        itemCategory: existingItem?.itemCategory || "finished_goods",
        quantity: qty,
        unit: item.unit || "pcs",
        unitCost,
        totalValue: qty * unitCost,
        referenceNumber: transferRef,
        reason: `Transferred between warehouses`,
        notes: input.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      createdMovements.push(mov);
      movements.unshift(mov);
    }

    this.saveLocalItems(items);
    this.saveLocalMovements(movements);

    return {
      success: true,
      message: "Stock transfer recorded successfully",
      transfer: { transferNumber: transferRef, items: input.items },
      movements: createdMovements,
    };
  }

  // POST /api/inventory/adjust
  async adjust(input: StockAdjustmentInput) {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        inventory: any;
        adjustment: any;
        movement: IStockMovementItem;
      }>("/inventory/adjust", input);

      if (response && response.success) {
        return response;
      }
    } catch (err: any) {
      if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
        throw err;
      }
    }

    const items = this.getLocalItems();
    const uppercaseSku = input.sku.trim().toUpperCase();
    let existingItem = items.find((i) => i.sku.toUpperCase() === uppercaseSku);

    const newQty = Number(input.newQuantity);
    const prevQty = existingItem ? existingItem.currentStock : 0;
    const diff = newQty - prevQty;
    const unitCost = input.unitCost !== undefined ? Number(input.unitCost) : existingItem ? existingItem.unitCost : 0;

    if (existingItem) {
      existingItem.currentStock = newQty;
      existingItem.itemName = input.itemName.trim();
      existingItem.unitCost = unitCost;
      existingItem.totalValue = newQty * unitCost;
      const min = existingItem.minThreshold || 10;
      existingItem.status = newQty <= 0 ? "out_of_stock" : newQty <= min ? "low_stock" : "in_stock";
    } else {
      existingItem = {
        _id: `inv-${Date.now()}`,
        sku: uppercaseSku,
        itemName: input.itemName.trim(),
        itemCategory: "finished_goods",
        unit: "pcs",
        currentStock: newQty,
        unitCost,
        totalValue: newQty * unitCost,
        minThreshold: 10,
        maxThreshold: 1000,
        locationInWarehouse: "Main Floor",
        status: newQty <= 0 ? "out_of_stock" : newQty <= 10 ? "low_stock" : "in_stock",
        warehouseId: { _id: input.warehouseId, name: "Selected Warehouse" },
      };
      items.push(existingItem);
    }
    this.saveLocalItems(items);

    const movements = this.getLocalMovements();
    const refNo = `ADJ-${Date.now().toString().slice(-6)}`;
    const newMov: IStockMovementItem = {
      _id: `mov-${Date.now()}`,
      companyId: "comp-1",
      warehouseId: { _id: input.warehouseId, name: "Selected Warehouse" },
      sku: uppercaseSku,
      itemName: input.itemName,
      type: "adjustment",
      itemCategory: existingItem.itemCategory,
      quantity: Math.abs(diff),
      unit: existingItem.unit,
      unitCost,
      totalValue: Math.abs(diff) * unitCost,
      referenceNumber: refNo,
      reason: `Stock Adjustment: ${input.reason} (${diff >= 0 ? "+" : ""}${diff})`,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    movements.unshift(newMov);
    this.saveLocalMovements(movements);

    return {
      success: true,
      message: "Stock adjustment recorded successfully",
      inventory: existingItem,
      adjustment: { previousQuantity: prevQty, newQuantity: newQty, differenceQuantity: diff },
      movement: newMov,
    };
  }

  // GET /api/inventory/history
  async getHistory(params: InventoryFilterParams = {}) {
    try {
      const response = await api.get<{
        success: boolean;
        data: IStockMovementItem[];
        pagination: any;
        stats: any;
      }>("/inventory/history", { params: params as any });

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
          (m.referenceNumber && m.referenceNumber.toLowerCase().includes(q)) ||
          (m.reason && m.reason.toLowerCase().includes(q))
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

  // GET /api/inventory/raw-materials
  async getRawMaterials(params: InventoryFilterParams = {}) {
    try {
      const response = await api.get<{
        success: boolean;
        data: StockLevelItem[];
        pagination: any;
        summary: any;
      }>("/inventory/raw-materials", { params: params as any });

      if (response && response.data) {
        return response;
      }
    } catch (_) {
      // Fallback
    }

    let items = this.getLocalItems().filter((i) => i.itemCategory === "raw_material");

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((i) => i.sku.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q));
    }
    if (params.status && params.status !== "ALL") {
      items = items.filter((i) => i.status === params.status);
    }

    const page = params.page || 1;
    const limit = params.limit || 15;
    const total = items.length;
    const paginated = items.slice((page - 1) * limit, page * limit);
    const totalValuation = items.reduce((acc, i) => acc + (i.totalValue || 0), 0);
    const lowStockCount = items.filter((i) => i.currentStock <= (i.minThreshold || 10)).length;

    return {
      success: true,
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalItems: total,
        totalQuantity: items.reduce((acc, i) => acc + i.currentStock, 0),
        totalValuation,
        lowStockCount,
      },
    };
  }

  // GET /api/inventory/finished-goods
  async getFinishedGoods(params: InventoryFilterParams = {}) {
    try {
      const response = await api.get<{
        success: boolean;
        data: StockLevelItem[];
        pagination: any;
        summary: any;
      }>("/inventory/finished-goods", { params: params as any });

      if (response && response.data) {
        return response;
      }
    } catch (_) {
      // Fallback
    }

    let items = this.getLocalItems().filter((i) => i.itemCategory === "finished_goods");

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((i) => i.sku.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q));
    }
    if (params.status && params.status !== "ALL") {
      items = items.filter((i) => i.status === params.status);
    }

    const page = params.page || 1;
    const limit = params.limit || 15;
    const total = items.length;
    const paginated = items.slice((page - 1) * limit, page * limit);
    const totalValuation = items.reduce((acc, i) => acc + (i.totalValue || 0), 0);
    const lowStockCount = items.filter((i) => i.currentStock <= (i.minThreshold || 10)).length;

    return {
      success: true,
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalItems: total,
        totalQuantity: items.reduce((acc, i) => acc + i.currentStock, 0),
        totalValuation,
        lowStockCount,
      },
    };
  }

  // GET /api/inventory/alerts/low-stock
  async getLowStockAlerts(params: InventoryFilterParams = {}) {
    try {
      const response = await api.get<{
        success: boolean;
        count: number;
        summary: { totalActiveAlerts: number; criticalCount: number; warningCount: number };
        data: ILowStockAlert[];
      }>("/inventory/alerts/low-stock", { params: params as any });

      if (response && response.data) {
        return response;
      }
    } catch (_) {
      // Fallback
    }

    const items = this.getLocalItems();
    const lowItems = items.filter((i) => i.currentStock <= (i.minThreshold || 10));

    const alerts: ILowStockAlert[] = lowItems.map((item, idx) => ({
      _id: `alert-${idx + 1}`,
      sku: item.sku,
      itemName: item.itemName,
      itemCategory: item.itemCategory,
      warehouseId: item.warehouseId || { name: "Central Hub Warehouse", code: "WH-CENTRAL-01" },
      currentQuantity: item.currentStock,
      minThreshold: item.minThreshold || 10,
      severity: item.currentStock === 0 ? "critical" : "warning",
      status: "active",
      triggeredAt: new Date(Date.now() - idx * 3600000).toISOString(),
    }));

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

  // GET /api/inventory/reports
  async getReports(): Promise<InventoryReportData> {
    try {
      const response = await api.get<InventoryReportData>("/inventory/reports");
      if (response && response.summary) {
        return response;
      }
    } catch (_) {
      // Fallback
    }

    const items = this.getLocalItems();
    const movements = this.getLocalMovements();

    const raw = items.filter((i) => i.itemCategory === "raw_material");
    const fg = items.filter((i) => i.itemCategory === "finished_goods");
    const pkg = items.filter((i) => i.itemCategory === "packaging");
    const cmp = items.filter((i) => i.itemCategory === "components");

    const totalValuation = items.reduce((acc, i) => acc + (i.totalValue || 0), 0);
    const outOfStockCount = items.filter((i) => i.currentStock === 0).length;
    const lowStockCount = items.filter((i) => i.currentStock > 0 && i.currentStock <= (i.minThreshold || 10)).length;
    const inStockCount = items.filter((i) => i.currentStock > (i.minThreshold || 10)).length;

    const lowStockAlertsRes = await this.getLowStockAlerts();

    return {
      reportDate: new Date().toISOString(),
      summary: {
        totalSKUs: items.length,
        totalInventoryValue: Number(totalValuation.toFixed(2)),
        inStockCount,
        lowStockCount,
        outOfStockCount,
      },
      categoryBreakdown: {
        rawMaterials: {
          count: raw.length,
          value: Number(raw.reduce((acc, i) => acc + (i.totalValue || 0), 0).toFixed(2)),
        },
        finishedGoods: {
          count: fg.length,
          value: Number(fg.reduce((acc, i) => acc + (i.totalValue || 0), 0).toFixed(2)),
        },
        packaging: {
          count: pkg.length,
          value: Number(pkg.reduce((acc, i) => acc + (i.totalValue || 0), 0).toFixed(2)),
        },
        components: {
          count: cmp.length,
          value: Number(cmp.reduce((acc, i) => acc + (i.totalValue || 0), 0).toFixed(2)),
        },
      },
      activeLowStockAlerts: lowStockAlertsRes.data || [],
      recentMovements: movements.slice(0, 10),
    };
  }

  // GET /api/inventory/stock-levels (Legacy / All Stock Items)
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

    const items = this.getLocalItems();
    const rawMaterials = items.filter((i) => i.itemCategory === "raw_material");
    const finishedGoods = items.filter((i) => i.itemCategory === "finished_goods");

    return {
      success: true,
      stockItems: items,
      rawMaterials,
      finishedGoods,
      summary: {
        totalSKUs: items.length,
        rawMaterialSKUs: rawMaterials.length,
        finishedGoodsSKUs: finishedGoods.length,
        totalInventoryValue: items.reduce((acc, i) => acc + (i.totalValue || 0), 0),
      },
    };
  }

  // Legacy getMovements
  async getMovements(params: InventoryFilterParams = {}) {
    return this.getHistory(params);
  }

  // Legacy recordMovement
  async recordMovement(input: RecordMovementInput) {
    if (input.type === "stock_in") {
      const res = await this.stockIn(input as StockInInput);
      return res.movement;
    } else if (input.type === "stock_out") {
      const res = await this.stockOut(input as StockOutInput);
      return res.movement;
    } else if (input.type === "adjustment") {
      const res = await this.adjust({
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
      throw new Error(`Unsupported type: ${input.type}`);
    }
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
