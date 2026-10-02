export type ItemCategory = "raw_material" | "finished_goods" | "packaging" | "components" | "other";

export type PRStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Order Created";
export type PRPriority = "low" | "medium" | "high" | "urgent";

export interface IPurchaseRequestItem {
  _id?: string;
  productId?: string;
  inventoryId?: string;
  itemName: string;
  sku?: string;
  itemCategory?: ItemCategory;
  quantity: number;
  unit?: string;
  estimatedUnitPrice?: number;
  notes?: string;
}

export interface IPurchaseRequest {
  _id: string;
  companyId?: string;
  prNumber: string;
  requestedBy: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | string;
  warehouseId: {
    _id?: string;
    name?: string;
    code?: string;
  } | string;
  factoryId?: {
    _id?: string;
    name?: string;
  } | string;
  department?: string;
  priority: PRPriority;
  requiredByDate?: string;
  justification?: string;
  status: PRStatus;
  items: IPurchaseRequestItem[];
  totalEstimatedCost?: number;
  approvedBy?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | string;
  approvedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type POStatus =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "PO Created"
  | "Issued"
  | "In Transit"
  | "Partial Delivery"
  | "Goods Received"
  | "Closed"
  | "Cancelled";

export interface IPurchaseOrderItem {
  _id?: string;
  productId?: string;
  inventoryId?: string;
  itemName: string;
  sku: string;
  itemCategory?: ItemCategory;
  quantityOrdered: number;
  quantityReceived?: number;
  unit?: string;
  unitPrice: number;
  taxRate?: number;
  totalPrice?: number;
  remarks?: string;
}

export interface IPurchaseOrder {
  _id: string;
  companyId?: string;
  poNumber: string;
  purchaseRequestId?: string | IPurchaseRequest;
  supplierId: {
    _id?: string;
    name?: string;
    code?: string;
    email?: string;
    phone?: string;
    paymentTerms?: string;
  } | string;
  warehouseId: {
    _id?: string;
    name?: string;
    code?: string;
  } | string;
  factoryId?: {
    _id?: string;
    name?: string;
  } | string;
  status: POStatus;
  paymentTerms?: string;
  expectedDeliveryDate?: string;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  grandTotal: number;
  notes?: string;
  termsAndConditions?: string;
  items: IPurchaseOrderItem[];
  createdById?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
  } | string;
  issuedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IGRNItem {
  _id?: string;
  poItemId?: string;
  productId?: string;
  inventoryId?: string;
  itemName: string;
  sku: string;
  itemCategory?: ItemCategory;
  quantityOrdered: number;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected: number;
  unit?: string;
  unitCost: number;
  remarks?: string;
  rejectionReason?: string;
}

export interface IGRN {
  _id: string;
  companyId?: string;
  grnNumber: string;
  purchaseOrderId: string | IPurchaseOrder;
  receivedBy: {
    _id?: string;
    firstName?: string;
    lastName?: string;
  } | string;
  deliveryChallanNumber?: string;
  invoiceNumber?: string;
  receivedDate: string;
  notes?: string;
  items: IGRNItem[];
  totalAcceptedQty?: number;
  totalRejectedQty?: number;
  createdAt: string;
  updatedAt: string;
}

export type ReturnReason =
  | "defective"
  | "damaged_in_transit"
  | "incorrect_specification"
  | "excess_quantity"
  | "expired"
  | "other";

export interface IPurchaseReturnItem {
  _id?: string;
  productId?: string;
  inventoryId?: string;
  itemName: string;
  sku: string;
  itemCategory?: ItemCategory;
  quantityReturned: number;
  unit?: string;
  unitCost: number;
  condition?: string;
}

export interface IPurchaseReturn {
  _id: string;
  companyId?: string;
  returnNumber: string;
  purchaseOrderId: string | IPurchaseOrder;
  grnId?: string | IGRN;
  supplierId: {
    _id?: string;
    name?: string;
    code?: string;
  } | string;
  warehouseId: {
    _id?: string;
    name?: string;
  } | string;
  requestedBy: {
    _id?: string;
    firstName?: string;
    lastName?: string;
  } | string;
  reason: ReturnReason;
  reasonDetails?: string;
  status: "Requested" | "Approved" | "Processed" | "Completed" | "Rejected";
  notes?: string;
  items: IPurchaseReturnItem[];
  totalReturnValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ITrackingEvent {
  status: POStatus;
  timestamp: string;
  location?: string;
  notes?: string;
  updatedBy?: string;
}

export interface IPOLiveTracking {
  poId: string;
  poNumber: string;
  currentStatus: POStatus;
  progressPercentage: number;
  estimatedArrival?: string;
  carrierName?: string;
  trackingNumber?: string;
  timeline: ITrackingEvent[];
  itemsCount: number;
  totalValue: number;
  supplierName: string;
  warehouseName: string;
}

export interface IProcurementReportSummary {
  kpis: {
    totalSpend: number;
    totalOrdersCount: number;
    pendingRequestsCount: number;
    activePOsCount: number;
    fulfilledOrdersCount: number;
    fulfillmentRatePercentage: number;
    activeSuppliersCount: number;
  };
  spendByCategory: Array<{
    category: ItemCategory;
    totalSpend: number;
    percentage: number;
    itemsCount: number;
  }>;
  statusBreakdown: Array<{
    status: POStatus;
    count: number;
    totalValue: number;
  }>;
  topSuppliers: Array<{
    supplierId: string;
    name: string;
    code: string;
    totalOrders: number;
    totalSpend: number;
  }>;
  monthlySpendTrend: Array<{
    month: string;
    spend: number;
    ordersCount: number;
  }>;
}

export interface CreatePRPayload {
  warehouseId: string;
  factoryId?: string;
  department?: string;
  priority?: PRPriority;
  requiredByDate?: string;
  justification?: string;
  status?: "Draft" | "Submitted";
  items: Array<{
    productId?: string;
    inventoryId?: string;
    itemName: string;
    sku?: string;
    itemCategory?: ItemCategory;
    quantity: number;
    unit?: string;
    estimatedUnitPrice?: number;
    notes?: string;
  }>;
}

export interface ApprovePRPayload {
  status: "Approved" | "Rejected";
  approvalNotes?: string;
  rejectionReason?: string;
}

export interface CreatePOPayload {
  purchaseRequestId?: string;
  supplierId: string;
  warehouseId: string;
  factoryId?: string;
  paymentTerms?: string;
  expectedDeliveryDate?: string;
  shippingCost?: number;
  notes?: string;
  termsAndConditions?: string;
  items: Array<{
    productId?: string;
    inventoryId?: string;
    itemName: string;
    sku: string;
    itemCategory?: ItemCategory;
    quantityOrdered: number;
    unit?: string;
    unitPrice: number;
    taxRate?: number;
    remarks?: string;
  }>;
}

export interface UpdatePOStatusPayload {
  status: POStatus;
  comment?: string;
}

export interface CreateGRNPayload {
  purchaseOrderId: string;
  deliveryChallanNumber?: string;
  invoiceNumber?: string;
  notes?: string;
  items: Array<{
    poItemId?: string;
    productId?: string;
    inventoryId?: string;
    itemName: string;
    sku: string;
    itemCategory?: ItemCategory;
    quantityOrdered?: number;
    quantityReceived: number;
    quantityAccepted: number;
    quantityRejected?: number;
    unit?: string;
    unitCost?: number;
    remarks?: string;
    rejectionReason?: string;
  }>;
}

export interface CreateReturnPayload {
  purchaseOrderId: string;
  grnId?: string;
  supplierId: string;
  warehouseId: string;
  reason: ReturnReason;
  reasonDetails?: string;
  notes?: string;
  items: Array<{
    productId?: string;
    inventoryId?: string;
    itemName: string;
    sku: string;
    itemCategory?: ItemCategory;
    quantityReturned: number;
    unit?: string;
    unitCost?: number;
    condition?: string;
  }>;
}

export interface ProcurementFilterParams {
  search?: string;
  status?: string;
  priority?: string;
  supplierId?: string;
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
