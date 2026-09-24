export type CustomerType = "corporate" | "individual" | "distributor" | "government" | "enterprise";

export type CustomerStatus = "active" | "inactive" | "on_hold" | "lead" | "vip";

export type CreditStatus = "excellent" | "good" | "warning" | "credit_hold" | "suspended";

export type DocumentType = "contract" | "tax_certificate" | "nda" | "credit_application" | "purchase_order" | "other";

export type DocumentStatus = "valid" | "expiring_soon" | "expired" | "pending_review";

export type OrderStatus = "draft" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export type OrderPaymentStatus = "paid" | "pending" | "partially_paid" | "overdue";

export interface ICustomerDocument {
  _id: string;
  title: string;
  docType: DocumentType;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  uploadedAt: string;
  expiryDate?: string;
  status: DocumentStatus;
  notes?: string;
}

export interface ICustomerOrder {
  _id: string;
  orderNumber: string;
  date: string;
  totalAmount: number;
  currency?: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  itemsCount: number;
  itemsSummary?: string;
  deliveryDate?: string;
}

export interface ICreditStanding {
  limit: number;
  usedCredit: number;
  availableCredit: number;
  status: CreditStatus;
  score?: number;
  paymentTerms: string;
}

export interface ICustomerPrimaryContact {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface ICustomerAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface IAccountManager {
  id?: string;
  name: string;
  email?: string;
}

export interface ICustomer {
  _id: string;
  companyId?: string;
  name: string;
  code: string;
  customerType: CustomerType;
  status: CustomerStatus;
  creditStanding: ICreditStanding;
  primaryContact: ICustomerPrimaryContact;
  billingAddress: ICustomerAddress;
  shippingAddress?: ICustomerAddress;
  taxId?: string;
  accountManager?: IAccountManager;
  tags?: string[];
  notes?: string;
  totalOrdersCount?: number;
  totalRevenue?: number;
  documents?: ICustomerDocument[];
  orders?: ICustomerOrder[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GetCustomersResponse {
  success: boolean;
  data: ICustomer[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CustomerSingleResponse {
  success: boolean;
  data: ICustomer;
  message?: string;
}

export interface CustomerOrdersResponse {
  success: boolean;
  data: ICustomerOrder[];
  message?: string;
}

export interface CustomerDocumentResponse {
  success: boolean;
  data: ICustomerDocument;
  message?: string;
}
