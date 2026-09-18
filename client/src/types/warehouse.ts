export type WarehouseType = "raw_material" | "finished_goods" | "distribution" | "cold_storage" | "general";

export type WarehouseStatus = "active" | "inactive" | "maintenance" | "full" | "closed";

export interface IWarehouseLocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface IWarehouseManager {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  phone?: string;
  status?: string;
}

export interface IWarehouseUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export interface IWarehouse {
  _id: string;
  companyId?: string;
  name: string;
  code: string;
  type: WarehouseType;
  description?: string;
  address?: string;
  location?: IWarehouseLocation;
  capacity: number;
  currentUsage: number;
  availableCapacity?: number;
  utilizationPercentage?: number;
  managerId?: string | IWarehouseManager;
  contactEmail?: string;
  contactPhone?: string;
  status: WarehouseStatus;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface ITransferItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  unit?: string;
}

export interface IStockTransfer {
  _id?: string;
  transferNumber?: string;
  companyId?: string;
  sourceWarehouseId: string | Partial<IWarehouse>;
  destinationWarehouseId: string | Partial<IWarehouse>;
  items: ITransferItem[];
  totalQuantity?: number;
  transferDate?: string;
  status?: "pending" | "completed" | "cancelled";
  notes?: string;
  createdBy?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt?: string;
}

export interface GetWarehousesResponse {
  success: boolean;
  message?: string;
  data: IWarehouse[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WarehouseSingleResponse {
  success: boolean;
  message?: string;
  data: IWarehouse;
}
