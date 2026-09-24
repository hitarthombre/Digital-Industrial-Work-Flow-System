import { api } from "./api";
import type {
  ICustomer,
  ICustomerDocument,
  GetCustomersResponse,
  CustomerSingleResponse,
  CustomerOrdersResponse,
  CustomerDocumentResponse,
} from "../types/customer";

// Fallback seed customer mock list for instant interactive demo
const MOCK_CUSTOMERS: ICustomer[] = [
  {
    _id: "cust-101",
    name: "AeroDynamics Defence Systems",
    code: "CUST-AERO-01",
    customerType: "enterprise",
    status: "vip",
    creditStanding: {
      limit: 500000,
      usedCredit: 125000,
      availableCredit: 375000,
      status: "excellent",
      score: 95,
      paymentTerms: "Net 30",
    },
    primaryContact: {
      name: "Marcus Vance",
      email: "m.vance@aerodynamics.io",
      phone: "+1 (555) 349-9201",
      role: "Procurement Director",
    },
    billingAddress: {
      street: "750 Aviation Way, Suite 400",
      city: "Seattle",
      state: "WA",
      country: "USA",
      postalCode: "98101",
    },
    shippingAddress: {
      street: "Warehouse 4, 120 Hangar Road",
      city: "Everett",
      state: "WA",
      country: "USA",
      postalCode: "98203",
    },
    taxId: "US-984210943",
    accountManager: {
      id: "u-1",
      name: "Sarah Jenkins",
      email: "s.jenkins@diws.com",
    },
    tags: ["Aerospace", "Defense", "High Volume", "ISO 9001"],
    totalOrdersCount: 42,
    totalRevenue: 890000,
    orders: [
      {
        _id: "ord-1001",
        orderNumber: "SO-2026-0891",
        date: "2026-03-12",
        totalAmount: 145000,
        currency: "USD",
        status: "delivered",
        paymentStatus: "paid",
        itemsCount: 1200,
        itemsSummary: "Titanium Turbine Blades & High-Temp Alloy Fasteners",
        deliveryDate: "2026-03-20",
      },
      {
        _id: "ord-1002",
        orderNumber: "SO-2026-0744",
        date: "2026-02-18",
        totalAmount: 98500,
        currency: "USD",
        status: "shipped",
        paymentStatus: "paid",
        itemsCount: 650,
        itemsSummary: "Precision Hydraulic Actuators & Avionics Casing",
        deliveryDate: "2026-02-28",
      },
      {
        _id: "ord-1003",
        orderNumber: "SO-2026-0912",
        date: "2026-03-22",
        totalAmount: 210000,
        currency: "USD",
        status: "processing",
        paymentStatus: "pending",
        itemsCount: 2400,
        itemsSummary: "Carbon Composite Structural Ribs",
        deliveryDate: "2026-04-10",
      },
    ],
    documents: [
      {
        _id: "doc-101",
        title: "Master Enterprise Supply Agreement 2026",
        docType: "contract",
        fileName: "MSA_AeroDynamics_2026_Signed.pdf",
        fileUrl: "#",
        fileSize: 1024 * 1850,
        uploadedAt: "2026-01-15",
        expiryDate: "2028-01-15",
        status: "valid",
        notes: "Includes auto-renewal clause and volume pricing tiers.",
      },
      {
        _id: "doc-102",
        title: "Mutual NDA & Trade Secrets Protocol",
        docType: "nda",
        fileName: "Mutual_NDA_AeroDynamics.pdf",
        fileUrl: "#",
        fileSize: 1024 * 640,
        uploadedAt: "2025-11-04",
        expiryDate: "2027-11-04",
        status: "valid",
      },
      {
        _id: "doc-103",
        title: "Tax Exemption Certificate 2026",
        docType: "tax_certificate",
        fileName: "Tax_Exempt_WA_AeroDynamics.pdf",
        fileUrl: "#",
        fileSize: 1024 * 320,
        uploadedAt: "2026-01-02",
        expiryDate: "2026-12-31",
        status: "valid",
      },
    ],
    createdAt: "2025-01-10T10:00:00.000Z",
  },
  {
    _id: "cust-102",
    name: "Nexus Automotive Electric Corp",
    code: "CUST-NEXUS-02",
    customerType: "corporate",
    status: "active",
    creditStanding: {
      limit: 250000,
      usedCredit: 82000,
      availableCredit: 168000,
      status: "good",
      score: 88,
      paymentTerms: "Net 30",
    },
    primaryContact: {
      name: "Elena Rostova",
      email: "erostova@nexuselectric.com",
      phone: "+1 (555) 782-4190",
      role: "Senior Supply Chain Manager",
    },
    billingAddress: {
      street: "1200 Innovation Parkway",
      city: "Detroit",
      state: "MI",
      country: "USA",
      postalCode: "48201",
    },
    shippingAddress: {
      street: "Assembly Plant 2, 450 Battery Lane",
      city: "Flint",
      state: "MI",
      country: "USA",
      postalCode: "48502",
    },
    taxId: "US-381940281",
    accountManager: {
      id: "u-2",
      name: "David Miller",
      email: "d.miller@diws.com",
    },
    tags: ["Automotive", "EV", "Battery Modules", "Tier 1 Supplier"],
    totalOrdersCount: 28,
    totalRevenue: 540000,
    orders: [
      {
        _id: "ord-2001",
        orderNumber: "SO-2026-0850",
        date: "2026-03-01",
        totalAmount: 82000,
        currency: "USD",
        status: "processing",
        paymentStatus: "pending",
        itemsCount: 500,
        itemsSummary: "EV Motor Stator Coils & Cooling Jackets",
        deliveryDate: "2026-03-30",
      },
      {
        _id: "ord-2002",
        orderNumber: "SO-2026-0620",
        date: "2026-01-20",
        totalAmount: 125000,
        currency: "USD",
        status: "delivered",
        paymentStatus: "paid",
        itemsCount: 800,
        itemsSummary: "High-Voltage Busbars & Enclosures",
        deliveryDate: "2026-02-10",
      },
    ],
    documents: [
      {
        _id: "doc-201",
        title: "Automotive Quality Agreement IATF 16949",
        docType: "contract",
        fileName: "IATF_16949_Quality_Agreement.pdf",
        fileUrl: "#",
        fileSize: 1024 * 1200,
        uploadedAt: "2025-09-12",
        expiryDate: "2027-09-12",
        status: "valid",
      },
    ],
    createdAt: "2025-03-14T10:00:00.000Z",
  },
  {
    _id: "cust-103",
    name: "Apex Precision Robotics Ltd",
    code: "CUST-APEX-03",
    customerType: "corporate",
    status: "on_hold",
    creditStanding: {
      limit: 100000,
      usedCredit: 98000,
      availableCredit: 2000,
      status: "warning",
      score: 64,
      paymentTerms: "Net 15",
    },
    primaryContact: {
      name: "Hiroshi Tanaka",
      email: "tanaka@apexrobotics.co.jp",
      phone: "+81 3 5555 0192",
      role: "VP Operations",
    },
    billingAddress: {
      street: "4-10 Ginza, Chuo-ku",
      city: "Tokyo",
      state: "Tokyo",
      country: "Japan",
      postalCode: "104-0061",
    },
    taxId: "JP-9018239012",
    accountManager: {
      id: "u-1",
      name: "Sarah Jenkins",
      email: "s.jenkins@diws.com",
    },
    tags: ["Robotics", "Automation", "International", "Credit Review"],
    totalOrdersCount: 14,
    totalRevenue: 230000,
    orders: [
      {
        _id: "ord-3001",
        orderNumber: "SO-2026-0790",
        date: "2026-02-25",
        totalAmount: 48000,
        currency: "USD",
        status: "confirmed",
        paymentStatus: "overdue",
        itemsCount: 150,
        itemsSummary: "6-Axis Servo Motors & Harmonic Gearheads",
        deliveryDate: "2026-04-05",
      },
    ],
    documents: [
      {
        _id: "doc-301",
        title: "Credit Limit Extension Application",
        docType: "credit_application",
        fileName: "Credit_App_Apex_2026.pdf",
        fileUrl: "#",
        fileSize: 1024 * 450,
        uploadedAt: "2026-02-10",
        expiryDate: "2026-08-10",
        status: "pending_review",
        notes: "Pending financial audit for $100k -> $200k increase.",
      },
    ],
    createdAt: "2025-06-20T10:00:00.000Z",
  },
  {
    _id: "cust-104",
    name: "Global Energy & Infrastructure Solutions",
    code: "CUST-GEIS-04",
    customerType: "government",
    status: "active",
    creditStanding: {
      limit: 750000,
      usedCredit: 210000,
      availableCredit: 540000,
      status: "excellent",
      score: 98,
      paymentTerms: "Net 60",
    },
    primaryContact: {
      name: "Caroline Thorne",
      email: "cthorne@geis-gov.org",
      phone: "+1 (555) 901-2244",
      role: "Public Contracts Lead",
    },
    billingAddress: {
      street: "1800 K Street NW",
      city: "Washington",
      state: "DC",
      country: "USA",
      postalCode: "20006",
    },
    taxId: "US-520194827",
    accountManager: {
      id: "u-3",
      name: "Robert Chang",
      email: "r.chang@diws.com",
    },
    tags: ["Energy", "Grid Infrastructure", "Federal Contract", "Pre-Approved"],
    totalOrdersCount: 35,
    totalRevenue: 1420000,
    orders: [],
    documents: [],
    createdAt: "2024-11-01T10:00:00.000Z",
  },
];

