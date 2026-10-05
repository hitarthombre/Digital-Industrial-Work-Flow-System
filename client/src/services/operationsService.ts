import { api } from "./api";
import type {
  Paginated,
  Single,
  ListQuery,
  IProductionPlan,
  IWorkOrder,
  IProductionReport,
  StageStatus,
  JobCardStatus,
  WorkOrderStatus,
  ProductionPlanStatus,
  IQuotation,
  ISalesOrder,
  ISalesInvoice,
  ISalesHistoryEvent,
  ISalesReport,
  QuotationStatus,
  PaymentMethod,
  IAddress,
  IDispatchOrder,
  IDispatchTracking,
  IDispatchReport,
  ITransportDetails,
  DispatchStatus,
  DispatchDocType,
  ILibraryDocument,
  IDocumentStats,
  IReportResult,
  ReportType,
  IDashboardSummary,
  INotification,
  ISearchResult,
} from "../types/operations";

const q = (params?: ListQuery) => ({ params: (params || {}) as Record<string, string | number | boolean> });

interface SalesLinePayload {
  productId?: string;
  itemName: string;
  sku: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
  taxRate?: number;
}

// ==========================================
// PRODUCTION
// ==========================================

export const productionService = {
  getPlans: (params?: ListQuery) => api.get<Paginated<IProductionPlan>>("/production/plans", q(params)),
  getPlan: (id: string) => api.get<Single<{ plan: IProductionPlan; workOrders: IWorkOrder[] }>>(`/production/plans/${id}`),
  createPlan: (payload: {
    title: string;
    factoryId?: string;
    startDate: string;
    endDate: string;
    priority?: string;
    notes?: string;
    items: Array<{ productId?: string; itemName: string; sku: string; plannedQuantity: number; unit?: string }>;
  }) => api.post<Single<IProductionPlan>>("/production/plans", payload),
  updatePlanStatus: (id: string, status: ProductionPlanStatus) =>
    api.patch<Single<IProductionPlan>>(`/production/plans/${id}/status`, { status }),

  getWorkOrders: (params?: ListQuery) => api.get<Paginated<IWorkOrder>>("/production/work-orders", q(params)),
  getWorkOrder: (id: string) => api.get<Single<IWorkOrder>>(`/production/work-orders/${id}`),
  createWorkOrder: (payload: Record<string, any>) => api.post<Single<IWorkOrder>>("/production/work-orders", payload),
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus, comment?: string) =>
    api.patch<Single<IWorkOrder>>(`/production/work-orders/${id}/status`, { status, comment }),
  updateStage: (id: string, stageId: string, status: StageStatus, notes?: string) =>
    api.patch<Single<IWorkOrder>>(`/production/work-orders/${id}/stages/${stageId}`, { status, notes }),
  addJobCard: (id: string, payload: { title: string; stageName?: string; assignedTo?: string; plannedHours?: number; instructions?: string }) =>
    api.post<Single<IWorkOrder>>(`/production/work-orders/${id}/job-cards`, payload),
  updateJobCard: (id: string, jobCardId: string, payload: { status?: JobCardStatus; actualHours?: number; notes?: string }) =>
    api.patch<Single<IWorkOrder>>(`/production/work-orders/${id}/job-cards/${jobCardId}`, payload),
  consumeMaterials: (id: string, payload: { warehouseId?: string; items: Array<{ sku: string; quantity: number; notes?: string }> }) =>
    api.post<Single<IWorkOrder>>(`/production/work-orders/${id}/consume`, payload),
  recordOutput: (
    id: string,
    payload: { quantity: number; scrapQuantity?: number; scrapReason?: string; warehouseId?: string; notes?: string; markComplete?: boolean }
  ) => api.post<Single<IWorkOrder>>(`/production/work-orders/${id}/output`, payload),
  recordScrap: (id: string, payload: { quantity: number; reason: string; stageName?: string; notes?: string }) =>
    api.post<Single<IWorkOrder>>(`/production/work-orders/${id}/scrap`, payload),
  getReports: (params?: ListQuery) => api.get<Single<IProductionReport>>("/production/reports", q(params)),
};

// ==========================================
// SALES
// ==========================================

