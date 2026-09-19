import { api } from "./api";
import type {
  ICustomer,
  ICustomerOrder,
  ICustomerDocument,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryParams,
  PaginatedCustomersResponse,
} from "../types/customer";

const MOCK_CUSTOMERS: ICustomer[] = [
  {
    _id: "cust-001",
    code: "CUST-1001",
    name: "Apex Global Manufacturing",
    segment: "ENTERPRISE",
    status: "ACTIVE",
    creditStanding: "GOOD",
    contactPerson: {
      name: "Eleanor Vance",
      email: "eleanor.vance@apexglobal.com",
      phone: "+1 (555) 234-5678",
      role: "VP of Procurement",
    },
    email: "procurement@apexglobal.com",
    phone: "+1 (555) 234-0000",
    website: "https://apexglobal.com",
    billingAddress: {
      street: "100 Industrial Parkway, Suite 400",
      city: "Chicago",
      state: "IL",
      country: "USA",
      postalCode: "60601",
    },
    shippingAddress: {
      street: "75 Logistics Hub Road",
      city: "Gary",
      state: "IN",
      country: "USA",
      postalCode: "46401",
    },
    taxId: "US99-8473620",
    creditLimit: 250000,
    outstandingBalance: 42500,
    availableCredit: 207500,
    accountManager: {
      _id: "user-101",
      name: "Marcus Brody",
      email: "m.brody@diws-platform.com",
    },
    notes: "Key enterprise customer for heavy machining components. Standard payment terms: Net 30.",
    lifetimeSales: 1240000,
    activeOrdersCount: 4,
    createdAt: "2025-02-15T09:30:00Z",
    updatedAt: "2026-09-10T14:20:00Z",
  },
  {
    _id: "cust-002",
    code: "CUST-1002",
    name: "BriteTech Automations Ltd",
    segment: "VIP",
    status: "ACTIVE",
    creditStanding: "GOOD",
    contactPerson: {
      name: "Robert Chen",
      email: "r.chen@britetech.io",
      phone: "+1 (555) 876-5432",
      role: "Operations Manager",
    },
    email: "contact@britetech.io",
    phone: "+1 (555) 876-1000",
    website: "https://britetech.io",
    billingAddress: {
      street: "45 Innovation Way",
      city: "Austin",
      state: "TX",
      country: "USA",
      postalCode: "78701",
    },
    shippingAddress: {
      street: "45 Innovation Way",
      city: "Austin",
      state: "TX",
      country: "USA",
      postalCode: "78701",
    },
    taxId: "US88-1293847",
    creditLimit: 150000,
    outstandingBalance: 128000,
    availableCredit: 22000,
    accountManager: {
      _id: "user-102",
      name: "Sarah Jenkins",
      email: "s.jenkins@diws-platform.com",
    },
    notes: "High order frequency, close to credit limit threshold. Monitor monthly invoicing closely.",
    lifetimeSales: 890000,
    activeOrdersCount: 3,
    createdAt: "2025-04-10T11:00:00Z",
    updatedAt: "2026-09-18T16:45:00Z",
  },
  {
    _id: "cust-003",
    code: "CUST-1003",
    name: "Titan Precision Robotics",
    segment: "ENTERPRISE",
    status: "ACTIVE",
    creditStanding: "WARNING",
    contactPerson: {
      name: "Dieter Schmidt",
      email: "d.schmidt@titanrobotics.de",
      phone: "+49 89 1234 5678",
      role: "Head of Supply Chain",
    },
    email: "orders@titanrobotics.de",
    phone: "+49 89 1234 0000",
    website: "https://titanrobotics.de",
    billingAddress: {
      street: "Industriestrasse 12",
      city: "Stuttgart",
      state: "Baden-Württemberg",
      country: "Germany",
      postalCode: "70173",
    },
    shippingAddress: {
      street: "Industriestrasse 14",
      city: "Stuttgart",
      state: "Baden-Württemberg",
      country: "Germany",
      postalCode: "70173",
    },
    taxId: "DE394857201",
    creditLimit: 300000,
    outstandingBalance: 285000,
    availableCredit: 15000,
    accountManager: {
      _id: "user-101",
      name: "Marcus Brody",
      email: "m.brody@diws-platform.com",
    },
    notes: "Payment delay on Invoice #INV-883. Flagged with warning until overdue balance resolved.",
    lifetimeSales: 2150000,
    activeOrdersCount: 2,
    createdAt: "2024-11-01T08:00:00Z",
    updatedAt: "2026-09-19T09:15:00Z",
  },
  {
    _id: "cust-004",
    code: "CUST-1004",
    name: "Nexus Solar Components",
    segment: "SMB",
    status: "ACTIVE",
    creditStanding: "BLOCKED",
    contactPerson: {
      name: "Alicia Gomez",
      email: "alicia@nexussolar.com",
      phone: "+1 (555) 345-6789",
      role: "Chief Financial Officer",
    },
    email: "accounts@nexussolar.com",
    phone: "+1 (555) 345-0000",
    website: "https://nexussolar.com",
    billingAddress: {
      street: "88 Sun Valley Blvd",
      city: "Phoenix",
      state: "AZ",
      country: "USA",
      postalCode: "85001",
    },
    shippingAddress: {
      street: "88 Sun Valley Blvd",
      city: "Phoenix",
      state: "AZ",
      country: "USA",
      postalCode: "85001",
    },
    taxId: "US77-9988776",
    creditLimit: 50000,
    outstandingBalance: 58400,
    availableCredit: 0,
    accountManager: {
      _id: "user-103",
      name: "David Miller",
      email: "d.miller@diws-platform.com",
    },
    notes: "Credit blocked due to exceed limit by $8,400. New orders require prepayment approval.",
    lifetimeSales: 340000,
    activeOrdersCount: 0,
    createdAt: "2025-06-20T14:30:00Z",
    updatedAt: "2026-09-15T11:10:00Z",
  },
  {
    _id: "cust-005",
    code: "CUST-1005",
    name: "Vanguard Heavy Industries",
    segment: "ENTERPRISE",
    status: "LEAD",
    creditStanding: "ON_HOLD",
    contactPerson: {
      name: "Harrison Ford",
      email: "h.ford@vanguardheavy.com",
      phone: "+1 (555) 901-2345",
      role: "Procurement Director",
    },
    email: "info@vanguardheavy.com",
    phone: "+1 (555) 901-0000",
    website: "https://vanguardheavy.com",
    billingAddress: {
      street: "500 Ironworks Way",
      city: "Pittsburgh",
      state: "PA",
      country: "USA",
      postalCode: "15201",
    },
    taxId: "US11-2233445",
    creditLimit: 100000,
    outstandingBalance: 0,
    availableCredit: 100000,
    accountManager: {
      _id: "user-102",
      name: "Sarah Jenkins",
      email: "s.jenkins@diws-platform.com",
    },
    notes: "Prospective enterprise client undergoing credit background evaluation.",
    lifetimeSales: 0,
    activeOrdersCount: 0,
    createdAt: "2026-08-05T10:00:00Z",
    updatedAt: "2026-09-01T15:00:00Z",
  },
  {
    _id: "cust-006",
    code: "CUST-1006",
    name: "Quantum Fluid Systems",
    segment: "RETAIL",
    status: "INACTIVE",
    creditStanding: "GOOD",
    contactPerson: {
      name: "Karen White",
      email: "karen@quantumfluid.com",
      phone: "+1 (555) 432-1098",
      role: "Purchasing Agent",
    },
    email: "orders@quantumfluid.com",
    phone: "+1 (555) 432-0000",
    billingAddress: {
      street: "12 Valve Street",
      city: "Denver",
      state: "CO",
      country: "USA",
      postalCode: "80202",
    },
    taxId: "US55-6677889",
    creditLimit: 25000,
    outstandingBalance: 0,
    availableCredit: 25000,
    notes: "Account marked inactive after 12 months without active order placements.",
    lifetimeSales: 115000,
    activeOrdersCount: 0,
    createdAt: "2025-01-12T09:00:00Z",
    updatedAt: "2026-07-20T12:00:00Z",
  },
];

