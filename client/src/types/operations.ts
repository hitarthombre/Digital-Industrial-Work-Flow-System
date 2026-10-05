// Client types for the Production, Sales, Dispatch, Documents, Reports and Dashboard modules

export type Ref<T = { _id: string; name?: string; code?: string }> = string | (T & { _id: string });
export type UserRef = Ref<{ _id: string; firstName?: string; lastName?: string; email?: string }>;
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Paginated<T> {
  success: boolean;
  data: T[];
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export interface Single<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ListQuery {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  factoryId?: string;
  customerId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  [key: string]: string | number | undefined;
}

// ==========================================
// PRODUCTION
// ==========================================

export type ProductionPlanStatus = "Draft" | "Approved" | "In Progress" | "Completed" | "Cancelled";
export type WorkOrderStatus = "Planned" | "Released" | "In Progress" | "On Hold" | "Completed" | "Cancelled";
export type StageStatus = "pending" | "in_progress" | "completed" | "skipped";
export type JobCardStatus = "open" | "in_progress" | "completed";

export interface IProductionPlan {
  _id: string;
  planNumber: string;
  title: string;
  factoryId?: Ref;
  startDate: string;
  endDate: string;
  status: ProductionPlanStatus;
  priority: Priority;
  items: Array<{ _id: string; productId?: string; itemName: string; sku: string; plannedQuantity: number; producedQuantity: number; unit: string }>;
  notes?: string;
  createdBy?: UserRef;
  createdAt: string;
}

export interface IWorkOrderStage {
  _id: string;
  name: string;
  sequence: number;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface IJobCard {
  _id: string;
  jobCardNumber: string;
  title: string;
  stageName?: string;
  assignedTo?: UserRef;
  status: JobCardStatus;
  plannedHours: number;
  actualHours: number;
  instructions?: string;
  notes?: string;
  completedAt?: string;
}

export interface IWorkOrder {
  _id: string;
  workOrderNumber: string;
  planId?: Ref<{ _id: string; planNumber: string; title: string }>;
  factoryId?: Ref;
  warehouseId: Ref;
  outputWarehouseId?: Ref;
  productId?: string;
  itemName: string;
  sku: string;
  unit: string;
  plannedQuantity: number;
  producedQuantity: number;
  scrapQuantity: number;
  priority: Priority;
  status: WorkOrderStatus;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  assignedTo?: UserRef;
  stages: IWorkOrderStage[];
  jobCards: IJobCard[];
  materials: Array<{ _id: string; sku: string; itemName: string; requiredQuantity: number; consumedQuantity: number; unit: string }>;
  consumptionLog?: Array<{ sku: string; itemName: string; quantity: number; unit: string; unitCost: number; totalCost: number; consumedAt: string; notes?: string }>;
  scrapLog?: Array<{ quantity: number; reason: string; stageName?: string; recordedAt: string; notes?: string }>;
  outputLog?: Array<{ quantity: number; warehouseId: string; recordedAt: string; notes?: string }>;
  materialCost: number;
  notes?: string;
  statusTimeline?: Array<{ status: string; timestamp: string; updatedBy?: UserRef; comment?: string }>;
  createdBy?: UserRef;
  createdAt: string;
}

export interface IProductionReport {
  totalWorkOrders: number;
  byStatus: Record<string, number>;
  activeWorkOrders: number;
  completedWorkOrders: number;
  overdueWorkOrders: number;
  activePlans: number;
  plannedQuantity: number;
  producedQuantity: number;
  scrapQuantity: number;
  scrapRate: number;
  completionRate: number;
  materialCost: number;
  topProducts: Array<{ sku: string; itemName: string; produced: number; scrap: number }>;
  monthlyOutput: Array<{ label: string; value: number }>;
}

// ==========================================
// SALES
// ==========================================

export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired" | "Converted";
export type SalesOrderStatus =
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Processing"
  | "Partially Dispatched"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";
export type InvoiceStatus = "Unpaid" | "Partially Paid" | "Paid" | "Overdue" | "Cancelled";
export type PaymentMethod = "cash" | "bank_transfer" | "cheque" | "card" | "upi" | "other";

export interface ISalesLine {
  _id?: string;
  productId?: string;
  itemName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  lineSubtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  lineTotal?: number;
  quantityDispatched?: number;
}

export interface ISalesTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingCost: number;
  grandTotal: number;
}

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface IQuotation extends ISalesTotals {
  _id: string;
  quotationNumber: string;
  customerId: Ref;
  quotationDate: string;
  validUntil?: string;
  status: QuotationStatus;
  items: ISalesLine[];
  notes?: string;
  termsAndConditions?: string;
  salesOrderId?: Ref<{ _id: string; orderNumber: string; status: string }>;
  createdAt: string;
}

export interface ISalesOrder extends ISalesTotals {
  _id: string;
  orderNumber: string;
  customerId: Ref<{ _id: string; name: string; code?: string; email?: string; phone?: string }>;
  quotationId?: Ref<{ _id: string; quotationNumber: string }>;
  warehouseId: Ref;
  orderDate: string;
  expectedDeliveryDate?: string;
  customerPoNumber?: string;
  status: SalesOrderStatus;
  items: ISalesLine[];
  shippingAddress?: IAddress;
  paymentTerms?: string;
  paymentStatus: "unpaid" | "partially_paid" | "paid";
  amountInvoiced: number;
  amountPaid: number;
  approvedBy?: UserRef;
  approvedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  notes?: string;
  statusTimeline?: Array<{ status: string; timestamp: string; updatedBy?: UserRef; comment?: string }>;
  createdBy?: UserRef;
  createdAt: string;
}

export interface IInvoicePayment {
  _id: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  recordedBy?: UserRef;
}

export interface ISalesInvoice extends ISalesTotals {
  _id: string;
  invoiceNumber: string;
  salesOrderId: Ref<{ _id: string; orderNumber: string; status: string }>;
  customerId: Ref;
  invoiceDate: string;
  dueDate: string;
  items?: ISalesLine[];
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  payments: IInvoicePayment[];
  notes?: string;
  createdAt: string;
}

export interface ISalesHistoryEvent {
  type: "quotation" | "order" | "invoice" | "payment";
  id: string;
  number: string;
  date: string;
  amount: number;
  status: string;
  customer?: string;
  link: string;
}

export interface ISalesReport {
  totalOrders: number;
  totalOrderValue: number;
  averageOrderValue: number;
  byStatus: Record<string, number>;
  pendingApproval: number;
  totalInvoiced: number;
  totalCollected: number;
  outstandingReceivables: number;
  overdueAmount: number;
  overdueInvoices: number;
  quotationsByStatus: Record<string, number>;
  quotationConversionRate: number;
  monthlyRevenue: Array<{ label: string; value: number; collected: number }>;
  topCustomers: Array<{ customerId: string; name: string; code?: string; orders: number; value: number }>;
  topProducts: Array<{ sku: string; itemName: string; quantity: number; revenue: number }>;
}

// ==========================================
// DISPATCH
// ==========================================

export type DispatchStatus = "Pending" | "Packed" | "Shipped" | "In Transit" | "Out for Delivery" | "Delivered" | "Returned" | "Cancelled";
export type TransportMode = "road" | "rail" | "air" | "sea" | "courier";
export type DispatchDocType = "invoice" | "packing_list" | "eway_bill" | "lr_copy" | "proof_of_delivery" | "other";

export interface ITransportDetails {
  mode?: TransportMode;
  carrierName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  trackingNumber?: string;
  waybillNumber?: string;
  freightCost?: number;
}

export interface IDispatchOrder {
  _id: string;
  dispatchNumber: string;
  salesOrderId?: Ref<{ _id: string; orderNumber: string; status: string }>;
  customerId?: Ref;
  warehouseId: Ref;
  items: Array<{ _id: string; sku: string; itemName: string; quantity: number; unit: string }>;
  shippingAddress?: IAddress;
  contactName?: string;
  contactPhone?: string;
  transport: ITransportDetails;
  plannedDispatchDate?: string;
  estimatedDeliveryDate?: string;
  actualDispatchDate?: string;
  deliveredAt?: string;
  receivedBy?: string;
  status: DispatchStatus;
  stockDeducted: boolean;
  trackingEvents?: Array<{ _id: string; status: string; location?: string; note?: string; timestamp: string; updatedBy?: UserRef }>;
  documents: Array<{
    _id: string;
    title: string;
    docType: DispatchDocType;
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize: number;
    uploadedAt: string;
    uploadedBy?: UserRef;
  }>;
  notes?: string;
  createdAt: string;
}

export interface IDispatchTracking {
  dispatchNumber: string;
  status: DispatchStatus;
  progressPercent: number;
  steps: Array<{ status: DispatchStatus; state: "completed" | "current" | "upcoming" | "skipped"; timestamp?: string; location?: string }>;
  events: Array<{ _id: string; status: string; location?: string; note?: string; timestamp: string; updatedBy?: UserRef }>;
  transport: ITransportDetails;
  estimatedDeliveryDate?: string;
  actualDispatchDate?: string;
  deliveredAt?: string;
  isDelayed: boolean;
}

export interface IDispatchReport {
  totalDispatches: number;
  byStatus: Record<string, number>;
  pending: number;
  inTransit: number;
  delivered: number;
  returned: number;
  delayed: number;
  onTimeDeliveryRate: number;
  averageTransitDays: number;
  totalFreightCost: number;
  byTransportMode: Array<{ mode: string; count: number; freight: number }>;
  monthlyShipments: Array<{ label: string; value: number }>;
}

// ==========================================
// DOCUMENTS
// ==========================================

export const DOCUMENT_CATEGORIES = [
  "sop",
  "manual",
  "certificate",
  "product_document",
  "drawing",
  "contract",
  "policy",
  "report",
  "invoice",
  "other",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_LINK_MODULES = [
  "none",
  "product",
  "supplier",
  "customer",
  "factory",
  "warehouse",
  "work_order",
  "sales_order",
  "purchase_order",
  "dispatch",
] as const;
export type DocumentLinkModule = (typeof DOCUMENT_LINK_MODULES)[number];

export interface ILibraryDocument {
  _id: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  tags: string[];
  documentNumber?: string;
  version: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize: number;
  linkedModule: DocumentLinkModule;
  linkedRecordId?: string;
  linkedRecordLabel?: string;
  effectiveDate?: string;
  expiryDate?: string;
  uploadedBy?: UserRef;
  createdAt: string;
  updatedAt: string;
}

export interface IDocumentStats {
  total: number;
  totalSize: number;
  expiringSoon: number;
  byCategory: Record<DocumentCategory, number>;
}

// ==========================================
// REPORTS
// ==========================================

export type ReportType = "inventory" | "purchase" | "production" | "sales" | "dispatch" | "supplier" | "customer";
export type ColumnFormat = "text" | "number" | "currency" | "date" | "percent";

export interface IReportResult {
  type: ReportType;
  title: string;
  description: string;
  generatedAt: string;
  filters: Record<string, string>;
  columns: Array<{ key: string; label: string; format?: ColumnFormat }>;
  rows: Array<Record<string, any>>;
  summary: Array<{ label: string; value: number | string; format?: ColumnFormat }>;
}

// ==========================================
// DASHBOARD, NOTIFICATIONS & SEARCH
// ==========================================

export interface IDashboardSummary {
  kpis: {
    inventoryValue: number;
    lowStockItems: number;
    activeWorkOrders: number;
    openPurchaseOrders: number;
    openSalesOrders: number;
    revenueThisMonth: number;
    outstandingReceivables: number;
    shipmentsInTransit: number;
  };
  inventory: {
    totalValue: number;
    stockLines: number;
    lowStock: number;
    outOfStock: number;
    byCategory: Array<{ category: string; value: number; quantity: number }>;
  };
  production: { byStatus: Record<string, number>; active: number; completed: number; overdue: number; producedThisMonth: number };
  procurement: { byStatus: Record<string, number>; openOrders: number; pendingRequests: number; spendThisMonth: number; lateDeliveries: number };
  sales: {
    byStatus: Record<string, number>;
    pendingApproval: number;
    openOrders: number;
    revenueThisMonth: number;
    outstanding: number;
    overdue: number;
    revenueTrend: Array<{ label: string; value: number }>;
  };
  dispatch: { byStatus: Record<string, number>; pending: number; inTransit: number; delivered: number; delayed: number };
  alerts: Array<{ severity: "critical" | "warning" | "info"; title: string; message: string; link: string }>;
  recentActivity: Array<{ id: string; action: string; module: string; referenceId?: string; user: string; createdAt: string }>;
}

export interface INotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  status: "unread" | "read";
  link?: string;
  createdAt: string;
}

export interface ISearchResult {
  query: string;
  total: number;
  groups: Array<{
    type: string;
    label: string;
    items: Array<{ type: string; id: string; title: string; subtitle?: string; status?: string; link: string }>;
  }>;
}
