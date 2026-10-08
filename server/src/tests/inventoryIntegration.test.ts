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
import StockTransfer from '../models/StockTransfer';
import StockAdjustment from '../models/StockAdjustment';
import LowStockAlert from '../models/LowStockAlert';
import AuditLog from '../models/AuditLog';

import { inventoryService } from '../services/inventory.service';
import { warehouseService } from '../services/warehouse.service';

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

describe('Real-Time Inventory Management & Multi-Warehouse Integration Test Suite', () => {
  let companyA: any;
  let companyB: any;
  let companyIdA: string;
  let companyIdB: string;

  let userA: any;
  let userB: any;
  let userIdA: string;
  let userIdB: string;
  let tokenA: string;
  let tokenB: string;

  let warehouseNorth: any;
  let warehouseSouth: any;
  let warehouseOtherCompany: any;

  beforeEach(async () => {
    // 1. Setup Company A
    companyA = await Company.create({
      name: 'Apex Global Logistics Ltd',
      code: 'APEX-GLOBAL',
      email: 'ops@apexglobal.com',
      phone: '+919876543210',
      address: '100 Industrial Corridor',
      city: 'Mumbai',
      country: 'India',
    });
    companyIdA = companyA._id.toString();

    // Setup Company B for multi-tenant isolation testing
    companyB = await Company.create({
      name: 'Rival Industrial Corp',
      code: 'RIVAL-CORP',
      email: 'info@rivalcorp.com',
      phone: '+919988776655',
      address: '200 Competitor Way',
      city: 'Delhi',
      country: 'India',
    });
    companyIdB = companyB._id.toString();

    // 2. Setup Roles and Users
    const adminRole = await Role.create({
      companyId: companyA._id,
      name: 'Company Admin',
      description: 'Full Administrative Privileges',
      permissions: [
        'warehouses:read',
        'warehouses:create',
        'warehouses:update',
        'warehouses:delete',
        'warehouses:transfer',
      ],
      isSystemRole: false,
    });

    userA = await User.create({
      companyId: companyA._id,
      roleId: adminRole._id,
      firstName: 'Inventory',
      lastName: 'Manager',
      email: 'inv.manager@apexglobal.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Company Admin',
      status: 'active',
    });
    userIdA = userA._id.toString();

    userB = await User.create({
      companyId: companyB._id,
      firstName: 'Rival',
      lastName: 'Admin',
      email: 'admin@rivalcorp.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Company Admin',
      status: 'active',
    });
    userIdB = userB._id.toString();

    // Generate JWT Auth Tokens
    tokenA = jwt.sign(
      { userId: userIdA, companyId: companyIdA, roleId: adminRole._id.toString(), role: 'Company Admin' },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    tokenB = jwt.sign(
      { userId: userIdB, companyId: companyIdB, role: 'Company Admin' },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Setup Multi-Warehouse Locations for Company A
    warehouseNorth = await Warehouse.create({
      companyId: companyA._id,
      code: 'WH-NORTH',
      name: 'North Region Distribution Hub',
      type: 'raw_material',
      capacity: 10000,
      currentUsage: 0,
      createdBy: userA._id,
      status: 'active',
    });

    warehouseSouth = await Warehouse.create({
      companyId: companyA._id,
      code: 'WH-SOUTH',
      name: 'South Region Manufacturing Depot',
      type: 'finished_goods',
      capacity: 5000,
      currentUsage: 0,
      createdBy: userA._id,
      status: 'active',
    });

    // Setup Warehouse for Company B
    warehouseOtherCompany = await Warehouse.create({
      companyId: companyB._id,
      code: 'WH-RIVAL',
      name: 'Rival Main Depot',
      type: 'general',
      capacity: 8000,
      currentUsage: 0,
      createdBy: userB._id,
      status: 'active',
    });
  });

  // ==========================================================================
  // SECTION 1: Multi-Warehouse Stock Levels & Company Aggregation
  // ==========================================================================
  describe('1. Multi-Warehouse Stock Levels & Aggregation Target', () => {
    it('1.1 Should isolate stock levels per warehouse location for the same SKU', async () => {
      const sku = 'STEEL-ROD-500';
      const itemName = 'Heavy Structural Steel Rod';

      // Stock In 200 units at WH-NORTH
      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        itemName,
        itemCategory: 'raw_material',
        quantity: 200,
        unitCost: 25,
        minThreshold: 30,
      });

      // Stock In 80 units at WH-SOUTH for same SKU
      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseSouth._id.toString(),
        sku,
        itemName,
        itemCategory: 'raw_material',
        quantity: 80,
        unitCost: 25,
        minThreshold: 15,
      });

      // Verify distinct Inventory documents exist in MongoDB
      const invNorth = await Inventory.findOne({
        companyId: companyIdA,
        warehouseId: warehouseNorth._id,
        sku,
      });
      const invSouth = await Inventory.findOne({
        companyId: companyIdA,
        warehouseId: warehouseSouth._id,
        sku,
      });

      expect(invNorth).not.toBeNull();
      expect(invSouth).not.toBeNull();
      expect(invNorth!._id.toString()).not.toEqual(invSouth!._id.toString());
      expect(invNorth!.quantity).toBe(200);
      expect(invSouth!.quantity).toBe(80);
      expect(invNorth!.totalValue).toBe(5000); // 200 * 25
      expect(invSouth!.totalValue).toBe(2000); // 80 * 25
    });

    it('1.2 Should prevent cross-warehouse stock leak when issuing stock out', async () => {
      const sku = 'COPPER-WIRE-200';

      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        itemName: 'Copper Wire Spool',
        quantity: 150,
        unitCost: 10,
      });

      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseSouth._id.toString(),
        sku,
        itemName: 'Copper Wire Spool',
        quantity: 90,
        unitCost: 10,
      });

      // Issue 50 units stock out from WH-NORTH
      await inventoryService.stockOut(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        quantity: 50,
        reason: 'Client Order Dispatch',
      });

      const invNorth = await Inventory.findOne({
        companyId: companyIdA,
        warehouseId: warehouseNorth._id,
        sku,
      });
      const invSouth = await Inventory.findOne({
        companyId: companyIdA,
        warehouseId: warehouseSouth._id,
        sku,
      });

      // WH-NORTH should decrease to 100, while WH-SOUTH remains untouched at 90
      expect(invNorth!.quantity).toBe(100);
      expect(invSouth!.quantity).toBe(90);
    });

    it('1.3 Should query inventory levels filtered strictly by warehouse location via API', async () => {
      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku: 'ALU-SHEET-01',
        itemName: 'Aluminum Sheet',
        itemCategory: 'raw_material',
        quantity: 50,
        unitCost: 40,
      });

      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseSouth._id.toString(),
        sku: 'ALU-SHEET-02',
        itemName: 'Aluminum Sheet Thick',
        itemCategory: 'raw_material',
        quantity: 75,
        unitCost: 60,
      });

      // Query raw materials for WH-NORTH only
      const resNorth = await request(app)
        .get(`/api/inventory/raw-materials?warehouseId=${warehouseNorth._id.toString()}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resNorth.status).toBe(200);
      expect(resNorth.body.success).toBe(true);
      expect(resNorth.body.data.length).toBe(1);
      expect(resNorth.body.data[0].sku).toBe('ALU-SHEET-01');

      // Query raw materials for WH-SOUTH only
      const resSouth = await request(app)
        .get(`/api/inventory/raw-materials?warehouseId=${warehouseSouth._id.toString()}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resSouth.status).toBe(200);
      expect(resSouth.body.success).toBe(true);
      expect(resSouth.body.data.length).toBe(1);
      expect(resSouth.body.data[0].sku).toBe('ALU-SHEET-02');
    });

    it('1.4 Should calculate total company stock aggregated across all warehouses', async () => {
      // Stock items across WH-NORTH and WH-SOUTH
      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku: 'GEAR-PACK-01',
        itemName: 'Industrial Gear Assembly',
        itemCategory: 'finished_goods',
        quantity: 100,
        unitCost: 150,
      });

      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseSouth._id.toString(),
        sku: 'GEAR-PACK-01',
        itemName: 'Industrial Gear Assembly',
        itemCategory: 'finished_goods',
        quantity: 50,
        unitCost: 150,
      });

      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseSouth._id.toString(),
        sku: 'VALVE-PACK-02',
        itemName: 'Hydraulic Control Valve',
        itemCategory: 'finished_goods',
        quantity: 40,
        unitCost: 200,
      });

      // Get consolidated reports
      const reportsRes = await request(app)
        .get('/api/inventory/reports')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(reportsRes.status).toBe(200);
      expect(reportsRes.body.success).toBe(true);
      expect(reportsRes.body.summary.totalSKUs).toBe(3); // 2 distinct SKU records across 2 warehouses
      // Total value = (100 * 150) + (50 * 150) + (40 * 200) = 15000 + 7500 + 8000 = 30500
      expect(reportsRes.body.summary.totalInventoryValue).toBe(30500);

      // Verify legacy getStockLevels API aggregation
      const stockLevels = await inventoryService.getStockLevels(companyIdA);
      expect(stockLevels.stockItems.length).toBe(3);
      expect(stockLevels.summary.totalInventoryValue).toBe(30500);
    });

    it('1.5 Should enforce strict multi-tenant isolation across different companies', async () => {
      // Stock In item under Company A
      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku: 'TENANT-ITEM-A',
        itemName: 'Company A Secret Alloy',
        quantity: 500,
        unitCost: 100,
      });

      // Company B attempts to access Company A's warehouse raw materials
      const crossTenantRes = await request(app)
        .get(`/api/inventory/raw-materials?warehouseId=${warehouseNorth._id.toString()}`)
        .set('Authorization', `Bearer ${tokenB}`);

      // Company B gets an empty list or company-filtered results without leaking Company A's data
      expect(crossTenantRes.body.data.length).toBe(0);

      // Attempting stock out on Company A's item using Company B user credentials
      try {
        await inventoryService.stockOut(companyIdB, userIdB, {
          warehouseId: warehouseNorth._id.toString(),
          sku: 'TENANT-ITEM-A',
          quantity: 10,
        });
        fail('Should have thrown cross-tenant error');
      } catch (err: any) {
        expect(err.message).toContain('Warehouse location not found');
      }
    });
  });

  // ==========================================================================
  // SECTION 2: Inter-Warehouse Stock Transfer Workflow
  // ==========================================================================
  describe('2. Inter-Warehouse Stock Transfer Workflow Target', () => {
    it('2.1 Should manage StockTransfer document lifecycle state transitions', async () => {
      // Initiate StockTransfer model doc in 'pending' state
      const transferDoc = await StockTransfer.create({
        companyId: companyA._id,
        transferNumber: 'TRF-TEST-001',
        sourceWarehouseId: warehouseNorth._id,
        destinationWarehouseId: warehouseSouth._id,
        items: [
          { itemCode: 'BEARING-100', itemName: 'Roller Bearing', quantity: 25, unit: 'pcs' },
        ],
        totalQuantity: 25,
        transferDate: new Date(),
        status: 'pending',
        notes: 'Inter-branch replenishment request',
        createdBy: userA._id,
      });

      expect(transferDoc.status).toBe('pending');
      expect(transferDoc.transferNumber).toBe('TRF-TEST-001');

      // Update state to 'in_transit'
      transferDoc.status = 'in_transit';
      await transferDoc.save();

      const inTransitDoc = await StockTransfer.findById(transferDoc._id);
      expect(inTransitDoc?.status).toBe('in_transit');

      // Update state to 'completed'
      transferDoc.status = 'completed';
      await transferDoc.save();

      const completedDoc = await StockTransfer.findById(transferDoc._id);
      expect(completedDoc?.status).toBe('completed');
    });

    it('2.2 Should execute inter-warehouse transfer via InventoryService (origin deduction & destination addition)', async () => {
      const sku = 'MOTOR-HP-5';
      const itemName = '5HP Electric Motor';

      // 1. Initial stock in WH-NORTH (Source): 100 units
      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        itemName,
        itemCategory: 'finished_goods',
        quantity: 100,
        unitCost: 120,
        minThreshold: 10,
      });

      // 2. Execute stock transfer of 35 units from WH-NORTH to WH-SOUTH
      const transferResult = await inventoryService.transfer(companyIdA, userIdA, {
        sourceWarehouseId: warehouseNorth._id.toString(),
        destinationWarehouseId: warehouseSouth._id.toString(),
        items: [{ sku, itemName, quantity: 35, unit: 'units' }],
        notes: 'Rush transfer for assembly line',
      });

      expect(transferResult.success).toBe(true);
      expect(transferResult.transfer.status).toBe('completed');
      expect(transferResult.movements.length).toBe(1);

      // 3. Verify origin warehouse deduction
      const sourceInv = await Inventory.findOne({
        companyId: companyIdA,
        warehouseId: warehouseNorth._id,
        sku,
      });
      expect(sourceInv!.quantity).toBe(65); // 100 - 35
      expect(sourceInv!.totalValue).toBe(7800); // 65 * 120

      // 4. Verify destination warehouse addition
      const destInv = await Inventory.findOne({
        companyId: companyIdA,
        warehouseId: warehouseSouth._id,
        sku,
      });
      expect(destInv).not.toBeNull();
      expect(destInv!.quantity).toBe(35); // 0 + 35
      expect(destInv!.unitCost).toBe(120);
      expect(destInv!.totalValue).toBe(4200); // 35 * 120

      // 5. Verify StockMovement audit trail
      const movement = await StockMovement.findOne({
        companyId: companyIdA,
        type: 'transfer',
        sku,
      });
      expect(movement).not.toBeNull();
      expect(movement!.warehouseId.toString()).toBe(warehouseNorth._id.toString());
      expect(movement!.destinationWarehouseId?.toString()).toBe(warehouseSouth._id.toString());
      expect(movement!.quantity).toBe(35);
    });

    it('2.3 Should execute inter-warehouse transfer via WarehouseService and update warehouse capacity usage', async () => {
      // Setup initial warehouse usage
      warehouseNorth.currentUsage = 2000;
      await warehouseNorth.save();

      warehouseSouth.currentUsage = 1000;
      await warehouseSouth.save();

      // Perform transfer of 200 units via warehouseService
      const transfer = await warehouseService.transferStock(companyIdA, userIdA, {
        sourceWarehouseId: warehouseNorth._id.toString(),
        destinationWarehouseId: warehouseSouth._id.toString(),
        items: [{ itemCode: 'PIPE-PVC-50', itemName: 'PVC Heavy Duty Pipe', quantity: 200, unit: 'meters' }],
        notes: 'Warehouse capacity re-allocation',
      });

      expect(transfer._id).toBeDefined();
      expect(transfer.status).toBe('completed');

      // Refresh warehouse records from DB
      const updatedNorth = await Warehouse.findById(warehouseNorth._id);
      const updatedSouth = await Warehouse.findById(warehouseSouth._id);

      // Source usage reduced by 200 (2000 -> 1800)
      expect(updatedNorth!.currentUsage).toBe(1800);
      // Destination usage increased by 200 (1000 -> 1200)
      expect(updatedSouth!.currentUsage).toBe(1200);
    });

    it('2.4 Should execute stock transfer via HTTP API endpoints (POST /api/inventory/transfer & POST /api/warehouses/transfer)', async () => {
      const sku = 'SENSOR-TEMP-01';

      // Setup initial stock in WH-NORTH
      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        itemName: 'Digital Temperature Sensor',
        quantity: 80,
        unitCost: 15,
      });

      // API Test 1: POST /api/inventory/transfer
      const invTransferRes = await request(app)
        .post('/api/inventory/transfer')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          sourceWarehouseId: warehouseNorth._id.toString(),
          destinationWarehouseId: warehouseSouth._id.toString(),
          items: [{ sku, itemName: 'Digital Temperature Sensor', quantity: 30 }],
          referenceNumber: 'API-TRF-001',
        });

      expect(invTransferRes.status).toBe(201);
      expect(invTransferRes.body.success).toBe(true);

      const northInv = await Inventory.findOne({ companyId: companyIdA, warehouseId: warehouseNorth._id, sku });
      const southInv = await Inventory.findOne({ companyId: companyIdA, warehouseId: warehouseSouth._id, sku });

      expect(northInv!.quantity).toBe(50);
      expect(southInv!.quantity).toBe(30);

      // API Test 2: POST /api/warehouses/transfer
      const whTransferRes = await request(app)
        .post('/api/warehouses/transfer')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          sourceWarehouseId: warehouseNorth._id.toString(),
          destinationWarehouseId: warehouseSouth._id.toString(),
          items: [{ itemCode: sku, itemName: 'Digital Temperature Sensor', quantity: 10 }],
        });

      expect(whTransferRes.status).toBe(201);
      expect(whTransferRes.body.success).toBe(true);
      expect(whTransferRes.body.message).toContain('completed successfully');
    });

    it('2.5 Should reject invalid transfer requests with appropriate error messages', async () => {
      const sku = 'LUBRICANT-50L';

      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        itemName: 'Industrial Lubricant Oil',
        quantity: 20,
        unitCost: 50,
      });

      // Error 1: Transfer to same warehouse
      await expect(
        inventoryService.transfer(companyIdA, userIdA, {
          sourceWarehouseId: warehouseNorth._id.toString(),
          destinationWarehouseId: warehouseNorth._id.toString(),
          items: [{ sku, itemName: 'Industrial Lubricant Oil', quantity: 5 }],
        })
      ).rejects.toThrow('Source and destination warehouses cannot be the same');

      // Error 2: Insufficient stock at source warehouse
      await expect(
        inventoryService.transfer(companyIdA, userIdA, {
          sourceWarehouseId: warehouseNorth._id.toString(),
          destinationWarehouseId: warehouseSouth._id.toString(),
          items: [{ sku, itemName: 'Industrial Lubricant Oil', quantity: 500 }], // Available: 20
        })
      ).rejects.toThrow('Insufficient stock');

      // Error 3: Destination warehouse capacity overrun
      warehouseSouth.capacity = 100;
      warehouseSouth.currentUsage = 95;
      await warehouseSouth.save();

      await expect(
        warehouseService.transferStock(companyIdA, userIdA, {
          sourceWarehouseId: warehouseNorth._id.toString(),
          destinationWarehouseId: warehouseSouth._id.toString(),
          items: [{ itemCode: sku, itemName: 'Industrial Lubricant Oil', quantity: 20 }], // 95 + 20 > 100
        })
      ).rejects.toThrow('exceeds capacity');
    });
  });

  // ==========================================================================
  // SECTION 3: Low Stock Alerts & Stock Adjustments
  // ==========================================================================
  describe('3. Low Stock Alerts & Stock Adjustments Target', () => {
    it('3.1 Should automatically trigger LowStockAlert when quantity falls to or below minThreshold', async () => {
      const sku = 'FILTER-OIL-99';
      const itemName = 'Engine Oil Filter Cartridge';

      // 1. Initial stock: 50 units, minThreshold: 15
      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        itemName,
        itemCategory: 'components',
        quantity: 50,
        minThreshold: 15,
      });

      // Confirm no alert exists initially
      let alert = await LowStockAlert.findOne({ companyId: companyIdA, sku });
      expect(alert).toBeNull();

      // 2. Issue stock out of 38 units (Remaining: 12 <= minThreshold of 15)
      await inventoryService.stockOut(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        quantity: 38,
        reason: 'Maintenance Dispatch',
      });

      // 3. Verify automated LowStockAlert creation
      alert = await LowStockAlert.findOne({ companyId: companyIdA, sku, status: 'active' });
      expect(alert).not.toBeNull();
      expect(alert!.currentQuantity).toBe(12);
      expect(alert!.minThreshold).toBe(15);
      expect(alert!.severity).toBe('warning');
    });

    it('3.2 Should escalate alert severity from warning to critical when stock reaches zero', async () => {
      const sku = 'GASKET-SEAL-10';

      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        itemName: 'Rubber Flange Gasket',
        quantity: 20,
        minThreshold: 10,
      });

      // Stock out to 5 units -> triggers warning alert
      await inventoryService.stockOut(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        quantity: 15,
      });

      let alert = await LowStockAlert.findOne({ companyId: companyIdA, sku });
      expect(alert!.severity).toBe('warning');

      // Stock out remaining 5 units -> stock becomes 0
      await inventoryService.stockOut(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        quantity: 5,
      });

      alert = await LowStockAlert.findOne({ companyId: companyIdA, sku });
      expect(alert!.currentQuantity).toBe(0);
      expect(alert!.severity).toBe('critical');
    });

    it('3.3 Should resolve active LowStockAlert when inventory is replenished above minThreshold', async () => {
      const sku = 'FUSE-20A';

      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        itemName: '20A Ceramic Fuse',
        quantity: 5,
        minThreshold: 10, // Instantly low stock
      });

      let alert = await LowStockAlert.findOne({ companyId: companyIdA, sku, status: 'active' });
      expect(alert).not.toBeNull();

      // Replenish stock by 20 units -> new quantity = 25 (> minThreshold of 10)
      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        itemName: '20A Ceramic Fuse',
        quantity: 20,
      });

      // Alert should now be resolved
      alert = await LowStockAlert.findOne({ companyId: companyIdA, sku, status: 'active' });
      expect(alert).toBeNull();

      const resolvedAlert = await LowStockAlert.findOne({ companyId: companyIdA, sku, status: 'resolved' });
      expect(resolvedAlert).not.toBeNull();
      expect(resolvedAlert!.resolvedAt).toBeDefined();
    });

    it('3.4 Should retrieve active low stock alerts via API (GET /api/inventory/alerts/low-stock)', async () => {
      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku: 'ALERT-API-01',
        itemName: 'Critical Relay Module',
        quantity: 2,
        minThreshold: 10,
      });

      const res = await request(app)
        .get('/api/inventory/alerts/low-stock')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      
      const found = res.body.data.find((a: any) => a.sku === 'ALERT-API-01');
      expect(found).toBeDefined();
      expect(found.currentQuantity).toBe(2);
      expect(found.severity).toBe('warning');
    });

    it('3.5 Should perform manual stock adjustment with audit reason logging (StockAdjustment & AuditLog)', async () => {
      const sku = 'BOLT-M12-100';
      const itemName = 'M12 Galvanized Hex Bolt';

      // 1. Initial stock in WH-NORTH: 100 units at unitCost 2
      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        itemName,
        quantity: 100,
        unitCost: 2,
      });

      // 2. Perform stock adjustment to 92 units (8 units lost/damaged)
      const adjResult = await inventoryService.adjust(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        itemName,
        newQuantity: 92,
        unitCost: 2,
        reason: 'Physical Audit Discrepancy - Damaged during transport',
        notes: 'Audited by Quality Control Team',
      });

      expect(adjResult.success).toBe(true);
      expect(adjResult.inventory.quantity).toBe(92);

      // 3. Verify StockAdjustment document
      const stockAdj = await StockAdjustment.findOne({
        companyId: companyIdA,
        sku,
      });

      expect(stockAdj).not.toBeNull();
      expect(stockAdj!.previousQuantity).toBe(100);
      expect(stockAdj!.newQuantity).toBe(92);
      expect(stockAdj!.differenceQuantity).toBe(-8);
      expect(stockAdj!.totalAdjustmentValue).toBe(16); // 8 * 2
      expect(stockAdj!.reason).toBe('Physical Audit Discrepancy - Damaged during transport');
      expect(stockAdj!.performedBy.toString()).toBe(userIdA);
      expect(stockAdj!.referenceNumber.startsWith('ADJ-')).toBe(true);

      // 4. Verify AuditLog entry
      const auditEntry = await AuditLog.findOne({
        companyId: companyIdA,
        action: 'STOCK_ADJUSTMENT',
        referenceId: stockAdj!._id.toString(),
      });

      expect(auditEntry).not.toBeNull();
      expect(auditEntry!.module).toBe('inventory');
      expect(auditEntry!.userId?.toString()).toBe(userIdA);
      expect(auditEntry!.after.reason).toBe('Physical Audit Discrepancy - Damaged during transport');

      // 5. Verify StockMovement record
      const movement = await StockMovement.findOne({
        companyId: companyIdA,
        type: 'adjustment',
        sku,
      });

      expect(movement).not.toBeNull();
      expect(movement!.quantity).toBe(8); // Absolute value of difference
      expect(movement!.referenceNumber).toBe(stockAdj!.referenceNumber);
    });

    it('3.6 Should perform stock adjustment via API (POST /api/inventory/adjust) and verify response structure', async () => {
      const sku = 'CABLE-CAT6-500';

      await inventoryService.stockIn(companyIdA, userIdA, {
        warehouseId: warehouseNorth._id.toString(),
        sku,
        itemName: 'Cat6 Ethernet Cable Box',
        quantity: 50,
        unitCost: 80,
      });

      const adjResponse = await request(app)
        .post('/api/inventory/adjust')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          warehouseId: warehouseNorth._id.toString(),
          sku,
          itemName: 'Cat6 Ethernet Cable Box',
          newQuantity: 65, // Increase quantity by 15
          unitCost: 80,
          reason: 'Annual Stock Inventory Surplus',
          notes: 'Found extra unopened box in rack 4',
        });

      expect(adjResponse.status).toBe(200);
      expect(adjResponse.body.success).toBe(true);
      expect(adjResponse.body.message).toContain('recorded successfully');
      expect(adjResponse.body.inventory.quantity).toBe(65);
      expect(adjResponse.body.adjustment.differenceQuantity).toBe(15);
      expect(adjResponse.body.adjustment.reason).toBe('Annual Stock Inventory Surplus');
    });
  });
});
