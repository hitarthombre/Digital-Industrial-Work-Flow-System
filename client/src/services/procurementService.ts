import { api } from "./api";
import type {
  IPurchaseRequest,
  IPurchaseOrder,
  IGRN,
  IPurchaseReturn,
  IPOLiveTracking,
  IProcurementReportSummary,
  CreatePRPayload,
  ApprovePRPayload,
  CreatePOPayload,
  UpdatePOStatusPayload,
  CreateGRNPayload,
  CreateReturnPayload,
  ProcurementFilterParams,
} from "../types/procurement";
import type { IPurchaseHistoryItem } from "../types/supplier";

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface SingleResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

class ProcurementService {
  // -------------------------------------------------------------
  // Purchase Requests (PR)
  // -------------------------------------------------------------

  async getPurchaseRequests(params?: ProcurementFilterParams): Promise<PaginatedResponse<IPurchaseRequest>> {
    return api.get<PaginatedResponse<IPurchaseRequest>>("/procurement/requests", {
      params: params as Record<string, string | number | boolean>,
    });
  }

  async getPurchaseRequestById(id: string): Promise<SingleResponse<IPurchaseRequest>> {
    return api.get<SingleResponse<IPurchaseRequest>>(`/procurement/requests/${id}`);
  }

  async createPurchaseRequest(payload: CreatePRPayload): Promise<SingleResponse<IPurchaseRequest>> {
    return api.post<SingleResponse<IPurchaseRequest>>("/procurement/requests", payload);
  }

  async approvePurchaseRequest(id: string, payload: ApprovePRPayload): Promise<SingleResponse<IPurchaseRequest>> {
    return api.put<SingleResponse<IPurchaseRequest>>(`/procurement/requests/${id}/approve`, payload);
  }

  // -------------------------------------------------------------
  // Purchase Orders (PO)
  // -------------------------------------------------------------

  async getPurchaseOrders(params?: ProcurementFilterParams): Promise<PaginatedResponse<IPurchaseOrder>> {
    return api.get<PaginatedResponse<IPurchaseOrder>>("/procurement/orders", {
      params: params as Record<string, string | number | boolean>,
    });
  }

  async getPurchaseOrderById(id: string): Promise<SingleResponse<IPurchaseOrder>> {
    return api.get<SingleResponse<IPurchaseOrder>>(`/procurement/orders/${id}`);
  }

  async createPurchaseOrder(payload: CreatePOPayload): Promise<SingleResponse<IPurchaseOrder>> {
    return api.post<SingleResponse<IPurchaseOrder>>("/procurement/orders", payload);
  }

  async updatePurchaseOrderStatus(id: string, payload: UpdatePOStatusPayload): Promise<SingleResponse<IPurchaseOrder>> {
    return api.put<SingleResponse<IPurchaseOrder>>(`/procurement/orders/${id}/status`, payload);
  }

  async trackPurchaseOrder(id: string): Promise<SingleResponse<IPOLiveTracking>> {
    return api.get<SingleResponse<IPOLiveTracking>>(`/procurement/orders/${id}/track`);
  }

  // -------------------------------------------------------------
  // Goods Receipt Note (GRN)
  // -------------------------------------------------------------

  async createGRN(payload: CreateGRNPayload): Promise<SingleResponse<IGRN>> {
    return api.post<SingleResponse<IGRN>>("/procurement/grn", payload);
  }

  // -------------------------------------------------------------
  // Purchase Returns
  // -------------------------------------------------------------

  async createPurchaseReturn(payload: CreateReturnPayload): Promise<SingleResponse<IPurchaseReturn>> {
    return api.post<SingleResponse<IPurchaseReturn>>("/procurement/returns", payload);
  }

  // -------------------------------------------------------------
  // Supplier Purchase History
  // -------------------------------------------------------------

  async getSupplierPurchaseHistory(supplierId: string): Promise<{ success: boolean; data: IPurchaseHistoryItem[] }> {
    return api.get<{ success: boolean; data: IPurchaseHistoryItem[] }>(`/procurement/suppliers/${supplierId}/history`);
  }

  // -------------------------------------------------------------
  // Reports & Analytics
  // -------------------------------------------------------------

  async getProcurementReports(): Promise<SingleResponse<IProcurementReportSummary>> {
    return api.get<SingleResponse<IProcurementReportSummary>>("/procurement/reports");
  }
}

export const procurementService = new ProcurementService();
export default procurementService;
