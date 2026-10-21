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
import Customer from '../models/Customer';
import { DispatchOrder } from '../models/DispatchOrder';

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

describe('Dispatch & Logistics Management Module Integration Suite', () => {
  let companyA: any;
  let companyB: any;
  let companyIdA: string;
  let companyIdB: string;

  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  let warehouseA: any;
  let customerA: any;

  beforeEach(async () => {
    // 1. Companies
    companyA = await Company.create({
      name: 'TransLogix Freight & Supply Ltd',
      code: 'TRANSLOGIX',
      email: 'logistics@translogix.com',
      address: '77 Logistics Blvd',
      city: 'Atlanta',
      country: 'USA',
    });
    companyIdA = companyA._id.toString();

    companyB = await Company.create({
      name: 'CargoGlobal Corp',
      code: 'CARGOGLOBAL',
      email: 'ops@cargoglobal.com',
      address: '88 Ocean Ave',
      city: 'Miami',
      country: 'USA',
    });
    companyIdB = companyB._id.toString();

    // 2. Roles
    const dispatchRoleA = await Role.create({
      companyId: companyA._id,
      name: 'Logistics Coordinator',
      description: 'Shipment and dispatch management',
      permissions: ['dispatch:read', 'dispatch:create', 'dispatch:update', 'warehouses:read'],
      isSystemRole: false,
    });

    const dispatchRoleB = await Role.create({
      companyId: companyB._id,
      name: 'Logistics Coordinator B',
      description: 'Shipment management for Company B',
      permissions: ['dispatch:read', 'dispatch:create', 'dispatch:update', 'warehouses:read'],
      isSystemRole: false,
    });

    // 3. Users
    userA = await User.create({
      companyId: companyA._id,
      roleId: dispatchRoleA._id,
      firstName: 'David',
      lastName: 'Dispatch',
      email: 'david@translogix.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Company Admin',
      status: 'active',
    });

    userB = await User.create({
      companyId: companyB._id,
      roleId: dispatchRoleB._id,
      firstName: 'Carl',
      lastName: 'Cargo',
      email: 'carl@cargoglobal.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Company Admin',
      status: 'active',
    });

    // 4. Tokens
    tokenA = jwt.sign(
      { userId: userA._id.toString(), companyId: companyIdA, roleId: dispatchRoleA._id.toString(), role: 'Company Admin' },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    tokenB = jwt.sign(
      { userId: userB._id.toString(), companyId: companyIdB, roleId: dispatchRoleB._id.toString(), role: 'Company Admin' },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 5. Warehouse & Customer
    warehouseA = await Warehouse.create({
      companyId: companyA._id,
      code: 'WH-ATL-01',
      name: 'Atlanta Distribution Center',
      type: 'finished_goods',
      capacity: 40000,
      currentUsage: 0,
      createdBy: userA._id,
      status: 'active',
    });

    customerA = await Customer.create({
      companyId: companyA._id,
      name: 'Midwest Heavy Power Corp',
      code: 'CUST-MIDWEST',
      createdBy: userA._id,
    });
  });

  describe('1. Dispatch Order Lifecycle & Transport Tracking', () => {
    it('1.1 should create a new dispatch order with items, transport details, and shipping address', async () => {
      const dispatchPayload = {
        customerId: customerA._id.toString(),
        warehouseId: warehouseA._id.toString(),
        items: [
          {
            sku: 'GEN-TURBO-500',
            itemName: 'Turbine Generator 500kW',
            quantity: 2,
            unit: 'units',
          },
        ],
        shippingAddress: {
          street: '55 Power Grid Way',
          city: 'Columbus',
          state: 'OH',
          country: 'USA',
          postalCode: '43004',
        },
        transport: {
          mode: 'road',
          carrierName: 'FastFreight Express',
          vehicleNumber: 'GA-TRK-9901',
          driverName: 'John Miller',
          driverPhone: '+1-555-888-1234',
          freightCost: 1200,
        },
        plannedDispatchDate: new Date().toISOString(),
      };

      const res = await request(app)
        .post('/api/dispatch')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(dispatchPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dispatchNumber).toBeDefined();
      expect(res.body.data.status).toBe('Pending');
      expect(res.body.data.transport.carrierName).toBe('FastFreight Express');
    });

    it('1.2 should update transport information and tracking reference on dispatch order', async () => {
      const dispatch = await DispatchOrder.create({
        companyId: companyA._id,
        dispatchNumber: 'DSP-2026-0001',
        warehouseId: warehouseA._id,
        customerId: customerA._id,
        status: 'Pending',
        items: [{ sku: 'SKU-01', itemName: 'Item 1', quantity: 5 }],
        createdBy: userA._id,
      });

      const updateRes = await request(app)
        .put(`/api/dispatch/${dispatch._id}/transport`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          mode: 'road',
          carrierName: 'National Freight Logistics',
          trackingNumber: 'NFL-TRK-7749120',
          vehicleNumber: 'TRK-2244',
          freightCost: 1500,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.transport.trackingNumber).toBe('NFL-TRK-7749120');
      expect(updateRes.body.data.transport.carrierName).toBe('National Freight Logistics');
    });

    it('1.3 should transition dispatch status from Pending -> Packed -> Shipped', async () => {
      // Seed warehouse inventory for dispatch deduction
      await Inventory.create({
        companyId: companyA._id,
        warehouseId: warehouseA._id,
        sku: 'SKU-02',
        itemName: 'Item 2',
        quantity: 50,
        availableQuantity: 50,
        allocatedQuantity: 0,
        minThreshold: 5,
        unitCost: 10,
        totalValue: 500,
        unit: 'units',
        status: 'in_stock',
        lastUpdatedBy: userA._id,
      });

      const dispatch = await DispatchOrder.create({
        companyId: companyA._id,
        dispatchNumber: 'DSP-2026-0002',
        warehouseId: warehouseA._id,
        customerId: customerA._id,
        status: 'Pending',
        items: [{ sku: 'SKU-02', itemName: 'Item 2', quantity: 10 }],
        createdBy: userA._id,
      });

      // 1. Pack
      const packRes = await request(app)
        .patch(`/api/dispatch/${dispatch._id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'Packed', note: 'Palletized and strapped for transport' });

      expect(packRes.status).toBe(200);
      expect(packRes.body.data.status).toBe('Packed');

      // 2. Ship
      const shipRes = await request(app)
        .patch(`/api/dispatch/${dispatch._id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'Shipped', note: 'Loaded on truck departing warehouse gate' });

      expect(shipRes.status).toBe(200);
      expect(shipRes.body.data.status).toBe('Shipped');
    });

    it('1.4 should attach shipping document and remove it from dispatch order', async () => {
      const dispatch = await DispatchOrder.create({
        companyId: companyA._id,
        dispatchNumber: 'DSP-2026-0003',
        warehouseId: warehouseA._id,
        customerId: customerA._id,
        status: 'Pending',
        items: [{ sku: 'SKU-03', itemName: 'Item 3', quantity: 1 }],
        createdBy: userA._id,
      });

      const docRes = await request(app)
        .post(`/api/dispatch/${dispatch._id}/documents`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Bill of Lading',
          docType: 'lr_copy',
          fileName: 'bol_7719.pdf',
          fileUrl: 'https://storage.diws.internal/dispatch/bol_7719.pdf',
          fileSize: 102400,
        });

      expect(docRes.status).toBe(201);
      expect(docRes.body.success).toBe(true);
      expect(docRes.body.data.documents.length).toBe(1);

      const docId = docRes.body.data.documents[0]._id;

      // Remove document
      const delDocRes = await request(app)
        .delete(`/api/dispatch/${dispatch._id}/documents/${docId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(delDocRes.status).toBe(200);
      expect(delDocRes.body.success).toBe(true);
      expect(delDocRes.body.data.documents.length).toBe(0);
    });
  });

  describe('2. Multi-Tenant Isolation', () => {
    it('2.1 should prevent Company B from accessing Company A dispatch orders', async () => {
      const dispatchA = await DispatchOrder.create({
        companyId: companyA._id,
        dispatchNumber: 'DSP-ALPHA-ONLY',
        warehouseId: warehouseA._id,
        customerId: customerA._id,
        status: 'Pending',
        items: [{ sku: 'SKU-A', itemName: 'Classified Item', quantity: 1 }],
        createdBy: userA._id,
      });

      const resB = await request(app)
        .get(`/api/dispatch/${dispatchA._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(404);
    });
  });
});