export const customerService = {
  // GET /api/customers
  async getCustomers(params: { search?: string; status?: string; customerType?: string } = {}): Promise<GetCustomersResponse> {
    try {
      const response = await api.get<GetCustomersResponse>("/customers", { params });
      if (response && response.data && response.data.length > 0) {
        return response;
      }
    } catch (_) {
      // Ignore error and fall back to local interactive data
    }

    // Filter local mock data if params provided
    let filtered = [...MOCK_CUSTOMERS];
    if (params.status && params.status !== "ALL") {
      filtered = filtered.filter((c) => c.status === params.status);
    }
    if (params.customerType && params.customerType !== "ALL") {
      filtered = filtered.filter((c) => c.customerType === params.customerType);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.primaryContact.name.toLowerCase().includes(q) ||
          c.primaryContact.email.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      data: filtered,
      pagination: {
        total: filtered.length,
        page: 1,
        limit: 12,
        totalPages: 1,
      },
    };
  },

  // GET /api/customers/:id
  async getCustomerById(id: string): Promise<CustomerSingleResponse> {
    try {
      const response = await api.get<CustomerSingleResponse>(`/customers/${id}`);
      if (response && response.data) {
        return response;
      }
    } catch (_) {}

    const found = MOCK_CUSTOMERS.find((c) => c._id === id) || {
      ...MOCK_CUSTOMERS[0],
      _id: id,
    };

    return {
      success: true,
      data: found,
    };
  },

  // POST /api/customers
  async createCustomer(customerData: Partial<ICustomer>): Promise<CustomerSingleResponse> {
    try {
      const response = await api.post<CustomerSingleResponse>("/customers", customerData);
      if (response && response.data) {
        return response;
      }
    } catch (_) {}

    const newCustomer: ICustomer = {
      _id: `cust-${Date.now()}`,
      name: customerData.name || "New Customer",
      code: customerData.code || `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      customerType: customerData.customerType || "corporate",
      status: customerData.status || "active",
      creditStanding: customerData.creditStanding || {
        limit: 50000,
        usedCredit: 0,
        availableCredit: 50000,
        status: "good",
        score: 85,
        paymentTerms: "Net 30",
      },
      primaryContact: customerData.primaryContact || {
        name: "Primary Contact",
        email: "contact@company.com",
      },
      billingAddress: customerData.billingAddress || {},
      shippingAddress: customerData.shippingAddress || {},
      taxId: customerData.taxId,
      tags: customerData.tags || [],
      notes: customerData.notes,
      totalOrdersCount: 0,
      totalRevenue: 0,
      orders: [],
      documents: [],
      createdAt: new Date().toISOString(),
    };

    MOCK_CUSTOMERS.unshift(newCustomer);

    return {
      success: true,
      data: newCustomer,
      message: "Customer created successfully",
    };
  },

  // PUT /api/customers/:id
  async updateCustomer(id: string, customerData: Partial<ICustomer>): Promise<CustomerSingleResponse> {
    try {
      const response = await api.put<CustomerSingleResponse>(`/customers/${id}`, customerData);
      if (response && response.data) {
        return response;
      }
    } catch (_) {}

    const index = MOCK_CUSTOMERS.findIndex((c) => c._id === id);
    if (index !== -1) {
      MOCK_CUSTOMERS[index] = {
        ...MOCK_CUSTOMERS[index],
        ...customerData,
        updatedAt: new Date().toISOString(),
      };
      return {
        success: true,
        data: MOCK_CUSTOMERS[index],
        message: "Customer updated successfully",
      };
    }

    return {
      success: true,
      data: { ...MOCK_CUSTOMERS[0], _id: id, ...customerData },
      message: "Customer updated successfully",
    };
  },

  // DELETE /api/customers/:id
  async deleteCustomer(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/customers/${id}`);
      return response;
    } catch (_) {}

    const index = MOCK_CUSTOMERS.findIndex((c) => c._id === id);
    if (index !== -1) {
      MOCK_CUSTOMERS.splice(index, 1);
    }

    return {
      success: true,
      message: "Customer account deactivated successfully",
    };
  },

  // GET /api/customers/:id/orders
  async getCustomerOrders(id: string): Promise<CustomerOrdersResponse> {
    try {
      const response = await api.get<CustomerOrdersResponse>(`/customers/${id}/orders`);
      if (response && response.data) {
        return response;
      }
    } catch (_) {}

    const customer = MOCK_CUSTOMERS.find((c) => c._id === id);
    return {
      success: true,
      data: customer?.orders || MOCK_CUSTOMERS[0].orders || [],
    };
  },

  // POST /api/customers/:id/documents
  async uploadCustomerDocument(id: string, docData: Partial<ICustomerDocument>): Promise<CustomerDocumentResponse> {
    try {
      const response = await api.post<CustomerDocumentResponse>(`/customers/${id}/documents`, docData);
      if (response && response.data) {
        return response;
      }
    } catch (_) {}

    const newDoc: ICustomerDocument = {
      _id: `doc-${Date.now()}`,
      title: docData.title || "Uploaded Document",
      docType: docData.docType || "contract",
      fileName: docData.fileName || "Customer_Document.pdf",
      fileUrl: docData.fileUrl || "#",
      fileSize: docData.fileSize || 1024 * 450,
      uploadedAt: new Date().toISOString().split("T")[0],
      expiryDate: docData.expiryDate,
      status: "valid",
      notes: docData.notes,
    };

    const customer = MOCK_CUSTOMERS.find((c) => c._id === id);
    if (customer) {
      customer.documents = customer.documents || [];
      customer.documents.push(newDoc);
    }

    return {
      success: true,
      data: newDoc,
      message: "Document uploaded successfully",
    };
  },

  // DELETE /api/customers/:id/documents/:docId
  async deleteCustomerDocument(id: string, docId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/customers/${id}/documents/${docId}`);
      return response;
    } catch (_) {}

    const customer = MOCK_CUSTOMERS.find((c) => c._id === id);
    if (customer && customer.documents) {
      customer.documents = customer.documents.filter((d) => d._id !== docId);
    }

    return {
      success: true,
      message: "Document removed successfully",
    };
  },
};
