import { api } from "./api";
import {
  WorkOrder,
  ProductionStats,
  CreateWorkOrderInput,
  ConsumeMaterialInput,
  RecordScrapInput,
  CompleteWorkOrderInput,
  WorkOrderStage,
  WorkOrderStatus,
} from "../types/production";

export interface GetWorkOrdersParams {
  factoryId?: string;
  status?: string;
  stage?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface WorkOrdersResponse {
  success: boolean;
  data: WorkOrder[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export const productionService = {
  async getWorkOrders(params: GetWorkOrdersParams = {}): Promise<WorkOrdersResponse> {
    return api.get<WorkOrdersResponse>("/production/work-orders", {
      params: params as Record<string, string | number | boolean>,
    });
  },

  async getWorkOrderById(id: string): Promise<{ success: boolean; data: WorkOrder }> {
    return api.get<{ success: boolean; data: WorkOrder }>(`/production/work-orders/${id}`);
  },

  async createWorkOrder(data: CreateWorkOrderInput): Promise<{ success: boolean; message: string; data: WorkOrder }> {
    return api.post<{ success: boolean; message: string; data: WorkOrder }>("/production/work-orders", data);
  },

  async updateStage(
    id: string,
    stage: WorkOrderStage,
    status?: WorkOrderStatus
  ): Promise<{ success: boolean; message: string; data: WorkOrder }> {
    return api.patch<{ success: boolean; message: string; data: WorkOrder }>(
      `/production/work-orders/${id}/stage`,
      { stage, status }
    );
  },

  async consumeMaterial(
    id: string,
    data: ConsumeMaterialInput
  ): Promise<{ success: boolean; message: string; data: WorkOrder }> {
    return api.post<{ success: boolean; message: string; data: WorkOrder }>(
      `/production/work-orders/${id}/consume-material`,
      data
    );
  },

  async recordScrap(
    id: string,
    data: RecordScrapInput
  ): Promise<{ success: boolean; message: string; data: WorkOrder }> {
    return api.post<{ success: boolean; message: string; data: WorkOrder }>(
      `/production/work-orders/${id}/record-scrap`,
      data
    );
  },

  async completeWorkOrder(
    id: string,
    data: CompleteWorkOrderInput
  ): Promise<{ success: boolean; message: string; data: WorkOrder }> {
    return api.post<{ success: boolean; message: string; data: WorkOrder }>(
      `/production/work-orders/${id}/complete`,
      data
    );
  },

  async getProductionStats(factoryId?: string): Promise<{ success: boolean; data: ProductionStats }> {
    return api.get<{ success: boolean; data: ProductionStats }>("/production/stats", {
      params: factoryId ? { factoryId } : undefined,
    });
  },
};

export default productionService;
