export type WorkOrderPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type WorkOrderStatus = "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
export type WorkOrderStage =
  | "PLANNED"
  | "MATERIAL_PREP"
  | "MACHINING"
  | "ASSEMBLY"
  | "QUALITY_CHECK"
  | "PACKAGING"
  | "COMPLETED";

export interface JobCard {
  _id?: string;
  stageName: string;
  assignedOperator?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  notes?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ConsumedMaterial {
  _id?: string;
  product?: string;
  productName: string;
  warehouse?: string;
  warehouseName: string;
  quantity: number;
  unit: string;
  consumedAt: string;
  loggedBy?: string;
}

export interface ScrapLog {
  _id?: string;
  materialOrProduct: string;
  quantity: number;
  reason: "DEFECTIVE_RAW_MATERIAL" | "OPERATOR_ERROR" | "MACHINE_MALFUNCTION" | "TESTING_LOSS" | "OTHER";
  stage?: string;
  notes?: string;
  loggedAt: string;
}

export interface WorkOrder {
  _id: string;
  workOrderNumber: string;
  company: string;
  factory: {
    _id: string;
    name: string;
    code?: string;
    location?: {
      address?: string;
      city?: string;
    };
  };
  product: {
    _id: string;
    name: string;
    sku?: string;
    unit?: string;
    category?: string;
    price?: number;
  };
  targetQuantity: number;
  completedQuantity: number;
  scrapQuantity: number;
  unit: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  stage: WorkOrderStage;
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  jobCards: JobCard[];
  consumedMaterials: ConsumedMaterial[];
  scrapLogs: ScrapLog[];
  notes?: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductionStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  onHoldOrders: number;
  totalTargetQty: number;
  totalCompletedQty: number;
  totalScrapQty: number;
  yieldRate: number;
  oeeEfficiency: number;
  stageBreakdown: Record<WorkOrderStage, number>;
}

export interface CreateWorkOrderInput {
  factoryId: string;
  productId: string;
  targetQuantity: number;
  unit?: string;
  priority?: WorkOrderPriority;
  startDate?: string;
  targetCompletionDate: string;
  notes?: string;
}

export interface ConsumeMaterialInput {
  productId?: string;
  productName: string;
  warehouseId?: string;
  warehouseName: string;
  quantity: number;
  unit: string;
  deductInventory?: boolean;
}

export interface RecordScrapInput {
  materialOrProduct: string;
  quantity: number;
  reason: "DEFECTIVE_RAW_MATERIAL" | "OPERATOR_ERROR" | "MACHINE_MALFUNCTION" | "TESTING_LOSS" | "OTHER";
  stage?: string;
  notes?: string;
}

export interface CompleteWorkOrderInput {
  completedQuantity: number;
  scrapQuantity?: number;
  warehouseId?: string;
  notes?: string;
}