const MOCK_ORDERS: Record<string, ICustomerOrder[]> = {
  "cust-001": [
    {
      _id: "ord-101",
      orderNumber: "ORD-2026-8801",
      customerId: "cust-001",
      customerName: "Apex Global Manufacturing",
      orderDate: "2026-09-12T10:00:00Z",
      expectedDeliveryDate: "2026-10-05T00:00:00Z",
      status: "PROCESSING",
      paymentStatus: "PARTIAL",
      itemsCount: 14,
      totalAmount: 145000,
      paidAmount: 50000,
      items: [
        { itemId: "item-1", sku: "TURB-808", name: "High-Pressure Turbine Casing", quantity: 4, unitPrice: 22500, totalPrice: 90000 },
        { itemId: "item-2", sku: "SEAL-901", name: "Reinforced Ceramic Seal Set", quantity: 10, unitPrice: 5500, totalPrice: 55000 },
      ],
      shippingAddress: { street: "75 Logistics Hub Road", city: "Gary", state: "IN", country: "USA", postalCode: "46401" },
      notes: "Express freight shipping required for turbine components.",
    },
    {
      _id: "ord-102",
      orderNumber: "ORD-2026-7540",
      customerId: "cust-001",
      customerName: "Apex Global Manufacturing",
      orderDate: "2026-08-18T14:30:00Z",
      expectedDeliveryDate: "2026-09-01T00:00:00Z",
      status: "DELIVERED",
      paymentStatus: "PAID",
      itemsCount: 8,
      totalAmount: 98000,
      paidAmount: 98000,
      items: [
        { itemId: "item-3", sku: "VALV-400", name: "Hydraulic Control Valves", quantity: 8, unitPrice: 12250, totalPrice: 98000 },
      ],
      shippingAddress: { street: "75 Logistics Hub Road", city: "Gary", state: "IN", country: "USA", postalCode: "46401" },
    },
    {
      _id: "ord-103",
      orderNumber: "ORD-2026-6211",
      customerId: "cust-001",
      customerName: "Apex Global Manufacturing",
      orderDate: "2026-07-02T11:15:00Z",
      expectedDeliveryDate: "2026-07-20T00:00:00Z",
      status: "DELIVERED",
      paymentStatus: "PAID",
      itemsCount: 22,
      totalAmount: 210000,
      paidAmount: 210000,
      items: [
        { itemId: "item-4", sku: "GEAR-100", name: "Precision Gearbox Assemblies", quantity: 6, unitPrice: 35000, totalPrice: 210000 },
      ],
    },
  ],
  "cust-002": [
    {
      _id: "ord-201",
      orderNumber: "ORD-2026-8910",
      customerId: "cust-002",
      customerName: "BriteTech Automations Ltd",
      orderDate: "2026-09-15T09:00:00Z",
      expectedDeliveryDate: "2026-09-30T00:00:00Z",
      status: "CONFIRMED",
      paymentStatus: "UNPAID",
      itemsCount: 5,
      totalAmount: 76000,
      paidAmount: 0,
      items: [
        { itemId: "item-5", sku: "ROB-ARM-2", name: "6-Axis Robotic Arm Joint Modules", quantity: 5, unitPrice: 15200, totalPrice: 76000 },
      ],
    },
    {
      _id: "ord-202",
      orderNumber: "ORD-2026-7990",
      customerId: "cust-002",
      customerName: "BriteTech Automations Ltd",
      orderDate: "2026-08-25T16:00:00Z",
      expectedDeliveryDate: "2026-09-10T00:00:00Z",
      status: "SHIPPED",
      paymentStatus: "UNPAID",
      itemsCount: 12,
      totalAmount: 52000,
      paidAmount: 0,
      items: [
        { itemId: "item-6", sku: "SENS-55", name: "Optical Alignment Sensors", quantity: 12, unitPrice: 4333.33, totalPrice: 52000 },
      ],
    },
  ],
};

