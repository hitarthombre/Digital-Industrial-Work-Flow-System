import mongoose from 'mongoose';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import User from '../models/User';
import Company from '../models/Company';
import Product from '../models/Product';
import Inventory from '../models/Inventory';
import Warehouse from '../models/Warehouse';
import Supplier from '../models/Supplier';
import Customer from '../models/Customer';
import PurchaseOrder from '../models/PurchaseOrder';
import WorkOrder from '../models/WorkOrder';
import SalesOrder from '../models/SalesOrder';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe('DIWS Particular Models Test Suite', () => {
  let companyId: mongoose.Types.ObjectId;
  let adminUserId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const comp = await Company.create({
      name: 'Apex Industrial Corp',
      code: 'APEX01',
      email: 'contact@apexcorp.com',
      phone: '+1234567890',
      address: '100 Industrial Parkway',
      city: 'TechCity',
      country: 'India'
    });
    companyId = comp._id as mongoose.Types.ObjectId;

    const admin = await User.create({
      companyId,
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@apexcorp.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Admin'
    });
    adminUserId = admin._id as mongoose.Types.ObjectId;
  });

  describe('1. User & Authentication Models', () => {
    it('should create user and store password hash correctly', async () => {
      const user = await User.create({
        companyId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@apexcorp.com',
        passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
        role: 'Admin'
      });

      expect(user._id).toBeDefined();
      expect(user.email).toBe('john@apexcorp.com');
      expect(user.passwordHash).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      await User.create({
        companyId,
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@apexcorp.com',
        passwordHash: 'hash1',
        role: 'Employee'
      });

      await expect(
        User.create({
          companyId,
          firstName: 'Bob',
          lastName: 'Smith',
          email: 'alice@apexcorp.com',
          passwordHash: 'hash2',
          role: 'Employee'
        })
      ).rejects.toThrow();
    });
  });

  describe('2. Product & Inventory Models', () => {
    it('should create product with valid SKU and prices', async () => {
      const product = await Product.create({
        companyId,
        sku: 'RAW-STEEL-001',
        name: 'High Grade Steel Bar',
        costPrice: 50,
        price: 85,
        uom: { unit: 'kg' },
        minStockLevel: 20,
        createdBy: adminUserId
      });

      expect(product._id).toBeDefined();
      expect(product.sku).toBe('RAW-STEEL-001');
      expect(product.costPrice).toBe(50);
    });

    it('should reject negative product prices', async () => {
      await expect(
        Product.create({
          companyId,
          sku: 'RAW-STEEL-002',
          name: 'Invalid Price Item',
          costPrice: -10,
          price: 50,
          uom: { unit: 'pcs' },
          createdBy: adminUserId
        })
      ).rejects.toThrow();
    });

    it('should manage warehouse and inventory level', async () => {
      const warehouse = await Warehouse.create({
        companyId,
        code: 'WH-MAIN',
        name: 'Main Central Warehouse',
        capacity: 10000,
        createdBy: adminUserId
      });

      const product = await Product.create({
        companyId,
        sku: 'RAW-STEEL-003',
        name: 'Steel Sheet',
        costPrice: 100,
        price: 150,
        uom: { unit: 'pcs' },
        createdBy: adminUserId
      });

      const inventory = await Inventory.create({
        companyId,
        warehouseId: warehouse._id,
        productId: product._id,
        sku: product.sku,
        itemName: product.name,
        quantity: 250,
        reservedQuantity: 20,
        unitCost: 100,
        totalValue: 25000
      });

      expect(inventory.quantity).toBe(250);
      expect(inventory.quantity - inventory.reservedQuantity).toBe(230);
    });
  });

  describe('3. Procurement Models (Supplier & Purchase Order)', () => {
    it('should create supplier and purchase order', async () => {
      const supplier = await Supplier.create({
        companyId,
        name: 'Global Metals Supplier Ltd',
        code: 'SUP-001',
        email: 'sales@globalmetals.com',
        phone: '+919876543210',
        primaryContact: {
          name: 'Sales Manager',
          email: 'sales@globalmetals.com'
        },
        createdBy: adminUserId
      });

      const warehouse = await Warehouse.create({
        companyId,
        code: 'WH-PROC',
        name: 'Procurement Warehouse',
        capacity: 5000,
        createdBy: adminUserId
      });

      const po = await PurchaseOrder.create({
        companyId,
        poNumber: 'PO-2026-0001',
        supplierId: supplier._id,
        warehouseId: warehouse._id,
        issuerId: adminUserId,
        items: [
          {
            itemName: 'Raw Steel Supply',
            sku: 'RAW-STL-01',
            itemCategory: 'raw_material',
            quantityOrdered: 100,
            unitPrice: 40,
            totalPrice: 4000
          }
        ],
        subtotal: 4000,
        taxTotal: 400,
        grandTotal: 4400,
        status: 'Issued'
      });

      expect(po.poNumber).toBe('PO-2026-0001');
      expect(po.grandTotal).toBe(4400);
      expect(po.status).toBe('Issued');
    });
  });

  describe('4. Manufacturing Models (Work Order)', () => {
    it('should create work order with BOM raw materials', async () => {
      const warehouse = await Warehouse.create({
        companyId,
        code: 'WH-MFG',
        name: 'Manufacturing Warehouse',
        capacity: 5000,
        createdBy: adminUserId
      });

      const workOrder = await WorkOrder.create({
        companyId,
        workOrderNumber: 'WO-2026-101',
        warehouseId: warehouse._id,
        itemName: 'Engine Gear Box',
        sku: 'FINISHED-GEAR-01',
        unit: 'unit',
        plannedQuantity: 10,
        status: 'Planned',
        createdBy: adminUserId,
        materials: [
          {
            sku: 'RAW-MAT-01',
            itemName: 'Raw Aluminum Ingot',
            requiredQuantity: 50,
            consumedQuantity: 0,
            unit: 'kg'
          }
        ]
      });

      expect(workOrder.workOrderNumber).toBe('WO-2026-101');
      expect(workOrder.plannedQuantity).toBe(10);
      expect(workOrder.materials.length).toBe(1);
    });
  });

  describe('5. Sales Models (Customer & Sales Order)', () => {
    it('should create customer and sales order', async () => {
      const customer = await Customer.create({
        companyId,
        name: 'Metro Automotives Ltd',
        code: 'CUST-001',
        email: 'procurement@metroauto.com',
        primaryContact: {
          name: 'Procurement Officer',
          email: 'procurement@metroauto.com'
        },
        createdBy: adminUserId
      });

      const warehouse = await Warehouse.create({
        companyId,
        code: 'WH-SALES',
        name: 'Sales Dispatch Warehouse',
        capacity: 5000,
        createdBy: adminUserId
      });

      const salesOrder = await SalesOrder.create({
        companyId,
        orderNumber: 'SO-2026-5001',
        customerId: customer._id,
        warehouseId: warehouse._id,
        createdBy: adminUserId,
        items: [
          {
            sku: 'FINISHED-GEAR-01',
            itemName: 'Engine Gear Box',
            quantity: 5,
            unitPrice: 300,
            totalPrice: 1500,
            unitCost: 150
          }
        ],
        subtotal: 1500,
        taxAmount: 150,
        grandTotal: 1650,
        status: 'Approved',
        paymentStatus: 'unpaid'
      });

      expect(salesOrder.orderNumber).toBe('SO-2026-5001');
      expect(salesOrder.grandTotal).toBe(1650);
      expect(salesOrder.status).toBe('Approved');
    });
  });
});
