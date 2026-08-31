export type FactoryStatus = "active" | "inactive" | "maintenance" | "closed";

export interface IFactoryLocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface IFactoryUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  phone?: string;
  status?: string;
}

export interface IFactory {
  _id: string;
  companyId?: string;
  name: string;
  code: string;
  description?: string;
  location?: IFactoryLocation;
  managerId?: IFactoryUser | string | null;
  contactEmail?: string;
  contactPhone?: string;
  capacity?: number; // Daily production quota units
  totalSqFt?: number;
  shiftCount?: number; // 1, 2, or 3
  workingDays?: string[];
  operatingHours?: string;
  status: FactoryStatus;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: IFactoryUser | string;
}

export interface CreateFactoryInput {
  name: string;
  code: string;
  description?: string;
  location?: IFactoryLocation;
  managerId?: string;
  contactEmail?: string;
  contactPhone?: string;
  capacity?: number;
  totalSqFt?: number;
  shiftCount?: number;
  workingDays?: string[];
  operatingHours?: string;
  status?: FactoryStatus;
}

export interface UpdateFactoryInput {
  name?: string;
  code?: string;
  description?: string;
  location?: IFactoryLocation;
  managerId?: string | null;
  contactEmail?: string;
  contactPhone?: string;
  capacity?: number;
  totalSqFt?: number;
  shiftCount?: number;
  workingDays?: string[];
  operatingHours?: string;
  status?: FactoryStatus;
}

export interface GetFactoriesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface GetFactoriesResponse {
  success: boolean;
  message?: string;
  data: IFactory[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
