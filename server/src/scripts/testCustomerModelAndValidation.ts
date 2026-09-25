import { Customer } from "../models/Customer";
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  UploadDocumentSchema,
  CreateOrderSchema,
} from "../controllers/customer.controller";
import { Types } from "mongoose";

async function runTests() {
  console.log("=================================================");
  console.log("   CUSTOMER MANAGEMENT API & MODEL TEST SUITE   ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Model Schema Instantiation with Acceptance Criteria Fields
  console.log("--- 1. Testing Customer Model & Schema Fields ---");
  const testCompanyId = new Types.ObjectId();
  const testUserId = new Types.ObjectId();

  const customerDoc = new Customer({
    companyId: testCompanyId,
    companyName: "Acme Industrial Aerospace Corp",
    contactName: "Marcus Vance",
    email: "m.vance@acme.com",
    phone: "+1 555-0199",
    billingAddress: {
      street: "100 Aerospace Blvd",
      city: "Seattle",
      state: "WA",
      country: "USA",
      postalCode: "98101",
    },
    creditLimit: 75000,
    status: "active",
    code: "CUST-ACME-01",
    createdBy: testUserId,
  });

  // Run validation
  await customerDoc.validate();

  assert(customerDoc.name === "Acme Industrial Aerospace Corp", "Model synchronizes name from companyName");
  assert(customerDoc.companyName === "Acme Industrial Aerospace Corp", "companyName field exists and is populated");
  assert(customerDoc.contactName === "Marcus Vance", "contactName field exists and is populated");
  assert(customerDoc.primaryContact.name === "Marcus Vance", "primaryContact.name synchronized with contactName");
  assert(customerDoc.email === "m.vance@acme.com", "email field exists and is populated");
  assert(customerDoc.primaryContact.email === "m.vance@acme.com", "primaryContact.email synchronized with email");
  assert(customerDoc.phone === "+1 555-0199", "phone field exists and is populated");
  assert(customerDoc.creditLimit === 75000, "creditLimit field exists and is populated");
  assert(customerDoc.creditStanding.limit === 75000, "creditStanding.limit synchronized with creditLimit");
  assert(customerDoc.creditStanding.availableCredit === 75000, "creditStanding.availableCredit correctly calculated");
  assert(customerDoc.status === "active", "status field is 'active'");
  assert(customerDoc.billingAddress.city === "Seattle", "billingAddress is correctly populated");

  // TEST 2: Credit Status Method
  console.log("\n--- 2. Testing Customer Credit Status Method ---");
  const creditStatus = customerDoc.getCreditStatus();
  assert(creditStatus.limit === 75000, "Credit status reports correct credit limit");
  assert(creditStatus.usedCredit === 0, "Credit status reports correct initial used credit");
  assert(creditStatus.availableCredit === 75000, "Credit status reports correct available credit");
  assert(creditStatus.utilizationPercentage === 0, "Credit utilization percentage is 0%");
  assert(creditStatus.status === "good", "Credit status rating is 'good'");
  assert(!creditStatus.isCreditHold, "isCreditHold is false for healthy active customer");

  // Test credit hold behavior
  customerDoc.creditStanding.usedCredit = 80000; // exceeding limit
  customerDoc.status = "on_hold";
  await customerDoc.validate();
  const holdStatus = customerDoc.getCreditStatus();
  assert(holdStatus.isCreditHold === true, "isCreditHold is true when on_hold or exceeding credit limit");

  // TEST 3: Orders Subdocument Array
  console.log("\n--- 3. Testing Orders Subdocument Schema ---");
  customerDoc.orders = [
    {
      orderNumber: "SO-2026-0001",
      date: new Date(),
      totalAmount: 12500,
      currency: "USD",
      status: "confirmed",
      paymentStatus: "pending",
      itemsCount: 50,
      itemsSummary: "Industrial Bearings & Shafts",
    } as any,
  ];
  assert(customerDoc.orders.length === 1, "Orders array stores customer orders");
  assert(customerDoc.orders[0].orderNumber === "SO-2026-0001", "Order number is recorded");
  assert(customerDoc.orders[0].totalAmount === 12500, "Order amount is recorded");

  // TEST 4: Documents Subdocument Array
  console.log("\n--- 4. Testing Document Vault Subdocument Schema ---");
  customerDoc.documents = [
    {
      title: "Master Supply Agreement 2026",
      docType: "contract",
      fileName: "MSA_2026.pdf",
      fileUrl: "/uploads/msa_2026.pdf",
      fileSize: 1024 * 500,
      uploadedAt: new Date(),
      status: "valid",
    } as any,
  ];
  assert(customerDoc.documents.length === 1, "Documents array stores customer documents");
  assert(customerDoc.documents[0].docType === "contract", "Document type is 'contract'");
  assert(customerDoc.documents[0].fileName === "MSA_2026.pdf", "Document fileName is preserved");

  // TEST 5: Zod Schema Validation
  console.log("\n--- 5. Testing Request Validation Schemas ---");
  // Valid payload with acceptance criteria fields
  const validCreate = CreateCustomerSchema.safeParse({
    companyName: "Apex Dynamics Corp",
    contactName: "John Doe",
    email: "john@apex.com",
    phone: "+1 555-1234",
    creditLimit: 50000,
    status: "active",
    billingAddress: {
      street: "123 Main St",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
    },
  });
  assert(validCreate.success, "CreateCustomerSchema accepts acceptance criteria fields");

  // Invalid payload (no name or companyName)
  const invalidCreate = CreateCustomerSchema.safeParse({
    contactName: "John Doe",
    email: "john@apex.com",
  });
  assert(!invalidCreate.success, "CreateCustomerSchema rejects payload without name or companyName");

  // Negative credit limit
  const negativeCredit = CreateCustomerSchema.safeParse({
    name: "Valid Corp",
    creditLimit: -500,
  });
  assert(!negativeCredit.success, "CreateCustomerSchema rejects negative credit limit");

  // Upload document schema
  const validDoc = UploadDocumentSchema.safeParse({
    title: "ISO 9001 Certificate",
    docType: "contract",
    fileName: "cert.pdf",
  });
  assert(validDoc.success, "UploadDocumentSchema accepts valid document payload");

  // Create order schema
  const validOrder = CreateOrderSchema.safeParse({
    orderNumber: "SO-2026-9999",
    totalAmount: 45000,
    itemsCount: 10,
    status: "confirmed",
  });
  assert(validOrder.success, "CreateOrderSchema accepts valid sales order payload");

  console.log("\n=================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
