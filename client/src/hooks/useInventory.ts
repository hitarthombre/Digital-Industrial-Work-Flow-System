import { useState, useEffect, useCallback } from "react";
import { inventoryService } from "../services/inventoryService";
import type {
  StockLevelItem,
  IStockMovementItem,
  ILowStockAlert,
  InventoryReportData,
  InventoryFilterParams,
  StockInInput,
  StockOutInput,
  StockTransferInput,
  StockAdjustmentInput,
} from "../services/inventoryService";

/**
 * Hook for fetching Raw Materials Inventory
 */
export function useRawMaterials(params: InventoryFilterParams = {}) {
  const [data, setData] = useState<StockLevelItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRawMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryService.getRawMaterials(params);
      if (res.data) setData(res.data);
      if (res.summary) setSummary(res.summary);
      if (res.pagination) setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load raw materials");
    } finally {
      setLoading(false);
    }
  }, [params.search, params.status, params.warehouseId, params.page]);

  useEffect(() => {
    fetchRawMaterials();
  }, [fetchRawMaterials]);

  return { data, summary, pagination, loading, error, refetch: fetchRawMaterials };
}

/**
 * Hook for fetching Finished Goods Inventory
 */
export function useFinishedGoods(params: InventoryFilterParams = {}) {
  const [data, setData] = useState<StockLevelItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinishedGoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryService.getFinishedGoods(params);
      if (res.data) setData(res.data);
      if (res.summary) setSummary(res.summary);
      if (res.pagination) setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load finished goods");
    } finally {
      setLoading(false);
    }
  }, [params.search, params.status, params.warehouseId, params.page]);

  useEffect(() => {
    fetchFinishedGoods();
  }, [fetchFinishedGoods]);

  return { data, summary, pagination, loading, error, refetch: fetchFinishedGoods };
}

/**
 * Hook for fetching Stock Movement Audit History & Timeline
 */
export function useInventoryHistory(params: InventoryFilterParams = {}) {
  const [movements, setMovements] = useState<IStockMovementItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryService.getHistory(params);
      if (res.data) setMovements(res.data);
      if (res.stats) setStats(res.stats);
      if (res.pagination) setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load stock movement history");
    } finally {
      setLoading(false);
    }
  }, [params.search, params.type, params.itemCategory, params.warehouseId, params.page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { movements, stats, pagination, loading, error, refetch: fetchHistory };
}

/**
 * Hook for Low Stock Alerts & Notifications
 */
export function useLowStockAlerts(params: InventoryFilterParams = {}) {
  const [alerts, setAlerts] = useState<ILowStockAlert[]>([]);
  const [summary, setSummary] = useState<{ totalActiveAlerts: number; criticalCount: number; warningCount: number }>({
    totalActiveAlerts: 0,
    criticalCount: 0,
    warningCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryService.getLowStockAlerts(params);
      if (res.data) setAlerts(res.data);
      if (res.summary) setSummary(res.summary);
    } catch (err: any) {
      setError(err.message || "Failed to load low stock alerts");
    } finally {
      setLoading(false);
    }
  }, [params.status]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, summary, loading, error, refetch: fetchAlerts };
}

/**
 * Hook for Inventory Consolidated Reports & Metrics
 */
export function useInventoryReports() {
  const [report, setReport] = useState<InventoryReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getReports();
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { report, loading, error, refetch: fetchReports };
}

/**
 * Mutation Hooks for Inventory Operations
 */
export function useStockInMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (input: StockInInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryService.stockIn(input);
      return res;
    } catch (err: any) {
      setError(err.message || "Stock In failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}

export function useStockOutMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (input: StockOutInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryService.stockOut(input);
      return res;
    } catch (err: any) {
      setError(err.message || "Stock Out failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}

export function useStockTransferMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (input: StockTransferInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryService.transfer(input);
      return res;
    } catch (err: any) {
      setError(err.message || "Stock Transfer failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}

export function useStockAdjustmentMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (input: StockAdjustmentInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryService.adjust(input);
      return res;
    } catch (err: any) {
      setError(err.message || "Stock Adjustment failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}