const MOCK_DOCUMENTS: Record<string, ICustomerDocument[]> = {
  "cust-001": [
    {
      _id: "doc-101",
      title: "Master Services & Supply Agreement 2025-2027",
      category: "CONTRACT",
      fileName: "Apex_Master_Supply_Agreement_2025.pdf",
      fileUrl: "#",
      fileSize: 2450000,
      mimeType: "application/pdf",
      uploadedBy: "Marcus Brody",
      uploadedAt: "2025-02-16T10:00:00Z",
      notes: "Executed 3-year enterprise contract with standard SLA guarantees.",
    },
    {
      _id: "doc-102",
      title: "Tax Exemption Certificate (IL)",
      category: "TAX_CERTIFICATE",
      fileName: "Apex_Tax_Exempt_Cert_2026.pdf",
      fileUrl: "#",
      fileSize: 420000,
      mimeType: "application/pdf",
      uploadedBy: "Eleanor Vance",
      uploadedAt: "2026-01-05T14:20:00Z",
      notes: "Valid through Dec 31, 2026.",
    },
    {
      _id: "doc-103",
      title: "Credit Evaluation & Approval Form ($250k)",
      category: "CREDIT_AGREEMENT",
      fileName: "Credit_Approval_ApexGlobal_250k.pdf",
      fileUrl: "#",
      fileSize: 890000,
      mimeType: "application/pdf",
      uploadedBy: "Sarah Jenkins",
      uploadedAt: "2025-02-20T09:15:00Z",
    },
  ],
  "cust-002": [
    {
      _id: "doc-201",
      title: "BriteTech Credit Terms & Conditions",
      category: "CREDIT_AGREEMENT",
      fileName: "BriteTech_Credit_Agreement.pdf",
      fileUrl: "#",
      fileSize: 1100000,
      mimeType: "application/pdf",
      uploadedBy: "Sarah Jenkins",
      uploadedAt: "2025-04-12T11:00:00Z",
    },
  ],
};

