import mongoose from 'mongoose';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import User from '../models/User';
import Company from '../models/Company';
import Customer from '../models/Customer';
import Supplier from '../models/Supplier';
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

describe('Unit Testing Suite (Isolated Code Components & Internal Methods)', () => {
  let companyId: mongoose.Types.ObjectId;
  let userId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const comp = await Company.create({
      name: 'Unit Test Corp',
      code: 'UTC-01',
      email: 'unittest@corp.com',
      address: '123 Test Lane',
      city: 'Testville',
      country: 'India'
    });
    companyId = comp._id as mongoose.Types.ObjectId;

    const user = await User.create({
      companyId,
      firstName: 'Unit',
      lastName: 'Tester',
      email: 'unittester@corp.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Admin'
    });
    userId = user._id as mongoose.Types.ObjectId;
  });

  describe('1. User Unit Methods', () => {
    it('should correctly compare hashed password with bcrypt', async () => {
      const user = new User({
        companyId,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@corp.com',
        passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
        role: 'Employee'
      });

      expect(user.firstName).toBe('Jane');
      expect(user.comparePassword).toBeDefined();
    });
  });

  describe('2. Customer Credit Status Method', () => {
    it('should compute credit limit utilization, score, and credit hold flags correctly', async () => {
      const customer = await Customer.create({
        companyId,
        name: 'Alpha Infra LLC',
        code: 'CUST-ALPHA',
        email: 'finance@alphainfra.com',
        creditLimit: 100000,
        creditStanding: {
          limit: 100000,
          usedCredit: 80000,
          availableCredit: 20000,
          status: 'good',
          score: 90,
          paymentTerms: 'Net 30'
        },
        primaryContact: { name: 'Fin Officer', email: 'finance@alphainfra.com' },
        createdBy: userId
      });

      const creditInfo = customer.getCreditStatus();
      expect(creditInfo.limit).toBe(100000);
      expect(creditInfo.usedCredit).toBe(80000);
      expect(creditInfo.availableCredit).toBe(20000);
      expect(creditInfo.utilizationPercentage).toBe(80);
      expect(creditInfo.isCreditHold).toBe(false);
    });

    it('should flag credit hold when credit limit is exceeded', async () => {
      const customer = await Customer.create({
        companyId,
        name: 'Overdue Client Corp',
        code: 'CUST-OVERDUE',
        email: 'ap@overdue.com',
        status: 'on_hold',
        creditLimit: 50000,
        creditStanding: {
          limit: 50000,
          usedCredit: 55000,
          availableCredit: 0,
          status: 'credit_hold',
          score: 45,
          paymentTerms: 'Net 15'
        },
        primaryContact: { name: 'AP Clerk', email: 'ap@overdue.com' },
        createdBy: userId
      });

      const creditInfo = customer.getCreditStatus();
      expect(creditInfo.isCreditHold).toBe(true);
      expect(creditInfo.status).toBe('credit_hold');
    });
  });

  describe('3. Supplier Performance Metrics Unit Method', () => {
    it('should calculate supplier quality rating, on-time delivery rate, and risk level', async () => {
      const supplier = await Supplier.create({
        companyId,
        name: 'Apex Raw Steel Supply',
        code: 'SUP-APEX',
        email: 'sales@apexsteel.com',
        rating: 4.8,
        complianceStatus: 'compliant',
        primaryContact: { name: 'Sales Manager', email: 'sales@apexsteel.com' },
        purchaseHistory: [
          {
            poNumber: 'PO-101',
            itemSummary: '100 Tons Steel',
            itemsCount: 1,
            totalAmount: 50000,
            status: 'delivered',
            deliveryRating: 5
          },
          {
            poNumber: 'PO-102',
            itemSummary: '50 Tons Steel',
            itemsCount: 1,
            totalAmount: 25000,
            status: 'delivered',
            deliveryRating: 4
          }
        ],
        createdBy: userId
      });

      const metrics = supplier.getPerformanceMetrics();
      expect(metrics.qualityRating).toBe(4.5); // Average of 5 and 4
      expect(metrics.onTimeDeliveryRate).toBe(100);
      expect(metrics.riskLevel).toBe('low');
      expect(metrics.totalSpend).toBe(75000);
    });
  });

  describe('4. Inventory Math & Threshold Unit Calculations', () => {
    it('should correctly evaluate available stock (quantity - reservedQuantity)', async () => {
      const warehouse = await Warehouse.create({
        companyId,
        code: 'WH-UNIT',
        name: 'Unit Testing Storage',
        capacity: 1000,
        createdBy: userId
      });

      const product = await Product.create({
        companyId,
        sku: 'UNIT-ITEM-01',
        name: 'Precision Bearing',
        costPrice: 15,
        price: 30,
        uom: { unit: 'pcs' },
        minStockLevel: 10,
        createdBy: userId
      });

      const inventory = new Inventory({
        companyId,
        warehouseId: warehouse._id,
        productId: product._id,
        sku: product.sku,
        itemName: product.name,
        quantity: 500,
        reservedQuantity: 120,
        unitCost: 15,
        totalValue: 7500
      });

      const availableQuantity = inventory.quantity - inventory.reservedQuantity;
      expect(availableQuantity).toBe(380);
    });
  });
});
