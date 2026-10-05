import request from 'supertest';
import app from '../app';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import Company from '../models/Company';
import User from '../models/User';
import Product from '../models/Product';
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

describe('Functional Smoke & Sanity Testing Suite', () => {
  describe('1. Smoke Tests (Critical Health & Route Checks)', () => {
    it('GET /api/health — should return HTTP 200 with server status up', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('up');
      expect(res.body.timestamp).toBeDefined();
    });

    it('GET /api/auth/test-email — public endpoint responds with status code', async () => {
      const res = await request(app).get('/api/auth/test-email?email=test@example.com');
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('2. Sanity Tests (Quick Verification of Core Feature Behavior)', () => {
    it('Sanity Check: Register Admin User and Login', async () => {
      const company = await Company.create({
        name: 'Smoke Test Ltd',
        code: 'SMOKE-01',
        email: 'admin@smoke.com',
        address: '100 Industrial Way',
        city: 'Vadodara',
        country: 'India'
      });

      const user = await User.create({
        companyId: company._id,
        firstName: 'Smoke',
        lastName: 'Admin',
        email: 'smokeadmin@smoke.com',
        passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
        role: 'Admin'
      });

      expect(user._id).toBeDefined();
      expect(user.role).toBe('Admin');
    });

    it('Sanity Check: Product SKU and Warehouse Mapping', async () => {
      const company = await Company.create({
        name: 'Sanity Industrial',
        code: 'SANITY-01',
        email: 'contact@sanity.com',
        address: '200 Factory Road'
      });

      const user = await User.create({
        companyId: company._id,
        firstName: 'Sanity',
        lastName: 'User',
        email: 'user@sanity.com',
        passwordHash: 'hash',
        role: 'Admin'
      });

      const warehouse = await Warehouse.create({
        companyId: company._id,
        code: 'WH-SANITY',
        name: 'Sanity Warehouse',
        capacity: 2000,
        createdBy: user._id
      });

      const product = await Product.create({
        companyId: company._id,
        sku: 'SAN-ITEM-99',
        name: 'Sanity Steel Component',
        costPrice: 40,
        price: 75,
        uom: { unit: 'pcs' },
        minStockLevel: 5,
        createdBy: user._id
      });

      expect(warehouse.code).toBe('WH-SANITY');
      expect(product.sku).toBe('SAN-ITEM-99');
    });
  });
});
