export type SupplierStatus = "active" | "inactive" | "under_review" | "blocked";

export type SupplierCategory =
  | "raw_material"
  | "components"
  | "packaging"
  | "machinery"
  | "logistics"
  | "services"
  | "other";

export type ComplianceStatus = "compliant" | "pending_audit" | "non_compliant";

export type DocumentType =
  | "contract"
  | "iso_certificate"
  | "tax_document"
  | "nda"
  | "quality_standard"
  | "audit_report"
  | "other";

export interface ISupplierContact {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

export interface ISupplierAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ISupplierDocument {
  _id: string;
  title: string;
  docType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedAt: string;
  expiryDate?: string;
  status: "valid" | "expiring_soon" | "expired";
  notes?: string;
}

export interface IPurchaseHistoryItem {
  _id: string;
  poNumber: string;
  date: string;
  itemSummary: string;
  itemsCount: number;
  totalAmount: number;
  currency?: string;
  status: "delivered" | "shipped" | "processing" | "cancelled";
  deliveryRating?: number;
  notes?: string;
}

export interface ISupplier {
  _id: string;
  companyId?: string;
  name: string;
  code: string;
  category: SupplierCategory;
  status: SupplierStatus;
  rating: number; // 1 - 5
  complianceStatus: ComplianceStatus;
  primaryContact: ISupplierContact;
  contacts?: ISupplierContact[];
  address?: ISupplierAddress;
  taxId?: string;
  paymentTerms?: string;
  tags?: string[];
  notes?: string;
  totalSpend?: number;
  totalOrders?: number;
  documents?: ISupplierDocument[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GetSuppliersResponse {
  success: boolean;
  message?: string;
  data: ISupplier[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SupplierSingleResponse {
  success: boolean;
  message?: string;
  data: ISupplier;
}

export interface PurchaseHistoryResponse {
  success: boolean;
  message?: string;
  data: IPurchaseHistoryItem[];
  stats?: {
    totalSpend: number;
    totalOrders: number;
    completedOrders: number;
    onTimeDeliveryRate: number;
    avgRating: number;
  };
}

export interface DocumentUploadResponse {
  success: boolean;
  message?: string;
  data: ISupplierDocument;
}
