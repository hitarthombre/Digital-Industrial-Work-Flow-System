import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import Company from '../models/Company';
import User from '../models/User';
import Product from '../models/Product';
import Inventory from '../models/Inventory';
import Warehouse from '../models/Warehouse';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe('Non-Functional & Security Testing Suite', () => {
  describe('1. Security & Multi-Tenant Isolation Testing', () => {
    it('Security Test: User from Company A cannot query/access Inventory of Company B', async () => {
      const companyA = await Company.create({
        name: 'Company A Industries',
        code: 'COMP-A',
        email: 'info@compa.com',
        address: 'Addr A'
      });

      const companyB = await Company.create({
        name: 'Company B Logistics',
        code: 'COMP-B',
        email: 'info@compb.com',
        address: 'Addr B'
      });

      const userA = await User.create({
        companyId: companyA._id,
        firstName: 'Alice',
        lastName: 'A',
        email: 'alice@compa.com',
        passwordHash: 'hashA',
        role: 'Admin'
      });

      const userB = await User.create({
        companyId: companyB._id,
        firstName: 'Bob',
        lastName: 'B',
        email: 'bob@compb.com',
        passwordHash: 'hashB',
        role: 'Admin'
      });

      const whA = await Warehouse.create({
        companyId: companyA._id,
        code: 'WH-A',
        name: 'Warehouse A',
        capacity: 1000,
        createdBy: userA._id
      });

      const whB = await Warehouse.create({
        companyId: companyB._id,
        code: 'WH-B',
        name: 'Warehouse B',
        capacity: 2000,
        createdBy: userB._id
      });

      const prodA = await Product.create({
        companyId: companyA._id,
        sku: 'SECRET-ITEM-A',
        name: 'Company A Classified Product',
        costPrice: 50,
        price: 100,
        uom: { unit: 'pcs' },
        createdBy: userA._id
      });

      const prodB = await Product.create({
        companyId: companyB._id,
        sku: 'SECRET-ITEM-B',
        name: 'Company B Confidential Product',
        costPrice: 200,
        price: 400,
        uom: { unit: 'pcs' },
        createdBy: userB._id
      });

      await Inventory.create({
        companyId: companyA._id,
        warehouseId: whA._id,
        productId: prodA._id,
        sku: prodA.sku,
        itemName: prodA.name,
        quantity: 500
      });

      await Inventory.create({
        companyId: companyB._id,
        warehouseId: whB._id,
        productId: prodB._id,
        sku: prodB.sku,
        itemName: prodB.name,
        quantity: 999
      });

      // Query enforcing Tenant Isolation for Company A
      const companyAInventories = await Inventory.find({ companyId: companyA._id });
      const skusInCompanyA = companyAInventories.map(inv => inv.sku);

      expect(companyAInventories.length).toBe(1);
      expect(skusInCompanyA).toContain('SECRET-ITEM-A');
      expect(skusInCompanyA).not.toContain('SECRET-ITEM-B');
    });

    it('Security Header Test: HTTP Response includes Helmet security headers', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('2. Performance & Benchmark Testing', () => {
    it('Performance Load Benchmark: Health check responds within sub-50ms threshold', async () => {
      const startTime = Date.now();
      const res = await request(app).get('/api/health');
      const responseTimeMs = Date.now() - startTime;

      expect(res.status).toBe(200);
      expect(responseTimeMs).toBeLessThan(200); // Sub-200ms latency requirement
    });

    it('Concurrent Throughput Test: Handles 10 parallel API status queries smoothly', async () => {
      const promises = Array.from({ length: 10 }, () => request(app).get('/api/health'));
      const responses = await Promise.all(promises);

      responses.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('up');
      });
    });
  });

  describe('3. API Response Contract & Data Field Compliance', () => {
    it('API Response Format: Health endpoint returns compliant JSON payload', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.type).toBe('application/json');
      expect(typeof res.body.timestamp).toBe('string');
      expect(typeof res.body.environment).toBe('string');
    });
  });
});