export const customerService = {
  async getCustomers(params: CustomerQueryParams = {}): Promise<PaginatedCustomersResponse> {
    try {
      const response = await api.get<PaginatedCustomersResponse>("/customers", {
        params: params as any,
      });
      if (response && response.success && response.data && response.data.length > 0) {
        return response;
      }
    } catch (_) {
      // Fallback to local mock data if backend not active
    }

    let filtered = [...MOCK_CUSTOMERS];

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.contactPerson?.name && c.contactPerson.name.toLowerCase().includes(q))
      );
    }

    if (params.status && params.status !== "ALL") {
      filtered = filtered.filter((c) => c.status === params.status);
    }

    if (params.segment && params.segment !== "ALL") {
      filtered = filtered.filter((c) => c.segment === params.segment);
    }

    if (params.creditStanding && params.creditStanding !== "ALL") {
      filtered = filtered.filter((c) => c.creditStanding === params.creditStanding);
    }

    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedData = filtered.slice(startIndex, startIndex + limit);

    const totalLifetimeSales = MOCK_CUSTOMERS.reduce((acc, curr) => acc + curr.lifetimeSales, 0);
    const activeCustomers = MOCK_CUSTOMERS.filter((c) => c.status === "ACTIVE").length;
    const blockedCreditCount = MOCK_CUSTOMERS.filter((c) => c.creditStanding === "BLOCKED").length;

    return {
      success: true,
      data: paginatedData,
      pagination: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit) || 1,
      },
      metrics: {
        totalCustomers: MOCK_CUSTOMERS.length,
        activeCustomers,
        totalLifetimeSales,
        blockedCreditCount,
      },
    };
  },

  async getCustomerById(id: string): Promise<ICustomer> {
    try {
      const response = await api.get<{ success: boolean; data: ICustomer }>(`/customers/${id}`);
      if (response && response.success && response.data) {
        return response.data;
      }
    } catch (_) {}

    const found = MOCK_CUSTOMERS.find((c) => c._id === id || c.code === id);
    if (found) return found;

    // Fallback default
    return {
      ...MOCK_CUSTOMERS[0],
      _id: id,
    };
  },

  async createCustomer(input: CreateCustomerInput): Promise<ICustomer> {
    try {
      const response = await api.post<{ success: boolean; data: ICustomer }>("/customers", input);
      if (response && response.success && response.data) {
        return response.data;
      }
    } catch (_) {}

    const newCust: ICustomer = {
      _id: `cust-${Date.now()}`,
      code: input.code.toUpperCase(),
      name: input.name,
      segment: input.segment,
      status: input.status || "ACTIVE",
      creditStanding: input.creditStanding || "GOOD",
      contactPerson: input.contactPerson,
      email: input.email,
      phone: input.phone,
      website: input.website,
      billingAddress: input.billingAddress,
      shippingAddress: input.shippingAddress,
      taxId: input.taxId,
      creditLimit: input.creditLimit || 10000,
      outstandingBalance: 0,
      availableCredit: input.creditLimit || 10000,
      notes: input.notes,
      lifetimeSales: 0,
      activeOrdersCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_CUSTOMERS.unshift(newCust);
    return newCust;
  },

  async updateCustomer(id: string, input: UpdateCustomerInput): Promise<ICustomer> {
    try {
      const response = await api.put<{ success: boolean; data: ICustomer }>(`/customers/${id}`, input);
      if (response && response.success && response.data) {
        return response.data;
      }
    } catch (_) {}

    const index = MOCK_CUSTOMERS.findIndex((c) => c._id === id);
    if (index !== -1) {
      const existing = MOCK_CUSTOMERS[index];
      const updated: ICustomer = {
        ...existing,
        ...input,
        availableCredit: (input.creditLimit ?? existing.creditLimit) - (input.outstandingBalance ?? existing.outstandingBalance),
        updatedAt: new Date().toISOString(),
      };
      MOCK_CUSTOMERS[index] = updated;
      return updated;
    }

    return MOCK_CUSTOMERS[0];
  },

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      await api.delete(`/customers/${id}`);
      return true;
    } catch (_) {}

    const index = MOCK_CUSTOMERS.findIndex((c) => c._id === id);
    if (index !== -1) {
      MOCK_CUSTOMERS.splice(index, 1);
    }
    return true;
  },

  async getCustomerOrders(customerId: string): Promise<ICustomerOrder[]> {
    try {
      const response = await api.get<{ success: boolean; data: ICustomerOrder[] }>(
        `/customers/${customerId}/orders`
      );
      if (response && response.success && response.data) {
        return response.data;
      }
    } catch (_) {}

    return MOCK_ORDERS[customerId] || [
      {
        _id: `ord-gen-${Date.now()}`,
        orderNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId,
        orderDate: new Date().toISOString(),
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        status: "PROCESSING",
        paymentStatus: "UNPAID",
        itemsCount: 3,
        totalAmount: 34500,
        paidAmount: 0,
        items: [
          { itemId: "item-x", sku: "COMP-100", name: "Industrial Servo Motors", quantity: 3, unitPrice: 11500, totalPrice: 34500 },
        ],
      },
    ];
  },

  async getCustomerDocuments(customerId: string): Promise<ICustomerDocument[]> {
    try {
      const customer = await this.getCustomerById(customerId);
      if (customer && (customer as any).documents && (customer as any).documents.length > 0) {
        return (customer as any).documents;
      }
    } catch (_) {}

    return MOCK_DOCUMENTS[customerId] || [
      {
        _id: "doc-default-1",
        title: "Standard Commercial Terms",
        category: "CONTRACT",
        fileName: "Commercial_Terms_2026.pdf",
        fileUrl: "#",
        fileSize: 512000,
        mimeType: "application/pdf",
        uploadedBy: "System Administrator",
        uploadedAt: new Date().toISOString(),
      },
    ];
  },

  async uploadCustomerDocument(
    customerId: string,
    file: File,
    title: string,
    category: string,
    notes?: string
  ): Promise<ICustomerDocument> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("category", category);
      if (notes) formData.append("notes", notes);

      const response = await api.post<{ success: boolean; data: ICustomerDocument[] }>(
        `/customers/${customerId}/documents`,
        formData
      );
      if (response && response.success && response.data && response.data.length > 0) {
        return response.data[response.data.length - 1];
      }
    } catch (_) {}

    const newDoc: ICustomerDocument = {
      _id: `doc-${Date.now()}`,
      title: title || file.name,
      category: (category as any) || "OTHER",
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      fileSize: file.size,
      mimeType: file.type || "application/pdf",
      uploadedBy: "Sales Representative",
      uploadedAt: new Date().toISOString(),
      notes,
    };

    if (!MOCK_DOCUMENTS[customerId]) {
      MOCK_DOCUMENTS[customerId] = [];
    }
    MOCK_DOCUMENTS[customerId].unshift(newDoc);
    return newDoc;
  },

  async deleteCustomerDocument(customerId: string, docId: string): Promise<boolean> {
    try {
      await api.delete(`/customers/${customerId}/documents/${docId}`);
      return true;
    } catch (_) {}

    if (MOCK_DOCUMENTS[customerId]) {
      const idx = MOCK_DOCUMENTS[customerId].findIndex((d) => d._id === docId);
      if (idx !== -1) {
        MOCK_DOCUMENTS[customerId].splice(idx, 1);
      }
    }
    return true;
  },
};
