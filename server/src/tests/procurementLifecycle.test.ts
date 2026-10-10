import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import User from '../models/User';
import Company from '../models/Company';
import Role from '../models/Role';
import Warehouse from '../models/Warehouse';
import Inventory from '../models/Inventory';
import StockMovement from '../models/StockMovement';
import Supplier from '../models/Supplier';
import PurchaseRequest from '../models/PurchaseRequest';
import PurchaseOrder from '../models/PurchaseOrder';
import GoodsReceiptNote from '../models/GoodsReceiptNote';
import PurchaseReturn from '../models/PurchaseReturn';

import { procurementService } from '../services/procurement.service';
import { purchaseRequestController } from '../controllers/purchaseRequest.controller';
import { purchaseOrderController } from '../controllers/purchaseOrder.controller';
import { grnController } from '../controllers/grn.controller';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'diws_access_token_secret_key_2026_industrial_workflow';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe('End-to-End Procurement Life-Cycle & Inventory Updates Test Suite', () => {
  let company: any;
  let companyId: string;
  let user: any;
  let userId: string;
  let authToken: string;
  let warehouse: any;
  let warehouseId: string;
  let supplier: any;
  let supplierId: string;

  beforeEach(async () => {
    // 1. Setup Company
    company = await Company.create({
      name: 'Apex Procurement Corp',
      code: 'APEX-PROC',
      email: 'procurement@apexcorp.com',
      phone: '+18005550199',
      address: '100 Industrial Parkway',
      city: 'Chicago',
      country: 'USA',
    });
    companyId = company._id.toString();

    // 2. Setup Role & User
    const adminRole = await Role.create({
      companyId: company._id,
      name: 'Admin',
      description: 'Full Access Admin',
      permissions: ['*'],
      isSystemRole: true,
    });

    user = await User.create({
      companyId: company._id,
      firstName: 'Jane',
      lastName: 'Procurement',
      email: 'jane.buyer@apexcorp.com',
      passwordHash: 'hashed_password_123',
      role: 'Company Admin',
      roles: [adminRole._id],
    });
    userId = user._id.toString();

    authToken = jwt.sign(
      {
        userId,
        email: user.email,
        companyId,
        role: 'Company Admin',
      },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Setup Warehouse
    warehouse = await Warehouse.create({
      companyId: company._id,
      code: 'WH-MAIN',
      name: 'Central Warehouse',
      capacity: 100000,
      createdBy: user._id,
    });
    warehouseId = warehouse._id.toString();

    // 4. Setup Supplier
    supplier = await Supplier.create({
      companyId: company._id,
      name: 'Acme Industrial Supplies',
      code: 'SUP-ACME',
      email: 'sales@acmeind.com',
      phone: '+18005559900',
      category: 'raw_material',
      status: 'active',
      rating: 5,
      complianceStatus: 'compliant',
      primaryContact: {
        name: 'John Acme',
        email: 'john@acmeind.com',
      },
      paymentTerms: 'Net 30',
      totalSpend: 0,
      totalOrders: 0,
      createdBy: user._id,
    });
    supplierId = supplier._id.toString();
  });

  // =========================================================================
  // SECTION 1: PURCHASE REQUEST TO PURCHASE ORDER LIFECYCLE
  // =========================================================================
  describe('1. Purchase Request to Purchase Order Lifecycle', () => {
    it('should create a Purchase Request and handle approval state transitions correctly', async () => {
      // Create PR via service
      const prInput = {
        warehouseId,
        department: 'Engineering',
        priority: 'high' as const,
        justification: 'Need raw materials for new production line',
        items: [
          {
            itemName: 'High Grade Steel Alloy Sheet',
            sku: 'STEEL-SHT-01',
            itemCategory: 'raw_material' as const,
            quantity: 100,
            unit: 'sheets',
            estimatedUnitPrice: 50,
          },
        ],
        status: 'Submitted' as const,
      };

      const pr = await procurementService.createPurchaseRequest(companyId, userId, prInput);

      expect(pr._id).toBeDefined();
      expect(pr.requestNumber).toMatch(/^PR-\d{4}-\d{4}$/);
      expect(pr.status).toBe('Submitted');
      expect(pr.totalEstimatedCost).toBe(5000);
      expect(pr.items[0].sku).toBe('STEEL-SHT-01');

      // Approve PR
      const approvedPR = await procurementService.approvePurchaseRequest(companyId, userId, pr._id.toString(), {
        status: 'Approved',
        approvalNotes: 'Approved by Engineering Lead',
      });

      expect(approvedPR.status).toBe('Approved');
      expect(approvedPR.approvedBy?.toString()).toBe(userId);
      expect(approvedPR.approvedAt).toBeDefined();
      expect(approvedPR.approvalNotes).toBe('Approved by Engineering Lead');

      // Attempting to approve again should throw error
      await expect(
        procurementService.approvePurchaseRequest(companyId, userId, pr._id.toString(), {
          status: 'Approved',
        })
      ).rejects.toThrow(/Cannot review purchase request/);
    });

    it('should support PR rejection state transition', async () => {
      const pr = await procurementService.createPurchaseRequest(companyId, userId, {
        warehouseId,
        items: [
          {
            itemName: 'Copper Wire Spool',
            sku: 'COPPER-WIRE-01',
            quantity: 10,
            estimatedUnitPrice: 100,
          },
        ],
        status: 'Submitted',
      });

      const rejectedPR = await procurementService.approvePurchaseRequest(companyId, userId, pr._id.toString(), {
        status: 'Rejected',
        rejectionReason: 'Budget allocation exceeded',
      });

      expect(rejectedPR.status).toBe('Rejected');
      expect(rejectedPR.rejectionReason).toBe('Budget allocation exceeded');
    });

    it('should create Purchase Order from Approved PR and link Supplier correctly', async () => {
      // 1. Create & Approve PR
      const pr = await procurementService.createPurchaseRequest(companyId, userId, {
        warehouseId,
        items: [
          {
            itemName: 'Aluminum Rod 20mm',
            sku: 'ALUM-ROD-20',
            itemCategory: 'raw_material',
            quantity: 200,
            unit: 'meters',
            estimatedUnitPrice: 15,
          },
        ],
        status: 'Submitted',
      });

      await procurementService.approvePurchaseRequest(companyId, userId, pr._id.toString(), {
        status: 'Approved',
      });

      // 2. Create PO referencing PR
      const poInput = {
        purchaseRequestId: pr._id.toString(),
        supplierId,
        warehouseId,
        paymentTerms: 'Net 45',
        shippingCost: 50,
        items: [
          {
            itemName: 'Aluminum Rod 20mm',
            sku: 'ALUM-ROD-20',
            itemCategory: 'raw_material' as const,
            quantityOrdered: 200,
            unit: 'meters',
            unitPrice: 14,
            taxRate: 10,
          },
        ],
      };

      const po = await procurementService.createPurchaseOrder(companyId, userId, poInput);

      expect(po._id).toBeDefined();
      expect(po.poNumber).toMatch(/^PO-\d{4}-\d{4}$/);
      expect(po.supplierId.toString()).toBe(supplierId);
      expect(po.warehouseId.toString()).toBe(warehouseId);
      expect(po.purchaseRequestId?.toString()).toBe(pr._id.toString());
      expect(po.status).toBe('PO Created');

      // Subtotal = 200 * 14 = 2800
      // Tax = 2800 * 10% = 280
      // Shipping = 50
      // Grand Total = 3130
      expect(po.subtotal).toBe(2800);
      expect(po.taxTotal).toBe(280);
      expect(po.grandTotal).toBe(3130);

      // Verify PR status transitioned to 'PO Created' and purchaseOrderId is linked
      const updatedPR = await PurchaseRequest.findById(pr._id);
      expect(updatedPR?.status).toBe('PO Created');
      expect(updatedPR?.purchaseOrderId?.toString()).toBe(po._id.toString());

      // Verify Supplier totalOrders incremented
      const updatedSupplier = await Supplier.findById(supplierId);
      expect(updatedSupplier?.totalOrders).toBe(1);
    });

    it('should reject PO creation if referenced PR is NOT approved', async () => {
      const draftPR = await procurementService.createPurchaseRequest(companyId, userId, {
        warehouseId,
        items: [{ itemName: 'Item A', sku: 'ITEM-A', quantity: 5, estimatedUnitPrice: 10 }],
        status: 'Draft',
      });

      await expect(
        procurementService.createPurchaseOrder(companyId, userId, {
          purchaseRequestId: draftPR._id.toString(),
          supplierId,
          warehouseId,
          items: [{ itemName: 'Item A', sku: 'ITEM-A', quantityOrdered: 5, unitPrice: 10 }],
        })
      ).rejects.toThrow(/PR must be 'Approved'/);
    });
  });

  // =========================================================================
  // SECTION 2: GOODS RECEIPT NOTE (GRN) PROCESSING & INVENTORY STOCK UPDATES
  // =========================================================================
  describe('2. Goods Receipt Note (GRN) Processing & Inventory Updates', () => {
    let po: any;

    beforeEach(async () => {
      // Setup PO with 100 units of STEEL-SHT-01
      const pr = await procurementService.createPurchaseRequest(companyId, userId, {
        warehouseId,
        items: [{ itemName: 'Steel Sheet 5mm', sku: 'STEEL-5MM', quantity: 100, estimatedUnitPrice: 40 }],
        status: 'Submitted',
      });

      await procurementService.approvePurchaseRequest(companyId, userId, pr._id.toString(), { status: 'Approved' });

      po = await procurementService.createPurchaseOrder(companyId, userId, {
        purchaseRequestId: pr._id.toString(),
        supplierId,
        warehouseId,
        items: [
          {
            itemName: 'Steel Sheet 5mm',
            sku: 'STEEL-5MM',
            itemCategory: 'raw_material',
            quantityOrdered: 100,
            unit: 'sheets',
            unitPrice: 40,
          },
        ],
      });
    });

    it('should process partial GRN receipt and auto-increment inventory stock', async () => {
      const grnInput = {
        purchaseOrderId: po._id.toString(),
        deliveryChallanNumber: 'DC-001',
        invoiceNumber: 'INV-1001',
        items: [
          {
            poItemId: po.items[0]._id.toString(),
            itemName: 'Steel Sheet 5mm',
            sku: 'STEEL-5MM',
            itemCategory: 'raw_material' as const,
            quantityOrdered: 100,
            quantityReceived: 40,
            quantityAccepted: 40,
            quantityRejected: 0,
            unit: 'sheets',
            unitCost: 40,
          },
        ],
      };

      const grn = await procurementService.createGRN(companyId, userId, grnInput);

      expect(grn._id).toBeDefined();
      expect(grn.grnNumber).toMatch(/^GRN-\d{4}-\d{4}$/);
      expect(grn.totalAcceptedCost).toBe(1600); // 40 * 40

      // Verify PO updated to 'Partial Delivery' and item quantityReceived = 40
      const updatedPO = await PurchaseOrder.findById(po._id);
      expect(updatedPO?.status).toBe('Partial Delivery');
      expect(updatedPO?.items[0].quantityReceived).toBe(40);

      // Verify Inventory Stock created/updated automatically
      const inventory = await Inventory.findOne({ companyId, warehouseId, sku: 'STEEL-5MM' });
      expect(inventory).toBeDefined();
      expect(inventory?.quantity).toBe(40);
      expect(inventory?.unitCost).toBe(40);
      expect(inventory?.totalValue).toBe(1600);

      // Verify StockMovement recorded
      const movement = await StockMovement.findOne({ companyId, warehouseId, sku: 'STEEL-5MM', type: 'stock_in' });
      expect(movement).toBeDefined();
      expect(movement?.quantity).toBe(40);
      expect(movement?.referenceNumber).toBe(grn.grnNumber);
    });

    it('should complete PO fulfillment upon second full GRN receipt', async () => {
      // 1. Partial GRN of 40
      await procurementService.createGRN(companyId, userId, {
        purchaseOrderId: po._id.toString(),
        items: [
          {
            poItemId: po.items[0]._id.toString(),
            itemName: 'Steel Sheet 5mm',
            sku: 'STEEL-5MM',
            itemCategory: 'raw_material',
            quantityOrdered: 100,
            quantityReceived: 40,
            quantityAccepted: 40,
            unitCost: 40,
          },
        ],
      });

      // 2. Second GRN for remaining 60
      const grn2 = await procurementService.createGRN(companyId, userId, {
        purchaseOrderId: po._id.toString(),
        items: [
          {
            poItemId: po.items[0]._id.toString(),
            itemName: 'Steel Sheet 5mm',
            sku: 'STEEL-5MM',
            itemCategory: 'raw_material',
            quantityOrdered: 100,
            quantityReceived: 60,
            quantityAccepted: 60,
            unitCost: 40,
          },
        ],
      });

      expect(grn2._id).toBeDefined();

      // PO should now be 'Goods Received'
      const updatedPO = await PurchaseOrder.findById(po._id);
      expect(updatedPO?.status).toBe('Goods Received');
      expect(updatedPO?.items[0].quantityReceived).toBe(100);

      // PR should also be 'Goods Received'
      const updatedPR = await PurchaseRequest.findById(po.purchaseRequestId);
      expect(updatedPR?.status).toBe('Goods Received');

      // Inventory should total 100
      const inventory = await Inventory.findOne({ companyId, warehouseId, sku: 'STEEL-5MM' });
      expect(inventory?.quantity).toBe(100);

      // Supplier totalSpend updated
      const updatedSupplier = await Supplier.findById(supplierId);
      expect(updatedSupplier?.totalSpend).toBe(4000); // (40 + 60) * 40
      expect(updatedSupplier?.purchaseHistory?.length || 0).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // SECTION 3: PURCHASE RETURNS & SUPPLIER BALANCES
  // =========================================================================
  describe('3. Purchase Returns & Supplier Balances', () => {
    let po: any;
    let grn: any;

    beforeEach(async () => {
      // Create PO & Receive 100 units
      const pr = await procurementService.createPurchaseRequest(companyId, userId, {
        warehouseId,
        items: [{ itemName: 'Hydraulic Valve', sku: 'HYD-VALVE-01', quantity: 100, estimatedUnitPrice: 100 }],
        status: 'Submitted',
      });
      await procurementService.approvePurchaseRequest(companyId, userId, pr._id.toString(), { status: 'Approved' });

      po = await procurementService.createPurchaseOrder(companyId, userId, {
        purchaseRequestId: pr._id.toString(),
        supplierId,
        warehouseId,
        items: [
          {
            itemName: 'Hydraulic Valve',
            sku: 'HYD-VALVE-01',
            itemCategory: 'components',
            quantityOrdered: 100,
            unit: 'pcs',
            unitPrice: 100,
          },
        ],
      });

      grn = await procurementService.createGRN(companyId, userId, {
        purchaseOrderId: po._id.toString(),
        items: [
          {
            poItemId: po.items[0]._id.toString(),
            itemName: 'Hydraulic Valve',
            sku: 'HYD-VALVE-01',
            itemCategory: 'components',
            quantityOrdered: 100,
            quantityReceived: 100,
            quantityAccepted: 100,
            unitCost: 100,
          },
        ],
      });
    });

    it('should return defective items, deduct stock, and adjust supplier credit/balance', async () => {
      // Current inventory stock = 100
      let inventory = await Inventory.findOne({ companyId, warehouseId, sku: 'HYD-VALVE-01' });
      expect(inventory?.quantity).toBe(100);

      let initialSupplier = await Supplier.findById(supplierId);
      expect(initialSupplier?.totalSpend).toBe(10000); // 100 * 100

      // Return 15 defective units
      const returnInput = {
        purchaseOrderId: po._id.toString(),
        grnId: grn._id.toString(),
        supplierId,
        warehouseId,
        reason: 'defective' as const,
        reasonDetails: 'Leaking oil pressure seals detected during testing',
        items: [
          {
            itemName: 'Hydraulic Valve',
            sku: 'HYD-VALVE-01',
            itemCategory: 'components' as const,
            quantityReturned: 15,
            unit: 'pcs',
            unitCost: 100,
            condition: 'defective',
          },
        ],
      };

      const purchaseReturn = await procurementService.createPurchaseReturn(companyId, userId, returnInput);

      expect(purchaseReturn._id).toBeDefined();
      expect(purchaseReturn.returnNumber).toMatch(/^PRN-\d{4}-\d{4}$/);
      expect(purchaseReturn.totalReturnAmount).toBe(1500); // 15 * 100
      expect(purchaseReturn.status).toBe('Completed');

      // 1. Verify Inventory Stock Deducted (100 - 15 = 85)
      inventory = await Inventory.findOne({ companyId, warehouseId, sku: 'HYD-VALVE-01' });
      expect(inventory?.quantity).toBe(85);
      expect(inventory?.totalValue).toBe(8500);

      // 2. Verify StockMovement recorded for stock_out
      const movement = await StockMovement.findOne({
        companyId,
        warehouseId,
        sku: 'HYD-VALVE-01',
        type: 'stock_out',
      });
      expect(movement).toBeDefined();
      expect(movement?.quantity).toBe(15);
      expect(movement?.referenceNumber).toBe(purchaseReturn.returnNumber);

      // 3. Verify Supplier Credit / Balance adjustment
      const updatedSupplier = await Supplier.findById(supplierId);
      expect(updatedSupplier?.totalSpend).toBe(8500); // 10000 - 1500

      // 4. Verify Supplier Purchase History contains the return adjustment entry
      const returnHistoryItem = (updatedSupplier?.purchaseHistory || []).find((h) => h.totalAmount === 1500);
      expect(returnHistoryItem).toBeDefined();
      expect(returnHistoryItem?.itemSummary).toContain('[RETURN - defective]');
    });
  });

  // =========================================================================
  // SECTION 4: CONTROLLERS & REST API ENDPOINTS VALIDATION
  // =========================================================================
  describe('4. Controller & HTTP API Endpoints Validation', () => {
    it('should test purchaseRequestController via HTTP API endpoints', async () => {
      // POST /api/procurement/requests
      const createRes = await request(app)
        .post('/api/procurement/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          department: 'Maintenance',
          priority: 'medium',
          items: [
            {
              itemName: 'Bearing 6205-2RS',
              sku: 'BEARING-6205',
              itemCategory: 'components',
              quantity: 50,
              estimatedUnitPrice: 10,
            },
          ],
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      const prId = createRes.body.data._id;

      // GET /api/procurement/requests/:id
      const getRes = await request(app)
        .get(`/api/procurement/requests/${prId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.requestNumber).toBeDefined();

      // PUT /api/procurement/requests/:id/approve
      const approveRes = await request(app)
        .put(`/api/procurement/requests/${prId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Approved',
          approvalNotes: 'Verified requirement',
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('Approved');
    });

    it('should test purchaseOrderController & grnController via HTTP API endpoints', async () => {
      // 1. Create Approved PR
      const pr = await procurementService.createPurchaseRequest(companyId, userId, {
        warehouseId,
        items: [{ itemName: 'Sensor Module', sku: 'SENS-MOD-01', quantity: 20, estimatedUnitPrice: 30 }],
        status: 'Submitted',
      });
      await procurementService.approvePurchaseRequest(companyId, userId, pr._id.toString(), { status: 'Approved' });

      // 2. POST /api/procurement/orders (Create PO)
      const poRes = await request(app)
        .post('/api/procurement/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          purchaseRequestId: pr._id.toString(),
          supplierId,
          warehouseId,
          items: [
            {
              itemName: 'Sensor Module',
              sku: 'SENS-MOD-01',
              itemCategory: 'components',
              quantityOrdered: 20,
              unitPrice: 30,
            },
          ],
        });

      expect(poRes.status).toBe(201);
      expect(poRes.body.success).toBe(true);
      const poId = poRes.body.data._id;

      // 3. POST /api/procurement/grn (Create GRN)
      const grnRes = await request(app)
        .post('/api/procurement/grn')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          purchaseOrderId: poId,
          items: [
            {
              itemName: 'Sensor Module',
              sku: 'SENS-MOD-01',
              itemCategory: 'components',
              quantityOrdered: 20,
              quantityReceived: 20,
              quantityAccepted: 20,
              unitCost: 30,
            },
          ],
        });

      expect(grnRes.status).toBe(201);
      expect(grnRes.body.success).toBe(true);

      // 4. POST /api/procurement/returns (Purchase Return)
      const returnRes = await request(app)
        .post('/api/procurement/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          purchaseOrderId: poId,
          supplierId,
          warehouseId,
          reason: 'damaged_in_transit',
          items: [
            {
              itemName: 'Sensor Module',
              sku: 'SENS-MOD-01',
              itemCategory: 'components',
              quantityReturned: 5,
              unitCost: 30,
            },
          ],
        });

      expect(returnRes.status).toBe(201);
      expect(returnRes.body.success).toBe(true);

      // 5. GET /api/procurement/suppliers/:id/history
      const historyRes = await request(app)
        .get(`/api/procurement/suppliers/${supplierId}/history`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.supplier._id).toBe(supplierId);
      expect(historyRes.body.summary.totalReturnsCount).toBe(1);
      expect(historyRes.body.summary.totalReturnedAmount).toBe(150);
    });

    it('should directly verify controller module exports purchaseRequestController, purchaseOrderController, and grnController', () => {
      expect(purchaseRequestController).toBeDefined();
      expect(typeof purchaseRequestController.createPurchaseRequest).toBe('function');
      expect(typeof purchaseRequestController.approvePurchaseRequest).toBe('function');

      expect(purchaseOrderController).toBeDefined();
      expect(typeof purchaseOrderController.createPurchaseOrder).toBe('function');
      expect(typeof purchaseOrderController.getPurchaseOrderById).toBe('function');

      expect(grnController).toBeDefined();
      expect(typeof grnController.createGRN).toBe('function');
    });
  });
});