export const salesService = {
  getQuotations: (params?: ListQuery) => api.get<Paginated<IQuotation>>("/sales/quotations", q(params)),
  createQuotation: (payload: {
    customerId: string;
    validUntil?: string;
    items: SalesLinePayload[];
    shippingCost?: number;
    notes?: string;
    termsAndConditions?: string;
    status?: "Draft" | "Sent";
  }) => api.post<Single<IQuotation>>("/sales/quotations", payload),
  updateQuotationStatus: (id: string, status: QuotationStatus) =>
    api.patch<Single<IQuotation>>(`/sales/quotations/${id}/status`, { status }),
  convertQuotation: (id: string, payload: { warehouseId: string; expectedDeliveryDate?: string; customerPoNumber?: string }) =>
    api.post<Single<{ quotation: IQuotation; order: ISalesOrder }>>(`/sales/quotations/${id}/convert`, payload),

  getOrders: (params?: ListQuery) => api.get<Paginated<ISalesOrder>>("/sales/orders", q(params)),
  getOrder: (id: string) => api.get<Single<{ order: ISalesOrder; invoices: ISalesInvoice[] }>>(`/sales/orders/${id}`),
  createOrder: (payload: {
    customerId: string;
    warehouseId: string;
    expectedDeliveryDate?: string;
    customerPoNumber?: string;
    items: SalesLinePayload[];
    shippingCost?: number;
    shippingAddress?: IAddress;
    paymentTerms?: string;
    notes?: string;
  }) => api.post<Single<ISalesOrder>>("/sales/orders", payload),
  approveOrder: (id: string, payload: { status: "Approved" | "Rejected"; approvalNotes?: string; rejectionReason?: string }) =>
    api.patch<Single<ISalesOrder>>(`/sales/orders/${id}/approve`, payload),
  updateOrderStatus: (id: string, status: string, comment?: string) =>
    api.patch<Single<ISalesOrder>>(`/sales/orders/${id}/status`, { status, comment }),

  getInvoices: (params?: ListQuery) => api.get<Paginated<ISalesInvoice>>("/sales/invoices", q(params)),
  getInvoice: (id: string) => api.get<Single<ISalesInvoice>>(`/sales/invoices/${id}`),
  createInvoice: (payload: { salesOrderId: string; dueDate?: string; notes?: string }) =>
    api.post<Single<ISalesInvoice>>("/sales/invoices", payload),
  recordPayment: (id: string, payload: { amount: number; paymentDate?: string; method?: PaymentMethod; reference?: string; notes?: string }) =>
    api.post<Single<ISalesInvoice>>(`/sales/invoices/${id}/payments`, payload),
  cancelInvoice: (id: string) => api.patch<Single<ISalesInvoice>>(`/sales/invoices/${id}/cancel`),

  getHistory: (params?: ListQuery) => api.get<{ success: boolean; data: ISalesHistoryEvent[] }>("/sales/history", q(params)),
  getReports: (params?: ListQuery) => api.get<Single<ISalesReport>>("/sales/reports", q(params)),
};

// ==========================================
// DISPATCH
// ==========================================

export const dispatchService = {
  getDispatches: (params?: ListQuery) => api.get<Paginated<IDispatchOrder>>("/dispatch", q(params)),
  getDispatch: (id: string) => api.get<Single<IDispatchOrder>>(`/dispatch/${id}`),
  getTracking: (id: string) => api.get<Single<IDispatchTracking>>(`/dispatch/${id}/track`),
  createDispatch: (payload: Record<string, any>) => api.post<Single<IDispatchOrder>>("/dispatch", payload),
  updateTransport: (id: string, payload: ITransportDetails & { estimatedDeliveryDate?: string; plannedDispatchDate?: string }) =>
    api.put<Single<IDispatchOrder>>(`/dispatch/${id}/transport`, payload),
  updateStatus: (id: string, payload: { status: DispatchStatus; location?: string; note?: string; receivedBy?: string }) =>
    api.patch<Single<IDispatchOrder>>(`/dispatch/${id}/status`, payload),
  addDocument: (
    id: string,
    payload: { title: string; docType?: DispatchDocType; fileName: string; fileUrl: string; fileType?: string; fileSize?: number }
  ) => api.post<Single<IDispatchOrder>>(`/dispatch/${id}/documents`, payload),
  removeDocument: (id: string, documentId: string) => api.delete<Single<IDispatchOrder>>(`/dispatch/${id}/documents/${documentId}`),
  getReports: (params?: ListQuery) => api.get<Single<IDispatchReport>>("/dispatch/reports", q(params)),
};

// ==========================================
// DOCUMENTS & FILE UPLOAD
// ==========================================

export interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export const fileService = {
  upload: async (file: File): Promise<UploadedFile> => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<Single<UploadedFile>>("/files/upload", form);
    return res.data;
  },
};

export const documentService = {
  getDocuments: (params?: ListQuery) => api.get<Paginated<ILibraryDocument>>("/documents", q(params)),
  getStats: () => api.get<Single<IDocumentStats>>("/documents/stats"),
  getDocument: (id: string) => api.get<Single<ILibraryDocument>>(`/documents/${id}`),
  createDocument: (payload: Partial<ILibraryDocument> & { fileName: string; fileUrl: string; title: string }) =>
    api.post<Single<ILibraryDocument>>("/documents", payload),
  updateDocument: (id: string, payload: Partial<ILibraryDocument>) => api.put<Single<ILibraryDocument>>(`/documents/${id}`, payload),
  deleteDocument: (id: string) => api.delete<{ success: boolean }>(`/documents/${id}`),
};

// ==========================================
// REPORTS, DASHBOARD, NOTIFICATIONS & SEARCH
// ==========================================

export const reportService = {
  getReport: (type: ReportType, params?: ListQuery) => api.get<Single<IReportResult>>(`/reports/${type}`, q(params)),
  exportReport: (type: ReportType, format: "pdf" | "xlsx", params?: ListQuery) =>
    api.download(`/reports/${type}/export`, { ...(params || {}), format }),
};

export const dashboardService = {
  getSummary: () => api.get<Single<IDashboardSummary>>("/dashboard/summary"),
};

export const notificationApi = {
  list: (params?: ListQuery) =>
    api.get<Paginated<INotification> & { unread: number }>("/notifications", q(params)),
  unreadCount: () => api.get<Single<{ count: number }>>("/notifications/unread-count"),
  markRead: (id: string) => api.patch<Single<INotification>>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<{ success: boolean }>("/notifications/read-all"),
  dismiss: (id: string) => api.delete<{ success: boolean }>(`/notifications/${id}`),
  runReminders: () => api.post<Single<{ checked: number; sent: number }>>("/notifications/reminders/run", {}),
};

export const searchApi = {
  search: (query: string, limit = 5) => api.get<Single<ISearchResult>>("/search", { params: { q: query, limit } }),
};
