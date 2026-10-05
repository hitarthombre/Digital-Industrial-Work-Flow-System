import request from 'supertest';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import User from '../models/User';
import Company from '../models/Company';
import Role from '../models/Role';
import Permission from '../models/Permission';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireRole, requirePermission } from '../middleware/rbac.middleware';
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

describe('Role-Based Access Control (RBAC) & Permissions Test Suite', () => {
  let companyId: mongoose.Types.ObjectId;
  let adminRole: any;
  let managerRole: any;
  let staffRole: any;

  let ownerUser: any;
  let adminUser: any;
  let managerUser: any;
  let staffUser: any;

  let ownerToken: string;
  let adminToken: string;
  let managerToken: string;
  let staffToken: string;

  // Dedicated test app with RBAC protected endpoints
  const testApp = express();
  testApp.use(express.json());

  // Test endpoints for RBAC verification
  testApp.get('/test/public', (req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'Public endpoint' });
  });

  // Role protected routes
  testApp.get(
    '/test/role/admin-only',
    authenticate as any,
    requireRole('Admin') as any,
    (req: Request, res: Response) => {
      res.status(200).json({ success: true, message: 'Welcome Admin' });
    }
  );

  testApp.get(
    '/test/role/manager-or-admin',
    authenticate as any,
    requireRole('Admin', 'Manager') as any,
    (req: Request, res: Response) => {
      res.status(200).json({ success: true, message: 'Welcome Leader' });
    }
  );

  testApp.get(
    '/test/role/staff-only',
    authenticate as any,
    requireRole('Staff') as any,
    (req: Request, res: Response) => {
      res.status(200).json({ success: true, message: 'Welcome Staff' });
    }
  );

  // Permission protected routes
  testApp.get(
    '/test/perm/inventory-read',
    authenticate as any,
    requirePermission('inventory:read') as any,
    (req: Request, res: Response) => {
      res.status(200).json({ success: true, message: 'Inventory data' });
    }
  );

  testApp.post(
    '/test/perm/inventory-create',
    authenticate as any,
    requirePermission('inventory:create') as any,
    (req: Request, res: Response) => {
      res.status(201).json({ success: true, message: 'Inventory created' });
    }
  );

  testApp.delete(
    '/test/perm/admin-multi-perm',
    authenticate as any,
    requirePermission('inventory:delete', 'system:manage') as any,
    (req: Request, res: Response) => {
      res.status(200).json({ success: true, message: 'Multi-permission granted' });
    }
  );

  beforeEach(async () => {
    const comp = await Company.create({
      name: 'RBAC Test Corporation',
      code: 'RBAC-01',
      email: 'admin@rbactest.com',
      address: '200 Industrial Boulevard',
      city: 'Mumbai',
      country: 'India'
    });
    companyId = comp._id as mongoose.Types.ObjectId;

    // Seed master permissions
    await Permission.create([
      { code: 'inventory:read', module: 'inventory', description: 'Read inventory items' },
      { code: 'inventory:create', module: 'inventory', description: 'Create inventory items' },
      { code: 'inventory:delete', module: 'inventory', description: 'Delete inventory items' },
      { code: 'system:manage', module: 'system', description: 'Manage system settings' }
    ]);

    // Create Admin, Manager, and Staff roles
    adminRole = await Role.create({
      companyId,
      name: 'Admin',
      description: 'Full administrative access',
      permissions: ['inventory:read', 'inventory:create', 'inventory:delete', 'system:manage'],
      isSystemRole: false
    });

    managerRole = await Role.create({
      companyId,
      name: 'Manager',
      description: 'Department management and inventory read/create',
      permissions: ['inventory:read', 'inventory:create'],
      isSystemRole: false
    });

    staffRole = await Role.create({
      companyId,
      name: 'Staff',
      description: 'Operational view only',
      permissions: ['inventory:read'],
      isSystemRole: false
    });

    // Create Users
    ownerUser = await User.create({
      companyId,
      firstName: 'Company',
      lastName: 'Owner',
      email: 'owner@rbactest.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Company Owner',
      status: 'active'
    });

    adminUser = await User.create({
      companyId,
      firstName: 'Site',
      lastName: 'Admin',
      email: 'admin@rbactest.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Admin',
      roleId: adminRole._id,
      status: 'active'
    });

    managerUser = await User.create({
      companyId,
      firstName: 'Plant',
      lastName: 'Manager',
      email: 'manager@rbactest.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Manager',
      roleId: managerRole._id,
      status: 'active'
    });

    staffUser = await User.create({
      companyId,
      firstName: 'Line',
      lastName: 'Staff',
      email: 'staff@rbactest.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Staff',
      roleId: staffRole._id,
      status: 'active'
    });

    // Generate tokens
    ownerToken = authService.generateAccessToken({
      userId: ownerUser._id.toString(),
      companyId: companyId.toString(),
      role: ownerUser.role
    });

    adminToken = authService.generateAccessToken({
      userId: adminUser._id.toString(),
      companyId: companyId.toString(),
      roleId: adminRole._id.toString(),
      role: adminUser.role
    });

    managerToken = authService.generateAccessToken({
      userId: managerUser._id.toString(),
      companyId: companyId.toString(),
      roleId: managerRole._id.toString(),
      role: managerUser.role
    });

    staffToken = authService.generateAccessToken({
      userId: staffUser._id.toString(),
      companyId: companyId.toString(),
      roleId: staffRole._id.toString(),
      role: staffUser.role
    });
  });

  // --------------------------------------------------------------------------
  // 1. Role-Based Middleware Tests (requireRole)
  // --------------------------------------------------------------------------
  describe('1. requireRole Middleware Logic', () => {
    it('should block unauthenticated requests with 401', async () => {
      const res = await request(testApp).get('/test/role/admin-only');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token is missing/i);
    });

    it('should allow Company Owner to bypass requireRole restrictions', async () => {
      const res = await request(testApp)
        .get('/test/role/admin-only')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow Admin to access admin-only endpoint', async () => {
      const res = await request(testApp)
        .get('/test/role/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Welcome Admin');
    });

    it('should deny Manager from accessing admin-only endpoint with 403 Forbidden', async () => {
      const res = await request(testApp)
        .get('/test/role/admin-only')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/);
    });

    it('should deny Staff from accessing admin-only endpoint with 403 Forbidden', async () => {
      const res = await request(testApp)
        .get('/test/role/admin-only')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow both Admin and Manager to access leader endpoint', async () => {
      const adminRes = await request(testApp)
        .get('/test/role/manager-or-admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);

      const managerRes = await request(testApp)
        .get('/test/role/manager-or-admin')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(managerRes.status).toBe(200);
    });

    it('should deny Staff from accessing manager-or-admin endpoint with 403', async () => {
      const res = await request(testApp)
        .get('/test/role/manager-or-admin')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow Staff to access staff-only endpoint', async () => {
      const res = await request(testApp)
        .get('/test/role/staff-only')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Welcome Staff');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Granular Permission-Based Middleware Tests (requirePermission)
  // --------------------------------------------------------------------------
  describe('2. requirePermission Middleware Logic & Endpoint Restrictions', () => {
    it('should block unauthenticated requests with 401', async () => {
      const res = await request(testApp).get('/test/perm/inventory-read');
      expect(res.status).toBe(401);
    });

    it('should allow Company Owner to bypass all granular permission checks', async () => {
      const res = await request(testApp)
        .delete('/test/perm/admin-multi-perm')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow Admin, Manager, and Staff to access inventory-read (all have permission)', async () => {
      const adminRes = await request(testApp)
        .get('/test/perm/inventory-read')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);

      const managerRes = await request(testApp)
        .get('/test/perm/inventory-read')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(managerRes.status).toBe(200);

      const staffRes = await request(testApp)
        .get('/test/perm/inventory-read')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(staffRes.status).toBe(200);
    });

    it('should allow Admin and Manager to create inventory, but deny Staff (missing inventory:create)', async () => {
      const adminRes = await request(testApp)
        .post('/test/perm/inventory-create')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(201);

      const managerRes = await request(testApp)
        .post('/test/perm/inventory-create')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(managerRes.status).toBe(201);

      const staffRes = await request(testApp)
        .post('/test/perm/inventory-create')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(staffRes.status).toBe(403);
      expect(staffRes.body.success).toBe(false);
      expect(staffRes.body.message).toMatch(/Insufficient permissions.*inventory:create/);
    });

    it('should enforce multiple simultaneous permissions (inventory:delete AND system:manage)', async () => {
      // Admin has both permissions -> Allowed
      const adminRes = await request(testApp)
        .delete('/test/perm/admin-multi-perm')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);

      // Manager lacks both -> Denied 403
      const managerRes = await request(testApp)
        .delete('/test/perm/admin-multi-perm')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(managerRes.status).toBe(403);

      // Staff lacks both -> Denied 403
      const staffRes = await request(testApp)
        .delete('/test/perm/admin-multi-perm')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(staffRes.status).toBe(403);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Permission Fallback Resolution by Role Name
  // --------------------------------------------------------------------------
  describe('3. Permission Fallback Resolution via Role Name when roleId is omitted', () => {
    it('should resolve permissions from Role model by name when user.roleId is not set', async () => {
      // Create user without roleId, only role name
      const fallbackUser = await User.create({
        companyId,
        firstName: 'Fallback',
        lastName: 'Manager',
        email: 'fallback@rbactest.com',
        passwordHash: 'hash',
        role: 'Manager',
        status: 'active'
      });

      const token = authService.generateAccessToken({
        userId: fallbackUser._id.toString(),
        companyId: companyId.toString(),
        role: fallbackUser.role
      });

      // Manager has inventory:read and inventory:create
      const readRes = await request(testApp)
        .get('/test/perm/inventory-read')
        .set('Authorization', `Bearer ${token}`);
      expect(readRes.status).toBe(200);

      const createRes = await request(testApp)
        .post('/test/perm/inventory-create')
        .set('Authorization', `Bearer ${token}`);
      expect(createRes.status).toBe(201);

      // But lacks inventory:delete
      const multiRes = await request(testApp)
        .delete('/test/perm/admin-multi-perm')
        .set('Authorization', `Bearer ${token}`);
      expect(multiRes.status).toBe(403);
    });
  });
});
