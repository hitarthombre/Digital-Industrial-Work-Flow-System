import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import User from '../models/User';
import Company from '../models/Company';
import Role from '../models/Role';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { enforceTenantIsolation } from '../middleware/tenant.middleware';
import { requireRole, requirePermission } from '../middleware/rbac.middleware';

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

describe('Middleware Unit Testing Suite (auth.middleware, tenant.middleware, rbac.middleware)', () => {
  let companyId: mongoose.Types.ObjectId;
  let customRole: any;
  let activeUser: any;

  // Helper to mock express Response object
  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const company = await Company.create({
      name: 'Middleware Test Corp',
      code: 'MID-01',
      email: 'mid@test.com'
    });
    companyId = company._id as mongoose.Types.ObjectId;

    customRole = await Role.create({
      companyId,
      name: 'Custom Supervisor',
      permissions: ['orders:read', 'orders:approve']
    });

    activeUser = await User.create({
      companyId,
      firstName: 'Mid',
      lastName: 'User',
      email: 'miduser@test.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Custom Supervisor',
      roleId: customRole._id,
      status: 'active'
    });
  });

  // --------------------------------------------------------------------------
  // 1. auth.middleware.ts Unit Tests
  // --------------------------------------------------------------------------
  describe('1. auth.middleware.ts (authenticate)', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const req: any = { headers: {} };
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Access token is missing or malformed' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header does not start with Bearer', async () => {
      const req: any = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', async () => {
      const expiredToken = jwt.sign(
        { userId: activeUser._id.toString(), companyId: companyId.toString(), role: 'Admin' },
        JWT_ACCESS_SECRET,
        { expiresIn: '-5s' }
      );

      const req: any = { headers: { authorization: `Bearer ${expiredToken}` } };
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Access token has expired' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid or tampered', async () => {
      const req: any = { headers: { authorization: 'Bearer invalid.tampered.token' } };
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Invalid access token' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found or inactive', async () => {
      const deletedUserId = new mongoose.Types.ObjectId().toString();
      const token = jwt.sign(
        { userId: deletedUserId, companyId: companyId.toString(), role: 'Admin' },
        JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      const req: any = { headers: { authorization: `Bearer ${token}` } };
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User account is suspended, inactive, or not found' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should attach user, companyId, and role permissions onto req and call next() for valid active user', async () => {
      const token = jwt.sign(
        {
          userId: activeUser._id.toString(),
          companyId: companyId.toString(),
          roleId: customRole._id.toString(),
          role: activeUser.role
        },
        JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      const req: AuthenticatedRequest = { headers: { authorization: `Bearer ${token}` } } as any;
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?._id.toString()).toBe(activeUser._id.toString());
      expect(req.companyId).toBe(companyId.toString());
      expect(req.permissions).toEqual(expect.arrayContaining(['orders:read', 'orders:approve']));
    });
  });

  // --------------------------------------------------------------------------
  // 2. tenant.middleware.ts Unit Tests
  // --------------------------------------------------------------------------
  describe('2. tenant.middleware.ts (enforceTenantIsolation)', () => {
    it('should return 401 when req.user or req.companyId is missing', () => {
      const req: AuthenticatedRequest = { params: {}, query: {}, body: {} } as any;
      const res = mockResponse();
      const next = jest.fn();

      enforceTenantIsolation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() when no targetCompanyId is specified (general tenant resource)', () => {
      const req: AuthenticatedRequest = {
        user: activeUser,
        companyId: companyId.toString(),
        params: {},
        query: {},
        body: {}
      } as any;
      const res = mockResponse();
      const next = jest.fn();

      enforceTenantIsolation(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() when targetCompanyId in params matches req.companyId', () => {
      const req: AuthenticatedRequest = {
        user: activeUser,
        companyId: companyId.toString(),
        params: { companyId: companyId.toString() },
        query: {},
        body: {}
      } as any;
      const res = mockResponse();
      const next = jest.fn();

      enforceTenantIsolation(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 when targetCompanyId in params belongs to a different tenant', () => {
      const foreignCompanyId = new mongoose.Types.ObjectId().toString();
      const req: AuthenticatedRequest = {
        user: activeUser,
        companyId: companyId.toString(),
        params: { companyId: foreignCompanyId },
        query: {},
        body: {}
      } as any;
      const res = mockResponse();
      const next = jest.fn();

      enforceTenantIsolation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Forbidden: Cross-tenant data access is strictly prohibited'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when targetCompanyId in body belongs to a different tenant', () => {
      const foreignCompanyId = new mongoose.Types.ObjectId().toString();
      const req: AuthenticatedRequest = {
        user: activeUser,
        companyId: companyId.toString(),
        params: {},
        query: {},
        body: { companyId: foreignCompanyId }
      } as any;
      const res = mockResponse();
      const next = jest.fn();

      enforceTenantIsolation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // 3. rbac.middleware.ts Unit Tests
  // --------------------------------------------------------------------------
  describe('3. rbac.middleware.ts (requireRole & requirePermission)', () => {
    describe('requireRole', () => {
      it('should return 401 when req.user is missing', () => {
        const middleware = requireRole('Admin');
        const req: any = {};
        const res = mockResponse();
        const next = jest.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      });

      it('should bypass role check for Company Owner and Company Admin', () => {
        const middleware = requireRole('Admin');

        // Company Owner
        const reqOwner: any = { user: { role: 'Company Owner' } };
        const resOwner = mockResponse();
        const nextOwner = jest.fn();
        middleware(reqOwner, resOwner, nextOwner);
        expect(nextOwner).toHaveBeenCalled();

        // Company Admin
        const reqAdmin: any = { user: { role: 'Company Admin' } };
        const resAdmin = mockResponse();
        const nextAdmin = jest.fn();
        middleware(reqAdmin, resAdmin, nextAdmin);
        expect(nextAdmin).toHaveBeenCalled();
      });

      it('should call next() when user has one of the required roles', () => {
        const middleware = requireRole('Manager', 'Custom Supervisor');
        const req: any = { user: { role: 'Custom Supervisor' } };
        const res = mockResponse();
        const next = jest.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should return 403 when user lacks required role', () => {
        const middleware = requireRole('Director', 'Executive');
        const req: any = { user: { role: 'Staff' } };
        const res = mockResponse();
        const next = jest.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Forbidden: Access requires one of the following roles: Director, Executive'
          })
        );
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('requirePermission', () => {
      it('should return 401 when req.user is missing', () => {
        const middleware = requirePermission('inventory:view');
        const req: any = {};
        const res = mockResponse();
        const next = jest.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      });

      it('should bypass permission check for Company Owner and Company Admin', () => {
        const middleware = requirePermission('finance:audit', 'system:delete_all');
        const req: any = { user: { role: 'Company Owner' } };
        const res = mockResponse();
        const next = jest.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('should call next() when user has all required permissions', () => {
        const middleware = requirePermission('orders:read', 'orders:approve');
        const req: any = {
          user: { role: 'Supervisor' },
          permissions: ['orders:read', 'orders:approve', 'orders:create']
        };
        const res = mockResponse();
        const next = jest.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('should return 403 when user is missing any required permission', () => {
        const middleware = requirePermission('orders:read', 'orders:delete');
        const req: any = {
          user: { role: 'Supervisor' },
          permissions: ['orders:read'] // missing orders:delete
        };
        const res = mockResponse();
        const next = jest.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Forbidden: Insufficient permissions. Required: orders:read, orders:delete'
          })
        );
        expect(next).not.toHaveBeenCalled();
      });
    });
  });
});
