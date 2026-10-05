import request from 'supertest';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import Company from '../models/Company';
import User from '../models/User';
import Role from '../models/Role';
import Product from '../models/Product';
import Warehouse from '../models/Warehouse';
import Inventory from '../models/Inventory';
import Customer from '../models/Customer';
import Supplier from '../models/Supplier';
import Session from '../models/Session';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { enforceTenantIsolation } from '../middleware/tenant.middleware';
import { authService } from '../services/auth.service';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe('Multi-Tenancy Isolation Test Suite', () => {
  let companyA: any;
  let companyB: any;
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  // Test Express application demonstrating tenant middleware on routes
  const testApp = express();
  testApp.use(express.json());

  testApp.get(
    '/api/tenants/:companyId/data',
    authenticate as any,
    enforceTenantIsolation as any,
    (req: AuthenticatedRequest, res: Response) => {
      res.status(200).json({ success: true, companyId: req.companyId, data: 'Authorized Tenant Data' });
    }
  );

  testApp.post(
    '/api/tenants/resource',
    authenticate as any,
    enforceTenantIsolation as any,
    (req: AuthenticatedRequest, res: Response) => {
      res.status(201).json({ success: true, message: 'Resource created under tenant', companyId: req.companyId });
    }
  );

  beforeEach(async () => {
    // 1. Create two distinct companies
    companyA = await Company.create({
      name: 'Alpha Aerospace Industries',
      code: 'ALPHA-01',
      email: 'contact@alphaaero.com',
      address: '100 Aviation Way',
      city: 'Bangalore',
      country: 'India'
    });

    companyB = await Company.create({
      name: 'Beta BioTech Labs',
      code: 'BETA-02',
      email: 'info@betabio.com',
      address: '200 Research Park',
      city: 'Hyderabad',
      country: 'India'
    });

    // 2. Create users belonging to Company A and Company B
    userA = await User.create({
      companyId: companyA._id,
      firstName: 'Alice',
      lastName: 'Alpha',
      email: 'alice@alphaaero.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Admin',
      status: 'active'
    });

    userB = await User.create({
      companyId: companyB._id,
      firstName: 'Bob',
      lastName: 'Beta',
      email: 'bob@betabio.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Admin',
      status: 'active'
    });

    // 3. Generate tokens
    tokenA = authService.generateAccessToken({
      userId: userA._id.toString(),
      companyId: companyA._id.toString(),
      role: userA.role
    });

    tokenB = authService.generateAccessToken({
      userId: userB._id.toString(),
      companyId: companyB._id.toString(),
      role: userB.role
    });
  });

  // --------------------------------------------------------------------------
  // 1. Tenant Middleware Isolation Verification
  // --------------------------------------------------------------------------
  describe('1. enforceTenantIsolation Middleware', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(testApp).get(`/api/tenants/${companyA._id}/data`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow User A to access Company A route via path param', async () => {
      const res = await request(testApp)
        .get(`/api/tenants/${companyA._id}/data`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.companyId).toBe(companyA._id.toString());
    });

    it('should block User A from accessing Company B route via path param with 403 Forbidden', async () => {
      const res = await request(testApp)
        .get(`/api/tenants/${companyB._id}/data`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Cross-tenant data access is strictly prohibited/i);
    });

    it('should block User A from submitting Company B companyId in request body', async () => {
      const res = await request(testApp)
        .post('/api/tenants/resource')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ companyId: companyB._id.toString(), name: 'Illegal Cross-Tenant Item' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Cross-tenant/i);
    });

    it('should allow User A to submit request matching their own companyId in body', async () => {
      const res = await request(testApp)
        .post('/api/tenants/resource')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ companyId: companyA._id.toString(), name: 'Legitimate Tenant Item' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Database Multi-Tenancy Query Isolation
  // --------------------------------------------------------------------------
  describe('2. Database Queries Enforce companyId Filtering & Cross-Tenant Data Isolation', () => {
    let roleA: any;
    let roleB: any;
    let whA: any;
    let whB: any;
    let prodA: any;
    let prodB: any;
    let custA: any;
    let custB: any;
    let suppA: any;
    let suppB: any;

    beforeEach(async () => {
      // Roles
      roleA = await Role.create({
        companyId: companyA._id,
        name: 'Alpha Pilot',
        permissions: ['flight:ready']
      });

      roleB = await Role.create({
        companyId: companyB._id,
        name: 'Beta Chemist',
        permissions: ['lab:access']
      });

      // Warehouses
      whA = await Warehouse.create({
        companyId: companyA._id,
        code: 'WH-ALPHA',
        name: 'Alpha Hangar Warehouse',
        capacity: 10000,
        createdBy: userA._id
      });

      whB = await Warehouse.create({
        companyId: companyB._id,
        code: 'WH-BETA',
        name: 'Beta Cryo Storage',
        capacity: 5000,
        createdBy: userB._id
      });

      // Products
      prodA = await Product.create({
        companyId: companyA._id,
        sku: 'ALPHA-TURBINE-01',
        name: 'Jet Propulsion Turbine',
        costPrice: 5000,
        price: 9000,
        uom: { unit: 'pcs' },
        createdBy: userA._id
      });

      prodB = await Product.create({
        companyId: companyB._id,
        sku: 'BETA-VACCINE-01',
        name: 'Synthetic Antiviral Vial',
        costPrice: 50,
        price: 120,
        uom: { unit: 'vial' },
        createdBy: userB._id
      });

      // Inventories
      await Inventory.create({
        companyId: companyA._id,
        warehouseId: whA._id,
        productId: prodA._id,
        sku: prodA.sku,
        itemName: prodA.name,
        quantity: 15
      });

      await Inventory.create({
        companyId: companyB._id,
        warehouseId: whB._id,
        productId: prodB._id,
        sku: prodB.sku,
        itemName: prodB.name,
        quantity: 5000
      });

      // Customers
      custA = await Customer.create({
        companyId: companyA._id,
        name: 'Aero Defense Forces',
        code: 'CUST-AERO',
        email: 'procurement@defense.gov',
        primaryContact: {
          name: 'Col. Procurement',
          email: 'procurement@defense.gov'
        },
        createdBy: userA._id
      });

      custB = await Customer.create({
        companyId: companyB._id,
        name: 'Global Health Network',
        code: 'CUST-HEALTH',
        email: 'orders@healthnet.org',
        primaryContact: {
          name: 'Dr. Supply',
          email: 'orders@healthnet.org'
        },
        createdBy: userB._id
      });

      // Suppliers
      suppA = await Supplier.create({
        companyId: companyA._id,
        name: 'Titanium Alloys Corp',
        code: 'SUP-TITANIUM',
        email: 'sales@titaniumalloys.com',
        primaryContact: {
          name: 'Sales Manager',
          email: 'sales@titaniumalloys.com'
        },
        createdBy: userA._id
      });

      suppB = await Supplier.create({
        companyId: companyB._id,
        name: 'Pharma Reagents Ltd',
        code: 'SUP-REAGENTS',
        email: 'orders@pharmareagents.com',
        primaryContact: {
          name: 'Reagents Dispatcher',
          email: 'orders@pharmareagents.com'
        },
        createdBy: userB._id
      });
    });

    it('should strictly isolate User queries by companyId', async () => {
      const alphaUsers = await User.find({ companyId: companyA._id });
      const betaUsers = await User.find({ companyId: companyB._id });

      expect(alphaUsers.length).toBe(1);
      expect(alphaUsers[0].email).toBe('alice@alphaaero.com');

      expect(betaUsers.length).toBe(1);
      expect(betaUsers[0].email).toBe('bob@betabio.com');

      // Verify no leak
      const alphaEmails = alphaUsers.map((u) => u.email);
      expect(alphaEmails).not.toContain('bob@betabio.com');
    });

    it('should strictly isolate Product and Inventory queries by companyId', async () => {
      const companyAProducts = await Product.find({ companyId: companyA._id });
      const companyBProducts = await Product.find({ companyId: companyB._id });

      expect(companyAProducts.length).toBe(1);
      expect(companyAProducts[0].sku).toBe('ALPHA-TURBINE-01');

      expect(companyBProducts.length).toBe(1);
      expect(companyBProducts[0].sku).toBe('BETA-VACCINE-01');

      const companyAInventories = await Inventory.find({ companyId: companyA._id });
      const companyBInventories = await Inventory.find({ companyId: companyB._id });

      expect(companyAInventories.length).toBe(1);
      expect(companyAInventories[0].sku).toBe('ALPHA-TURBINE-01');
      expect(companyAInventories[0].quantity).toBe(15);

      expect(companyBInventories.length).toBe(1);
      expect(companyBInventories[0].sku).toBe('BETA-VACCINE-01');
      expect(companyBInventories[0].quantity).toBe(5000);
    });

    it('should strictly isolate Warehouse, Customer, and Supplier queries by companyId', async () => {
      // Warehouses
      const alphaWarehouses = await Warehouse.find({ companyId: companyA._id });
      expect(alphaWarehouses.length).toBe(1);
      expect(alphaWarehouses[0].code).toBe('WH-ALPHA');

      // Customers
      const alphaCustomers = await Customer.find({ companyId: companyA._id });
      expect(alphaCustomers.length).toBe(1);
      expect(alphaCustomers[0].code).toBe('CUST-AERO');

      // Suppliers
      const alphaSuppliers = await Supplier.find({ companyId: companyA._id });
      expect(alphaSuppliers.length).toBe(1);
      expect(alphaSuppliers[0].code).toBe('SUP-TITANIUM');
    });

    it('should prevent User A from fetching Company B resource by ID (IDOR prevention)', async () => {
      // Attempt to query Company B product using Company A tenant scope
      const crossTenantProduct = await Product.findOne({
        _id: prodB._id,
        companyId: companyA._id
      });
      expect(crossTenantProduct).toBeNull();

      // Attempt to query Company B customer using Company A tenant scope
      const crossTenantCustomer = await Customer.findOne({
        _id: custB._id,
        companyId: companyA._id
      });
      expect(crossTenantCustomer).toBeNull();

      // Attempt to query Company B supplier using Company A tenant scope
      const crossTenantSupplier = await Supplier.findOne({
        _id: suppB._id,
        companyId: companyA._id
      });
      expect(crossTenantSupplier).toBeNull();

      // Attempt to query Company B role using Company A tenant scope
      const crossTenantRole = await Role.findOne({
        _id: roleB._id,
        companyId: companyA._id
      });
      expect(crossTenantRole).toBeNull();
    });

    it('should prevent cross-tenant update or deletion', async () => {
      // User A attempting to update Company B warehouse
      const updateResult = await Warehouse.findOneAndUpdate(
        { _id: whB._id, companyId: companyA._id },
        { name: 'Compromised Hangar' }
      );
      expect(updateResult).toBeNull();

      // Verify Company B warehouse remains unchanged
      const whBCheck = await Warehouse.findById(whB._id);
      expect(whBCheck?.name).toBe('Beta Cryo Storage');

      // User A attempting to delete Company B customer
      const deleteResult = await Customer.deleteOne({
        _id: custB._id,
        companyId: companyA._id
      });
      expect(deleteResult.deletedCount).toBe(0);

      // Verify Company B customer still exists
      const custBCheck = await Customer.findById(custB._id);
      expect(custBCheck).not.toBeNull();
    });
  });
});
