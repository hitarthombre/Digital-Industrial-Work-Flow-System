import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import User from '../models/User';
import Company from '../models/Company';
import Role from '../models/Role';
import Permission from '../models/Permission';
import Session from '../models/Session';
import PasswordReset from '../models/PasswordReset';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe('Core Models Verification Suite (Target Models: User, Company, Role, Permission, Session, PasswordReset)', () => {
  let companyId: mongoose.Types.ObjectId;
  let userId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const comp = await Company.create({
      name: 'Omni Industrial Group',
      code: 'OMNI-01',
      email: 'corp@omni.com',
      address: '77 Industrial Park',
      city: 'Pune',
      country: 'India'
    });
    companyId = comp._id as mongoose.Types.ObjectId;

    const user = await User.create({
      companyId,
      firstName: 'Omni',
      lastName: 'Admin',
      email: 'admin@omni.com',
      password: 'AdminPassword123!',
      role: 'Admin'
    });
    userId = user._id as mongoose.Types.ObjectId;
  });

  // --------------------------------------------------------------------------
  // 1. User Model Target Verification
  // --------------------------------------------------------------------------
  describe('1. User Model Target', () => {
    it('should validate required fields and defaults', async () => {
      const user = await User.create({
        companyId,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@omni.com',
        password: 'Password123'
      });

      expect(user._id).toBeDefined();
      expect(user.role).toBe('Employee'); // Default role
      expect(user.status).toBe('active'); // Default status
      expect(user.isEmailVerified).toBe(false); // Default email verification
      expect(user.passwordHash).toBeDefined();
      expect(await user.comparePassword('Password123')).toBe(true);
    });

    it('should reject user creation missing required email or companyId', async () => {
      // Missing email
      await expect(
        User.create({
          companyId,
          firstName: 'No',
          lastName: 'Email',
          passwordHash: 'hash'
        })
      ).rejects.toThrow();

      // Missing companyId
      await expect(
        User.create({
          firstName: 'No',
          lastName: 'Company',
          email: 'nocompany@omni.com',
          passwordHash: 'hash'
        })
      ).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      await expect(
        User.create({
          companyId,
          firstName: 'Duplicate',
          lastName: 'Email',
          email: 'admin@omni.com', // Already created in beforeEach
          passwordHash: 'hash'
        })
      ).rejects.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Company Model Target Verification
  // --------------------------------------------------------------------------
  describe('2. Company Model Target', () => {
    it('should enforce required name and code, and apply schema defaults', async () => {
      const comp = await Company.create({
        name: 'Nexus Tech Industries',
        code: 'nexus-02', // Should be normalized to uppercase by model or application
        email: 'info@nexus.com'
      });

      expect(comp._id).toBeDefined();
      expect(comp.currency).toBe('USD');
      expect(comp.timezone).toBe('UTC');
      expect(comp.status).toBe('active');
      expect(comp.subscriptionPlan).toBe('free');
      expect(comp.isDeleted).toBe(false);
    });

    it('should enforce unique company code constraint', async () => {
      await expect(
        Company.create({
          name: 'Omni Clone Corp',
          code: 'OMNI-01' // Duplicate code
        })
      ).rejects.toThrow();
    });

    it('should persist branding and settings objects', async () => {
      const comp = await Company.create({
        name: 'Branded Company',
        code: 'BRAND-01',
        branding: {
          displayName: 'Branded Display',
          primaryColor: '#0066CC',
          logo: 'https://cdn.example.com/logo.png'
        },
        settings: {
          dateFormat: 'DD/MM/YYYY',
          fiscalYear: 'January-December',
          currency: 'INR'
        }
      });

      expect(comp.branding?.primaryColor).toBe('#0066CC');
      expect(comp.settings?.fiscalYear).toBe('January-December');
      expect(comp.settings?.currency).toBe('INR');
    });

    it('should support soft deletion flags', async () => {
      const comp = await Company.create({
        name: 'Obsolete Corp',
        code: 'OBS-99'
      });

      comp.isDeleted = true;
      comp.deletedAt = new Date();
      comp.deletedBy = userId;
      await comp.save();

      const updated = await Company.findById(comp._id);
      expect(updated?.isDeleted).toBe(true);
      expect(updated?.deletedAt).toBeDefined();
      expect(updated?.deletedBy?.toString()).toBe(userId.toString());
    });
  });

  // --------------------------------------------------------------------------
  // 3. Role Model Target Verification
  // --------------------------------------------------------------------------
  describe('3. Role Model Target', () => {
    it('should create company-scoped and system roles with permissions list', async () => {
      // System Role
      const systemRole = await Role.create({
        name: 'System Super Admin',
        description: 'Global administrator',
        permissions: ['*'],
        isSystemRole: true
      });
      expect(systemRole._id).toBeDefined();
      expect(systemRole.isSystemRole).toBe(true);
      expect(systemRole.companyId).toBeUndefined();

      // Company Scoped Role
      const tenantRole = await Role.create({
        companyId,
        name: 'Warehouse Supervisor',
        description: 'Manages warehouse staff and movements',
        permissions: ['inventory:read', 'warehouse:manage', 'stock:transfer'],
        isSystemRole: false
      });
      expect(tenantRole._id).toBeDefined();
      expect(tenantRole.companyId?.toString()).toBe(companyId.toString());
      expect(tenantRole.permissions).toContain('stock:transfer');
    });

    it('should reject role creation without required name', async () => {
      await expect(
        Role.create({
          companyId,
          permissions: ['some:perm']
        })
      ).rejects.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Permission Model Target Verification
  // --------------------------------------------------------------------------
  describe('4. Permission Model Target', () => {
    it('should create permission record with code, module, and description', async () => {
      const perm = await Permission.create({
        code: 'production:execute',
        module: 'production',
        description: 'Execute production line work orders'
      });

      expect(perm._id).toBeDefined();
      expect(perm.code).toBe('production:execute');
      expect(perm.module).toBe('production');
      expect(perm.description).toBe('Execute production line work orders');
    });

    it('should enforce unique constraint on permission code', async () => {
      await Permission.create({
        code: 'sales:approve',
        module: 'sales',
        description: 'Approve sales orders'
      });

      await expect(
        Permission.create({
          code: 'sales:approve',
          module: 'sales',
          description: 'Duplicate code'
        })
      ).rejects.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // 5. Session Model Target Verification
  // --------------------------------------------------------------------------
  describe('5. Session Model Target', () => {
    it('should create and store active session with hashed refresh token and expiration', async () => {
      const sessionId = 'sess_' + new mongoose.Types.ObjectId().toString();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const session = await Session.create({
        sessionId,
        userId,
        companyId,
        refreshTokenHash: '$2b$10$hashed_refresh_token_value',
        expiresAt,
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 Test Browser'
      });

      expect(session._id).toBeDefined();
      expect(session.sessionId).toBe(sessionId);
      expect(session.userId.toString()).toBe(userId.toString());
      expect(session.companyId.toString()).toBe(companyId.toString());
      expect(session.revokedAt).toBeUndefined();
    });

    it('should enforce unique sessionId index', async () => {
      const duplicateSessionId = 'unique_session_123';
      await Session.create({
        sessionId: duplicateSessionId,
        userId,
        companyId,
        refreshTokenHash: 'hash1',
        expiresAt: new Date(Date.now() + 10000)
      });

      await expect(
        Session.create({
          sessionId: duplicateSessionId,
          userId,
          companyId,
          refreshTokenHash: 'hash2',
          expiresAt: new Date(Date.now() + 10000)
        })
      ).rejects.toThrow();
    });

    it('should track session revocation', async () => {
      const session = await Session.create({
        sessionId: 'sess_revoke_test',
        userId,
        companyId,
        refreshTokenHash: 'hash',
        expiresAt: new Date(Date.now() + 10000)
      });

      session.revokedAt = new Date();
      await session.save();

      const retrieved = await Session.findOne({ sessionId: 'sess_revoke_test' });
      expect(retrieved?.revokedAt).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 6. PasswordReset Model Target Verification
  // --------------------------------------------------------------------------
  describe('6. PasswordReset Model Target', () => {
    it('should create password reset entry with hashed token and expiration', async () => {
      const tokenHash = 'sha256_mock_hash_for_testing_12345';
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      const resetDoc = await PasswordReset.create({
        userId,
        tokenHash,
        expiresAt
      });

      expect(resetDoc._id).toBeDefined();
      expect(resetDoc.userId.toString()).toBe(userId.toString());
      expect(resetDoc.tokenHash).toBe(tokenHash);
      expect(resetDoc.usedAt).toBeUndefined();
    });

    it('should enforce unique tokenHash constraint', async () => {
      const tokenHash = 'duplicate_token_hash_value';
      await PasswordReset.create({
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000)
      });

      await expect(
        PasswordReset.create({
          userId,
          tokenHash,
          expiresAt: new Date(Date.now() + 3600000)
        })
      ).rejects.toThrow();
    });

    it('should track usedAt when reset token is consumed', async () => {
      const resetDoc = await PasswordReset.create({
        userId,
        tokenHash: 'consume_token_hash',
        expiresAt: new Date(Date.now() + 3600000)
      });

      resetDoc.usedAt = new Date();
      await resetDoc.save();

      const retrieved = await PasswordReset.findById(resetDoc._id);
      expect(retrieved?.usedAt).toBeDefined();
    });
  });
});
