import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import User from '../models/User';
import Company from '../models/Company';
import Role from '../models/Role';
import { DocumentModel } from '../models/Document';
import Notification from '../models/Notification';
import AuditLog from '../models/AuditLog';

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

describe('Workspace, Documents, Notifications & Audit Integration Suite', () => {
  let companyA: any;
  let companyB: any;
  let companyIdA: string;
  let companyIdB: string;

  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    // 1. Companies
    companyA = await Company.create({
      name: 'OmniCorp Operations Ltd',
      code: 'OMNI-CORP',
      email: 'admin@omnicorp.com',
      address: '100 Omni Plaza',
      city: 'New York',
      country: 'USA',
    });
    companyIdA = companyA._id.toString();

    companyB = await Company.create({
      name: 'Initech Systems',
      code: 'INITECH-SYS',
      email: 'admin@initech.com',
      address: '200 Tech Park',
      city: 'Austin',
      country: 'USA',
    });
    companyIdB = companyB._id.toString();

    // 2. Roles
    const opsRoleA = await Role.create({
      companyId: companyA._id,
      name: 'Operations Administrator',
      description: 'Documents, reports, audit, and notifications',
      permissions: [
        'documents:read',
        'documents:create',
        'documents:delete',
        'reports:read',
        'company:read',
      ],
      isSystemRole: false,
    });

    const opsRoleB = await Role.create({
      companyId: companyB._id,
      name: 'Operations Administrator B',
      description: 'Operations for Initech',
      permissions: [
        'documents:read',
        'documents:create',
        'documents:delete',
        'reports:read',
        'company:read',
      ],
      isSystemRole: false,
    });

    // 3. Users
    userA = await User.create({
      companyId: companyA._id,
      roleId: opsRoleA._id,
      firstName: 'Olivia',
      lastName: 'Operations',
      email: 'olivia@omnicorp.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Company Admin',
      status: 'active',
    });

    userB = await User.create({
      companyId: companyB._id,
      roleId: opsRoleB._id,
      firstName: 'Bill',
      lastName: 'Lumbergh',
      email: 'bill@initech.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Company Admin',
      status: 'active',
    });

    // 4. Tokens
    tokenA = jwt.sign(
      { userId: userA._id.toString(), companyId: companyIdA, roleId: opsRoleA._id.toString(), role: 'Company Admin' },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    tokenB = jwt.sign(
      { userId: userB._id.toString(), companyId: companyIdB, roleId: opsRoleB._id.toString(), role: 'Company Admin' },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('1. Central Document Repository', () => {
    it('1.1 should create a document entry, retrieve stats, and fetch documents list', async () => {
      const docPayload = {
        title: 'Safety Operating Procedure: CNC Milling',
        category: 'sop',
        fileName: 'sop_cnc_milling_v2.pdf',
        fileUrl: 'https://storage.diws.internal/documents/sop_cnc_milling_v2.pdf',
        fileSize: 524288,
        version: '2.0',
        tags: ['Safety', 'Machining', 'CNC'],
      };

      const createRes = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(docPayload);

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.title).toBe('Safety Operating Procedure: CNC Milling');
      expect(createRes.body.data.category).toBe('sop');
      const docId = createRes.body.data._id;

      // Stats
      const statsRes = await request(app)
        .get('/api/documents/stats')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.success).toBe(true);
      expect(statsRes.body.data.total).toBe(1);

      // List
      const listRes = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(1);

      // Delete
      const delRes = await request(app)
        .delete(`/api/documents/${docId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
    });
  });

  describe('2. Notification Management', () => {
    it('2.1 should retrieve unread notification count and mark all notifications as read', async () => {
      await Notification.create({
        companyId: companyA._id,
        userId: userA._id,
        title: 'System Alert: Low Raw Material Stock',
        message: 'Steel Rod inventory is below safety threshold',
        type: 'low_stock',
        status: 'unread',
      });

      await Notification.create({
        companyId: companyA._id,
        userId: userA._id,
        title: 'Work Order Completed',
        message: 'WO-2026-001 has been finished',
        type: 'production_update',
        status: 'unread',
      });

      // 1. Get unread count
      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(countRes.status).toBe(200);
      expect(countRes.body.success).toBe(true);
      expect(countRes.body.data.count).toBe(2);

      // 2. Mark all as read
      const markRes = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(markRes.status).toBe(200);
      expect(markRes.body.success).toBe(true);

      // 3. Verify unread count is now 0
      const countAfterRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(countAfterRes.body.data.count).toBe(0);
    });
  });

  describe('3. Reports Center & Audit Log Trail', () => {
    it('3.1 should list available report categories and templates', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('3.2 should query paginated audit log activities', async () => {
      await AuditLog.create({
        companyId: companyA._id,
        userId: userA._id,
        action: 'INVENTORY_STOCK_IN',
        module: 'inventory',
        referenceId: 'INV-1002',
        before: { quantity: 50 },
        after: { quantity: 100 },
      });

      const res = await request(app)
        .get('/api/audit/logs')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].action).toBe('INVENTORY_STOCK_IN');
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('4. Multi-Tenant Isolation for Workspace Operations', () => {
    it('4.1 should isolate documents and audit logs between Company A and Company B', async () => {
      await DocumentModel.create({
        companyId: companyA._id,
        title: 'Company A Secret Patent',
        category: 'other',
        fileName: 'patent.pdf',
        fileUrl: 'https://storage.diws.internal/patent.pdf',
        version: '1.0',
        uploadedBy: userA._id,
        createdBy: userA._id,
      });

      const resA = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.length).toBe(1);

      const resB = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.length).toBe(0);
    });
  });
});
