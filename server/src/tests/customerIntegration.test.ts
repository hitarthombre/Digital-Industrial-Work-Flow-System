import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import User from '../models/User';
import Company from '../models/Company';
import Role from '../models/Role';
import Customer from '../models/Customer';

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

describe('Customer Management Module Integration & Lifecycle Suite', () => {
  let companyA: any;
  let companyB: any;
  let companyIdA: string;
  let companyIdB: string;

  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    // 1. Setup Company A & B
    companyA = await Company.create({
      name: 'Alpha Industrial Corp',
      code: 'ALPHA-IND',
      email: 'sales@alphacorp.com',
      address: '100 Alpha Blvd',
      city: 'Detroit',
      country: 'USA',
    });
    companyIdA = companyA._id.toString();

    companyB = await Company.create({
      name: 'Beta Global Tech',
      code: 'BETA-TECH',
      email: 'contact@betatech.com',
      address: '200 Beta Road',
      city: 'Chicago',
      country: 'USA',
    });
    companyIdB = companyB._id.toString();

    // 2. Setup Role with customer permissions
    const salesRoleA = await Role.create({
      companyId: companyA._id,
      name: 'Sales Manager',
      description: 'Customer and Sales operations',
      permissions: ['sales:read', 'sales:create', 'sales:update', 'documents:create', 'documents:delete'],
      isSystemRole: false,
    });

    const salesRoleB = await Role.create({
      companyId: companyB._id,
      name: 'Sales Manager B',
      description: 'Customer operations for Company B',
      permissions: ['sales:read', 'sales:create', 'sales:update', 'documents:create', 'documents:delete'],
      isSystemRole: false,
    });

    // 3. Setup Users
    userA = await User.create({
      companyId: companyA._id,
      roleId: salesRoleA._id,
      firstName: 'Alice',
      lastName: 'Sales',
      email: 'alice@alphacorp.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Company Admin',
      status: 'active',
    });

    userB = await User.create({
      companyId: companyB._id,
      roleId: salesRoleB._id,
      firstName: 'Bob',
      lastName: 'Sales',
      email: 'bob@betatech.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Company Admin',
      status: 'active',
    });

    // 4. Generate Auth Tokens
    tokenA = jwt.sign(
      { userId: userA._id.toString(), companyId: companyIdA, roleId: salesRoleA._id.toString(), role: 'Company Admin' },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    tokenB = jwt.sign(
      { userId: userB._id.toString(), companyId: companyIdB, roleId: salesRoleB._id.toString(), role: 'Company Admin' },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('1. Customer CRUD & Validation', () => {
    it('1.1 should create a new customer record with proper creditStanding and addresses', async () => {
      const payload = {
        name: 'Nexus Dynamics',
        code: 'CUST-NEXUS-01',
        customerType: 'enterprise',
        status: 'active',
        creditLimit: 75000,
        contactName: 'James Holden',
        email: 'j.holden@nexus.com',
        phone: '+1 555-0199',
        billingAddress: {
          street: '100 Space Way',
          city: 'Seattle',
          state: 'WA',
          country: 'USA',
          postalCode: '98101',
        },
      };

      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Nexus Dynamics');
      expect(res.body.data.code).toBe('CUST-NEXUS-01');
      expect(res.body.data.companyId).toBe(companyIdA);
      expect(res.body.data.creditLimit).toBe(75000);
      expect(res.body.data.creditStanding.availableCredit).toBe(75000);
    });

    it('1.2 should reject customer creation with duplicate code under the same company', async () => {
      await Customer.create({
        companyId: companyA._id,
        name: 'Existing Customer',
        code: 'CUST-DUP-01',
        createdBy: userA._id,
      });

      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Another Customer',
          code: 'CUST-DUP-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('1.3 should fetch customer details and credit status by ID', async () => {
      const cust = await Customer.create({
        companyId: companyA._id,
        name: 'Orbit Logistics',
        code: 'CUST-ORBIT-01',
        creditLimit: 50000,
        createdBy: userA._id,
      });

      const res = await request(app)
        .get(`/api/customers/${cust._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(cust._id.toString());
      expect(res.body.data.name).toBe('Orbit Logistics');
      expect(res.body.creditStatus).toBeDefined();
      expect(res.body.creditStatus.limit).toBe(50000);
    });

    it('1.4 should update customer details & credit terms', async () => {
      const cust = await Customer.create({
        companyId: companyA._id,
        name: 'Vanguard Steel',
        code: 'CUST-VAN-01',
        creditLimit: 30000,
        createdBy: userA._id,
      });

      const res = await request(app)
        .put(`/api/customers/${cust._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Vanguard Steel International',
          creditLimit: 60000,
          status: 'vip',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Vanguard Steel International');
      expect(res.body.data.creditLimit).toBe(60000);
      expect(res.body.data.status).toBe('vip');
    });

    it('1.5 should soft delete customer record', async () => {
      const cust = await Customer.create({
        companyId: companyA._id,
        name: 'Old Machinery Ltd',
        code: 'CUST-OLD-01',
        createdBy: userA._id,
      });

      const res = await request(app)
        .delete(`/api/customers/${cust._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await Customer.findById(cust._id);
      expect(check?.isDeleted).toBe(true);
    });
  });

  describe('2. Multi-Tenant Isolation', () => {
    it('2.1 should not allow Company B user to access or view Company A customer', async () => {
      const custA = await Customer.create({
        companyId: companyA._id,
        name: 'Private Client A',
        code: 'CUST-PRIV-A',
        createdBy: userA._id,
      });

      const res = await request(app)
        .get(`/api/customers/${custA._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      // Should return 404 Not Found due to tenant filtering in service
      expect(res.status).toBe(404);
    });

    it('2.2 should filter customer list strictly to authenticated user company', async () => {
      await Customer.create({
        companyId: companyA._id,
        name: 'Alpha Customer 1',
        code: 'AC-1',
        createdBy: userA._id,
      });
      await Customer.create({
        companyId: companyB._id,
        name: 'Beta Customer 1',
        code: 'BC-1',
        createdBy: userB._id,
      });

      const resA = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.length).toBe(1);
      expect(resA.body.data[0].name).toBe('Alpha Customer 1');

      const resB = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.length).toBe(1);
      expect(resB.body.data[0].name).toBe('Beta Customer 1');
    });
  });

  describe('3. Customer Orders & Document Vault', () => {
    it('3.1 should record and retrieve sales order history for customer', async () => {
      const cust = await Customer.create({
        companyId: companyA._id,
        name: 'Apex Manufacturing',
        code: 'CUST-APEX-01',
        creditLimit: 100000,
        createdBy: userA._id,
      });

      const orderPayload = {
        orderNumber: 'SO-2026-001',
        date: new Date().toISOString(),
        totalAmount: 15000,
        status: 'confirmed',
        paymentStatus: 'pending',
        itemsCount: 3,
        itemsSummary: 'Industrial Valves x3',
      };

      const addRes = await request(app)
        .post(`/api/customers/${cust._id}/orders`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send(orderPayload);

      expect(addRes.status).toBe(201);
      expect(addRes.body.success).toBe(true);

      const getRes = await request(app)
        .get(`/api/customers/${cust._id}/orders`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.length).toBe(1);
      expect(getRes.body.data[0].orderNumber).toBe('SO-2026-001');
      expect(getRes.body.stats.totalAmount).toBe(15000);
    });

    it('3.2 should add document metadata to customer vault and remove it', async () => {
      const cust = await Customer.create({
        companyId: companyA._id,
        name: 'Vault Testing Corp',
        code: 'CUST-VAULT-01',
        createdBy: userA._id,
      });

      const docPayload = {
        title: 'Master Supply Agreement 2026',
        docType: 'contract',
        fileName: 'supply_agreement.pdf',
        fileUrl: 'https://storage.diws.internal/docs/supply_agreement.pdf',
        fileSize: 204800,
        notes: 'Signed contract valid for 3 years',
      };

      const uploadRes = await request(app)
        .post(`/api/customers/${cust._id}/documents`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send(docPayload);

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body.success).toBe(true);
      expect(uploadRes.body.data.title).toBe('Master Supply Agreement 2026');

      const docId = uploadRes.body.data._id;

      // Delete document
      const delRes = await request(app)
        .delete(`/api/customers/${cust._id}/documents/${docId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      const updatedCust = await Customer.findById(cust._id);
      expect(updatedCust?.documents?.length).toBe(0);
    });
  });
});
