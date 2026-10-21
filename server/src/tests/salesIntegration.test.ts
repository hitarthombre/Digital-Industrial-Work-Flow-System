import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import User from '../models/User';
import Company from '../models/Company';
import Role from '../models/Role';
import Warehouse from '../models/Warehouse';
import Customer from '../models/Customer';
import { Quotation } from '../models/Quotation';
import { SalesOrder } from '../models/SalesOrder';
import { SalesInvoice } from '../models/SalesInvoice';

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

describe('Sales & Invoicing Module Integration Suite', () => {
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
  let customerB: any;

  beforeEach(async () => {
    // 1. Setup Companies
    companyA = await Company.create({
      name: 'Global Valve Systems Ltd',
      code: 'GVS-CORP',
      email: 'sales@gvs.com',
      address: '100 Industrial Parkway',
      city: 'Houston',
      country: 'USA',
    });
    companyIdA = companyA._id.toString();

    companyB = await Company.create({
      name: 'Pacific Trading Corp',
      code: 'PAC-TRADE',
      email: 'sales@pacifictrade.com',
      address: '200 Harbor Way',
      city: 'San Francisco',
      country: 'USA',
    });
    companyIdB = companyB._id.toString();

    // 2. Roles
    const salesRoleA = await Role.create({
      companyId: companyA._id,
      name: 'Sales Director',
      description: 'Manage quotations, orders, and invoices',
      permissions: ['sales:read', 'sales:create', 'sales:update', 'warehouses:read'],
      isSystemRole: false,
    });

    const salesRoleB = await Role.create({
      companyId: companyB._id,
      name: 'Sales Director B',
      description: 'Manage sales for Company B',
      permissions: ['sales:read', 'sales:create', 'sales:update', 'warehouses:read'],
      isSystemRole: false,
    });

    // 3. Users
    userA = await User.create({
      companyId: companyA._id,
      roleId: salesRoleA._id,
      firstName: 'Samantha',
      lastName: 'Sales',
      email: 'samantha@gvs.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Company Admin',
      status: 'active',
    });

    userB = await User.create({
      companyId: companyB._id,
      roleId: salesRoleB._id,
      firstName: 'Brian',
      lastName: 'Buyer',
      email: 'brian@pacifictrade.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Company Admin',
      status: 'active',
    });

    // 4. Tokens
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

    // 5. Warehouse for Company A
    warehouseA = await Warehouse.create({
      companyId: companyA._id,
      code: 'WH-HOUSTON-01',
      name: 'Houston Central Depot',
      type: 'finished_goods',
      capacity: 30000,
      currentUsage: 0,
      createdBy: userA._id,
      status: 'active',
    });

    // 6. Customers
    customerA = await Customer.create({
      companyId: companyA._id,
      name: 'Chevron Energy Corp',
      code: 'CUST-CHEVRON',
      creditLimit: 150000,
      createdBy: userA._id,
    });

    customerB = await Customer.create({
      companyId: companyB._id,
      name: 'Pacific Marine Co',
      code: 'CUST-PAC-MAR',
      creditLimit: 100000,
      createdBy: userB._id,
    });
  });

  describe('1. Quotation Lifecycle & Conversion to Sales Order', () => {
    it('1.1 should create a sales quotation with line items and pricing calculations', async () => {
      const quotePayload = {
        customerId: customerA._id.toString(),
        validUntil: new Date(Date.now() + 86400000 * 15).toISOString(),
        shippingCost: 500,
        notes: 'Price lock valid for 15 days',
        items: [
          {
            itemName: 'Stainless Steel Ball Valve 3"',
            sku: 'VALVE-SS-03',
            quantity: 10,
            unitPrice: 250,
            discountPercent: 10,
            taxRate: 5,
          },
        ],
      };

      const res = await request(app)
        .post('/api/sales/quotations')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(quotePayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quotationNumber).toBeDefined();
      expect(res.body.data.status).toBe('Draft');
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].lineTotal).toBe(2362.5);
    });

    it('1.2 should accept quotation and convert it into a confirmed sales order', async () => {
      const quote = await Quotation.create({
        companyId: companyA._id,
        quotationNumber: 'QT-2026-0001',
        customerId: customerA._id,
        status: 'Draft',
        validUntil: new Date(Date.now() + 86400000 * 30),
        subtotal: 5000,
        taxTotal: 250,
        shippingCost: 100,
        grandTotal: 5350,
        items: [
          {
            sku: 'PIPE-FLANGE-10',
            itemName: 'Forged Pipe Flange',
            quantity: 20,
            unitPrice: 250,
            lineTotal: 5000,
          },
        ],
        createdBy: userA._id,
      });

      // Accept quotation
      const statusRes = await request(app)
        .patch(`/api/sales/quotations/${quote._id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'Accepted' });

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.status).toBe('Accepted');

      // Convert quotation to Sales Order
      const convertRes = await request(app)
        .post(`/api/sales/quotations/${quote._id}/convert`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          warehouseId: warehouseA._id.toString(),
          customerPoNumber: 'PO-CHEV-8849',
        });

      expect(convertRes.status).toBe(201);
      expect(convertRes.body.success).toBe(true);
      expect(convertRes.body.data.order.orderNumber).toBeDefined();
      expect(convertRes.body.data.order.customerPoNumber).toBe('PO-CHEV-8849');
    });
  });

  describe('2. Direct Sales Order & Invoicing Workflow', () => {
    it('2.1 should create a direct sales order, approve it, and generate an invoice', async () => {
      const soPayload = {
        customerId: customerA._id.toString(),
        warehouseId: warehouseA._id.toString(),
        customerPoNumber: 'PO-DIRECT-99',
        items: [
          {
            itemName: 'Actuator Pneumatic Double Acting',
            sku: 'ACTUATOR-PN-02',
            quantity: 5,
            unitPrice: 800,
            taxRate: 5,
          },
        ],
      };

      // 1. Create Sales Order
      const createRes = await request(app)
        .post('/api/sales/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(soPayload);

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.status).toBe('Pending Approval');
      const orderId = createRes.body.data._id;

      // 2. Approve Sales Order
      const approveRes = await request(app)
        .patch(`/api/sales/orders/${orderId}/approve`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'Approved', approvalNotes: 'Credit limit verified and cleared' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('Approved');

      // 3. Generate Sales Invoice
      const invoiceRes = await request(app)
        .post('/api/sales/invoices')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          salesOrderId: orderId,
          dueDate: new Date(Date.now() + 86400000 * 30).toISOString(),
          notes: 'Standard Net 30 Terms',
        });

      expect(invoiceRes.status).toBe(201);
      expect(invoiceRes.body.data.invoiceNumber).toBeDefined();
      expect(invoiceRes.body.data.status).toBe('Unpaid');
      const invoiceId = invoiceRes.body.data._id;

      // 4. Record Partial Payment
      const paymentRes = await request(app)
        .post(`/api/sales/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          amount: 2000,
          method: 'bank_transfer',
          reference: 'TXN-BANK-WIRE-001',
          notes: 'Partial advance wire payment received',
        });

      expect(paymentRes.status).toBe(201);
      expect(paymentRes.body.success).toBe(true);
      expect(paymentRes.body.data.status).toBe('Partially Paid');
      expect(paymentRes.body.data.amountPaid).toBe(2000);
    });
  });

  describe('3. Sales Multi-Tenant Isolation', () => {
    it('3.1 should isolate sales quotations and orders between different companies', async () => {
      await Quotation.create({
        companyId: companyA._id,
        quotationNumber: 'QT-ALPHA-PRIVATE',
        customerId: customerA._id,
        status: 'Draft',
        grandTotal: 10000,
        items: [{ sku: 'SKU-A', itemName: 'Item A', quantity: 1, unitPrice: 10000, total: 10000 }],
        createdBy: userA._id,
      });

      const resA = await request(app)
        .get('/api/sales/quotations')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.length).toBe(1);

      const resB = await request(app)
        .get('/api/sales/quotations')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.length).toBe(0);
    });
  });
});
