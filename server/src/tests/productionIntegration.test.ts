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
import { ProductionPlan } from '../models/ProductionPlan';
import { WorkOrder } from '../models/WorkOrder';

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

describe('Production Management Module Integration Suite', () => {
  let companyA: any;
  let companyB: any;
  let companyIdA: string;
  let companyIdB: string;

  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  let warehouseA: any;

  beforeEach(async () => {
    // 1. Create Companies
    companyA = await Company.create({
      name: 'Titan Heavy Industries',
      code: 'TITAN-IND',
      email: 'ops@titanindustries.com',
      address: '500 Factory Way',
      city: 'Detroit',
      country: 'USA',
    });
    companyIdA = companyA._id.toString();

    companyB = await Company.create({
      name: 'Rival Dynamics',
      code: 'RIVAL-DYN',
      email: 'contact@rivaldynamics.com',
      address: '600 Industrial Blvd',
      city: 'Cleveland',
      country: 'USA',
    });
    companyIdB = companyB._id.toString();

    // 2. Setup Production Roles
    const prodRoleA = await Role.create({
      companyId: companyA._id,
      name: 'Production Supervisor',
      description: 'Production control and operations',
      permissions: ['production:read', 'production:create', 'production:update', 'warehouses:read'],
      isSystemRole: false,
    });

    const prodRoleB = await Role.create({
      companyId: companyB._id,
      name: 'Production Supervisor B',
      description: 'Production control for Company B',
      permissions: ['production:read', 'production:create', 'production:update', 'warehouses:read'],
      isSystemRole: false,
    });

    // 3. Setup Users
    userA = await User.create({
      companyId: companyA._id,
      roleId: prodRoleA._id,
      firstName: 'Paul',
      lastName: 'Plant',
      email: 'paul.prod@titanindustries.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Company Admin',
      status: 'active',
    });

    userB = await User.create({
      companyId: companyB._id,
      roleId: prodRoleB._id,
      firstName: 'Peter',
      lastName: 'Plant',
      email: 'peter@rivaldynamics.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Company Admin',
      status: 'active',
    });

    // 4. Generate Auth Tokens
    tokenA = jwt.sign(
      { userId: userA._id.toString(), companyId: companyIdA, roleId: prodRoleA._id.toString(), role: 'Company Admin' },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    tokenB = jwt.sign(
      { userId: userB._id.toString(), companyId: companyIdB, roleId: prodRoleB._id.toString(), role: 'Company Admin' },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 5. Setup Plant Warehouse for Company A
    warehouseA = await Warehouse.create({
      companyId: companyA._id,
      code: 'WH-PROD-01',
      name: 'Detroit Manufacturing Facility',
      type: 'raw_material',
      capacity: 50000,
      currentUsage: 0,
      createdBy: userA._id,
      status: 'active',
    });
  });

  describe('1. Production Planning Lifecycle', () => {
    it('1.1 should create a new production plan and query by ID', async () => {
      const planPayload = {
        title: 'Q4 Turbofan Assembly Plan',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        priority: 'high',
        notes: 'Priority manufacturing schedule for aerospace order',
        items: [
          {
            itemName: 'Titanium Rotor Blade',
            sku: 'ROTOR-BLD-01',
            plannedQuantity: 120,
            unit: 'pcs',
          },
        ],
      };

      const res = await request(app)
        .post('/api/production/plans')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(planPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Q4 Turbofan Assembly Plan');
      expect(res.body.data.status).toBe('Draft');
      expect(res.body.data.planNumber).toBeDefined();

      const planId = res.body.data._id;
      const getRes = await request(app)
        .get(`/api/production/plans/${planId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.plan.title).toBe('Q4 Turbofan Assembly Plan');
    });

    it('1.2 should transition production plan status from Draft to Approved', async () => {
      const plan = await ProductionPlan.create({
        companyId: companyA._id,
        planNumber: 'PLAN-2026-TEST',
        title: 'Draft Schedule',
        status: 'Draft',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 10),
        items: [{ itemName: 'Test Item', sku: 'SKU-01', plannedQuantity: 50 }],
        createdBy: userA._id,
      });

      const res = await request(app)
        .patch(`/api/production/plans/${plan._id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'Approved' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Approved');
    });
  });

  describe('2. Work Order Execution, Material Consumption & Scrap Tracking', () => {
    it('2.1 should generate a work order with default production stages', async () => {
      const woPayload = {
        warehouseId: warehouseA._id.toString(),
        itemName: 'Industrial Hydraulic Pump',
        sku: 'HYD-PUMP-900',
        plannedQuantity: 25,
        priority: 'medium',
        stages: ['Machining', 'Assembly', 'Testing', 'Painting', 'Packaging'],
        materials: [
          { sku: 'PUMP-HOUSING-01', itemName: 'Cast Iron Housing', requiredQuantity: 25 },
          { sku: 'SEAL-KIT-01', itemName: 'O-Ring Seal Kit', requiredQuantity: 25 },
        ],
      };

      const res = await request(app)
        .post('/api/production/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(woPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sku).toBe('HYD-PUMP-900');
      expect(res.body.data.status).toBe('Planned');
      expect(res.body.data.stages.length).toBe(5);
      expect(res.body.data.materials.length).toBe(2);
    });

    it('2.2 should advance work order status to In Progress and update stage status', async () => {
      const wo = await WorkOrder.create({
        companyId: companyA._id,
        workOrderNumber: 'WO-2026-0099',
        warehouseId: warehouseA._id,
        itemName: 'Steel Bearing Assembly',
        sku: 'BEARING-ASSY-10',
        plannedQuantity: 100,
        status: 'Planned',
        stages: [
          { name: 'Stage 1: Lathing', sequence: 1, status: 'pending' },
          { name: 'Stage 2: Grinding', sequence: 2, status: 'pending' },
        ],
        createdBy: userA._id,
      });

      // Update work order status to In Progress
      const statusRes = await request(app)
        .patch(`/api/production/work-orders/${wo._id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'In Progress' });

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.status).toBe('In Progress');

      // Update stage 1 to completed
      const stageId = (wo.stages[0] as any)._id?.toString() || (wo.stages[0] as any).id?.toString();
      const stageRes = await request(app)
        .patch(`/api/production/work-orders/${wo._id}/stages/${stageId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'completed', notes: 'Lathing tolerance inspected' });

      expect(stageRes.status).toBe(200);
      expect(stageRes.body.success).toBe(true);
    });

    it('2.3 should record material consumption and scrap on work order', async () => {
      // Seed warehouse inventory for material to be consumed
      await Inventory.create({
        companyId: companyA._id,
        warehouseId: warehouseA._id,
        sku: 'RAW-STEEL-BAR',
        itemName: 'Raw Steel Bar',
        quantity: 100,
        availableQuantity: 100,
        allocatedQuantity: 0,
        minThreshold: 10,
        unitCost: 15,
        totalValue: 1500,
        unit: 'pcs',
        status: 'in_stock',
        lastUpdatedBy: userA._id,
      });

      const wo = await WorkOrder.create({
        companyId: companyA._id,
        workOrderNumber: 'WO-2026-0105',
        warehouseId: warehouseA._id,
        itemName: 'Precision Gear Shaft',
        sku: 'SHAFT-GEAR-55',
        plannedQuantity: 40,
        status: 'In Progress',
        materials: [
          { sku: 'RAW-STEEL-BAR', itemName: 'Raw Steel Bar', requiredQuantity: 40, consumedQuantity: 0 },
        ],
        createdBy: userA._id,
      });

      // Record material consumption
      const consumeRes = await request(app)
        .post(`/api/production/work-orders/${wo._id}/consume`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          items: [{ sku: 'RAW-STEEL-BAR', quantity: 20 }],
        });

      expect(consumeRes.status).toBe(200);
      expect(consumeRes.body.success).toBe(true);

      // Record scrap
      const scrapRes = await request(app)
        .post(`/api/production/work-orders/${wo._id}/scrap`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          quantity: 2,
          reason: 'Material defect crack during machining',
        });

      expect(scrapRes.status).toBe(201);
      expect(scrapRes.body.success).toBe(true);
      expect(scrapRes.body.data.scrapQuantity).toBe(2);
    });
  });

  describe('3. Production Multi-Tenant Isolation', () => {
    it('3.1 should isolate work orders between Company A and Company B', async () => {
      await WorkOrder.create({
        companyId: companyA._id,
        workOrderNumber: 'WO-COMP-A',
        warehouseId: warehouseA._id,
        itemName: 'Secret Turbine Component',
        sku: 'TURBINE-SECRET',
        plannedQuantity: 10,
        status: 'Planned',
        createdBy: userA._id,
      });

      const resA = await request(app)
        .get('/api/production/work-orders')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.length).toBe(1);
      expect(resA.body.data[0].sku).toBe('TURBINE-SECRET');

      const resB = await request(app)
        .get('/api/production/work-orders')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.length).toBe(0);
    });
  });
});
