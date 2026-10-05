import { useState, useCallback, useEffect } from "react";
import productionService, { GetWorkOrdersParams } from "../services/productionService";
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

export function useProduction(initialParams: GetWorkOrdersParams = {}) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const fetchWorkOrders = useCallback(async (params: GetWorkOrdersParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await productionService.getWorkOrders(params);
      if (res.success) {
        setWorkOrders(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch work orders");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (factoryId?: string) => {
    try {
      const res = await productionService.getProductionStats(factoryId);
      if (res.success) {
        setStats(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load production stats:", err);
    }
  }, []);

  const createWorkOrder = async (input: CreateWorkOrderInput) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await productionService.createWorkOrder(input);
      if (res.success) {
        await fetchWorkOrders(initialParams);
        await fetchStats();
        return res.data;
      }
    } catch (err: any) {
      setError(err.message || "Failed to create work order");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const updateWorkOrderStage = async (id: string, stage: WorkOrderStage, status?: WorkOrderStatus) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await productionService.updateStage(id, stage, status);
      if (res.success) {
        setWorkOrders((prev) =>
          prev.map((wo) => (wo._id === id ? { ...wo, ...res.data } : wo))
        );
        await fetchStats();
        return res.data;
      }
    } catch (err: any) {
      setError(err.message || "Failed to update work order stage");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const consumeMaterial = async (id: string, input: ConsumeMaterialInput) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await productionService.consumeMaterial(id, input);
      if (res.success) {
        setWorkOrders((prev) =>
          prev.map((wo) => (wo._id === id ? { ...wo, ...res.data } : wo))
        );
        await fetchStats();
        return res.data;
      }
    } catch (err: any) {
      setError(err.message || "Failed to log material consumption");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const recordScrap = async (id: string, input: RecordScrapInput) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await productionService.recordScrap(id, input);
      if (res.success) {
        setWorkOrders((prev) =>
          prev.map((wo) => (wo._id === id ? { ...wo, ...res.data } : wo))
        );
        await fetchStats();
        return res.data;
      }
    } catch (err: any) {
      setError(err.message || "Failed to log scrap defect");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const completeWorkOrder = async (id: string, input: CompleteWorkOrderInput) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await productionService.completeWorkOrder(id, input);
      if (res.success) {
        setWorkOrders((prev) =>
          prev.map((wo) => (wo._id === id ? { ...wo, ...res.data } : wo))
        );
        await fetchStats();
        return res.data;
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete work order");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders(initialParams);
    fetchStats(initialParams.factoryId);
  }, [fetchWorkOrders, fetchStats, JSON.stringify(initialParams)]);

  return {
    workOrders,
    stats,
    loading,
    actionLoading,
    error,
    pagination,
    fetchWorkOrders,
    fetchStats,
    createWorkOrder,
    updateWorkOrderStage,
    consumeMaterial,
    recordScrap,
    completeWorkOrder,
  };
}

export default useProduction;
