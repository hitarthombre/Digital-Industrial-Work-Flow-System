export type CustomerStatus = "ACTIVE" | "INACTIVE" | "LEAD";
export type CreditStanding = "GOOD" | "WARNING" | "BLOCKED" | "ON_HOLD";
export type CustomerSegment = "ENTERPRISE" | "SMB" | "VIP" | "RETAIL";
export type OrderStatus = "DRAFT" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PAID" | "UNPAID" | "PARTIAL" | "OVERDUE" | "REFUNDED";
export type DocumentCategory = "CONTRACT" | "TAX_CERTIFICATE" | "CREDIT_AGREEMENT" | "INVOICE" | "PO" | "OTHER";

export interface ICustomerAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ICustomerDocument {
  _id: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: string;
  uploadedAt: string;
  notes?: string;
}

export interface ICustomerOrderItem {
  itemId?: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ICustomerOrder {
  _id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  itemsCount: number;
  totalAmount: number;
  paidAmount?: number;
  items?: ICustomerOrderItem[];
  shippingAddress?: ICustomerAddress;
  notes?: string;
}

export interface ICustomer {
  _id: string;
  companyId?: string;
  code: string; // e.g. CUST-1001
  name: string;
  segment: CustomerSegment;
  status: CustomerStatus;
  creditStanding: CreditStanding;
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  email?: string;
  phone?: string;
  website?: string;
  billingAddress?: ICustomerAddress;
  shippingAddress?: ICustomerAddress;
  taxId?: string;
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;
  accountManager?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  notes?: string;
  lifetimeSales: number;
  activeOrdersCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerInput {
  name: string;
  code: string;
  segment: CustomerSegment;
  status?: CustomerStatus;
  creditStanding?: CreditStanding;
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  email?: string;
  phone?: string;
  website?: string;
  billingAddress?: ICustomerAddress;
  shippingAddress?: ICustomerAddress;
  taxId?: string;
  creditLimit?: number;
  accountManagerId?: string;
  notes?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  outstandingBalance?: number;
}

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  segment?: string;
  creditStanding?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedCustomersResponse {
  success: boolean;
  data: ICustomer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  metrics?: {
    totalCustomers: number;
    activeCustomers: number;
    totalLifetimeSales: number;
    blockedCreditCount: number;
  };
}
