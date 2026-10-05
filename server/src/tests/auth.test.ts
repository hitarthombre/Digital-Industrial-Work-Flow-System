import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../app';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import User from '../models/User';
import Company from '../models/Company';
import Role from '../models/Role';
import Session from '../models/Session';
import PasswordReset from '../models/PasswordReset';
import EmailVerification from '../models/EmailVerification';
import { authService } from '../services/auth.service';
import { sessionService } from '../services/session.service';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'diws_access_token_secret_key_2026_industrial_workflow';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'diws_refresh_token_secret_key_2026_industrial_workflow';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe('Authentication & User Security Suite', () => {
  let company: any;
  let companyId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    company = await Company.create({
      name: 'Auth Test Corp',
      code: 'AUTH-01',
      email: 'security@authtest.com',
      address: '100 Security Way',
      city: 'Vadodara',
      country: 'India'
    });
    companyId = company._id as mongoose.Types.ObjectId;
  });

  // --------------------------------------------------------------------------
  // 1. User Authentication & Bcrypt Password Hashing
  // --------------------------------------------------------------------------
  describe('1. User Authentication & Bcrypt Password Hashing on Save', () => {
    it('should hash plain password on user save via pre-save hook', async () => {
      const plainPassword = 'SuperSecretPassword123!';
      const user = new User({
        companyId,
        firstName: 'Hashing',
        lastName: 'Tester',
        email: 'hashing@authtest.com',
        password: plainPassword,
        role: 'Employee'
      });

      await user.save();

      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(plainPassword);
      expect(user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')).toBe(true);

      // Verify comparePassword method
      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);

      const isMismatch = await user.comparePassword('WrongPassword!');
      expect(isMismatch).toBe(false);
    });

    it('should hash plain text passed directly into passwordHash field on save', async () => {
      const plainText = 'DirectPasswordValue';
      const user = new User({
        companyId,
        firstName: 'Direct',
        lastName: 'Hash',
        email: 'direct@authtest.com',
        passwordHash: plainText,
        role: 'Employee'
      });

      await user.save();

      expect(user.passwordHash).not.toBe(plainText);
      expect(user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')).toBe(true);

      const isMatch = await user.comparePassword(plainText);
      expect(isMatch).toBe(true);
    });

    it('should not re-hash an already hashed bcrypt password on save', async () => {
      const salt = await bcrypt.genSalt(10);
      const preHashed = await bcrypt.hash('PreHashedPass123', salt);

      const user = new User({
        companyId,
        firstName: 'PreHashed',
        lastName: 'Tester',
        email: 'prehashed@authtest.com',
        passwordHash: preHashed,
        role: 'Admin'
      });

      await user.save();

      expect(user.passwordHash).toBe(preHashed);
      const isMatch = await user.comparePassword('PreHashedPass123');
      expect(isMatch).toBe(true);
    });

    it('should update password and re-hash with bcrypt when password is modified', async () => {
      const user = new User({
        companyId,
        firstName: 'Update',
        lastName: 'Password',
        email: 'updatepass@authtest.com',
        password: 'InitialPassword123',
        role: 'Employee'
      });
      await user.save();
      const firstHash = user.passwordHash;

      // Update password
      user.password = 'NewUpdatedPassword456!';
      await user.save();

      expect(user.passwordHash).not.toBe(firstHash);
      expect(await user.comparePassword('NewUpdatedPassword456!')).toBe(true);
      expect(await user.comparePassword('InitialPassword123')).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Login Flow with Valid and Invalid Credentials
  // --------------------------------------------------------------------------
  describe('2. Login with Valid and Invalid Credentials', () => {
    const rawPassword = 'ValidPassword2026!';
    let activeUser: any;

    beforeEach(async () => {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(rawPassword, salt);

      activeUser = await User.create({
        companyId,
        firstName: 'Login',
        lastName: 'User',
        email: 'loginuser@authtest.com',
        passwordHash,
        role: 'Admin',
        status: 'active'
      });
    });

    it('should successfully log in with valid credentials via authService', async () => {
      const result = await authService.login('loginuser@authtest.com', rawPassword);

      expect(result).toBeDefined();
      expect(result.user.email).toBe('loginuser@authtest.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.sessionId).toBeDefined();

      // Verify session was persisted in Session model
      const sessionDoc = await Session.findOne({ sessionId: result.sessionId });
      expect(sessionDoc).not.toBeNull();
      expect(sessionDoc?.userId.toString()).toBe(activeUser._id.toString());
      expect(sessionDoc?.companyId.toString()).toBe(companyId.toString());

      // Verify lastLoginAt was updated on user
      const updatedUser = await User.findById(activeUser._id);
      expect(updatedUser?.lastLoginAt).toBeDefined();
    });

    it('should successfully log in with valid credentials via API POST /api/auth/login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@authtest.com',
          password: rawPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.sessionId).toBeDefined();
      expect(res.body.data.user.email).toBe('loginuser@authtest.com');
    });

    it('should reject login with invalid password via authService and API', async () => {
      await expect(
        authService.login('loginuser@authtest.com', 'IncorrectPassword!')
      ).rejects.toThrow('Invalid email or password');

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@authtest.com',
          password: 'IncorrectPassword!'
        });

      expect([400, 401, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      await expect(
        authService.login('nonexistent@authtest.com', rawPassword)
      ).rejects.toThrow('Invalid email or password');

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@authtest.com',
          password: rawPassword
        });

      expect([400, 401, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject login when user account is inactive or suspended', async () => {
      await User.findByIdAndUpdate(activeUser._id, { status: 'inactive' });

      await expect(
        authService.login('loginuser@authtest.com', rawPassword)
      ).rejects.toThrow('Your account is currently inactive or suspended');

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@authtest.com',
          password: rawPassword
        });

      expect([400, 401, 403, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 3. JWT Token Structure, Expiration, and Payload Parsing
  // --------------------------------------------------------------------------
  describe('3. JWT Token Structure, Expiration, and Payload Parsing', () => {
    it('should generate valid JWT access token with correct payload structure and claims', async () => {
      const payload = {
        userId: new mongoose.Types.ObjectId().toString(),
        companyId: companyId.toString(),
        role: 'Manager'
      };

      const token = authService.generateAccessToken(payload);

      // Verify token is a string with 3 base64url segments (header.payload.signature)
      const segments = token.split('.');
      expect(segments.length).toBe(3);

      // Verify token signature and decode payload
      const decoded: any = jwt.verify(token, JWT_ACCESS_SECRET);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.companyId).toBe(payload.companyId);
      expect(decoded.role).toBe('Manager');

      // Verify standard claims: iat (issued at) and exp (expiration)
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);

      // Default expiration is 15 minutes (900 seconds)
      const tokenDurationSec = decoded.exp - decoded.iat;
      expect(tokenDurationSec).toBe(900);
    });

    it('should reject expired JWT access token with TokenExpiredError', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user123', companyId: companyId.toString(), role: 'Employee' },
        JWT_ACCESS_SECRET,
        { expiresIn: '-10s' } // Expired 10 seconds ago
      );

      expect(() => {
        jwt.verify(expiredToken, JWT_ACCESS_SECRET);
      }).toThrow(jwt.TokenExpiredError);
    });

    it('should reject JWT access token signed with invalid secret key', async () => {
      const forgedToken = jwt.sign(
        { userId: 'user123', companyId: companyId.toString(), role: 'Admin' },
        'wrong_tampered_secret_key'
      );

      expect(() => {
        jwt.verify(forgedToken, JWT_ACCESS_SECRET);
      }).toThrow(jwt.JsonWebTokenError);
    });

    it('should generate and validate refresh token through SessionService', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const { sessionId, refreshToken, expiresAt } = await sessionService.createSession(
        userId,
        companyId.toString(),
        '127.0.0.1',
        'Jest-Test-Agent'
      );

      expect(sessionId).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Validate refresh token
      const session = await sessionService.validateRefreshToken(refreshToken);
      expect(session).toBeDefined();
      expect(session.sessionId).toBe(sessionId);
      expect(session.userId.toString()).toBe(userId);
      expect(session.companyId.toString()).toBe(companyId.toString());

      // Refresh token hash stored in DB is bcrypt hashed
      expect(session.refreshTokenHash.startsWith('$2a$') || session.refreshTokenHash.startsWith('$2b$')).toBe(true);
    });

    it('should reject revoked refresh token', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const { sessionId, refreshToken } = await sessionService.createSession(
        userId,
        companyId.toString()
      );

      // Revoke the session
      await sessionService.revokeSession(sessionId, userId);

      await expect(
        sessionService.validateRefreshToken(refreshToken)
      ).rejects.toThrow('Session has been revoked');
    });

    it('should reject refresh token after expiration date', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const { sessionId, refreshToken } = await sessionService.createSession(
        userId,
        companyId.toString()
      );

      // Artificially expire the session in MongoDB
      await Session.findOneAndUpdate({ sessionId }, { expiresAt: new Date(Date.now() - 1000) });

      await expect(
        sessionService.validateRefreshToken(refreshToken)
      ).rejects.toThrow('Session has expired');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Password Reset Model and Lifecycle Flow
  // --------------------------------------------------------------------------
  describe('4. Password Reset Model and Lifecycle Flow', () => {
    it('should complete full password reset flow securely', async () => {
      const initialPassword = 'InitialOldPassword123!';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(initialPassword, salt);

      const user = await User.create({
        companyId,
        firstName: 'Reset',
        lastName: 'User',
        email: 'resetuser@authtest.com',
        passwordHash,
        role: 'Admin'
      });

      // 1. Request forgot password
      const forgotRes = await authService.forgotPassword(user.email);
      expect(forgotRes.success).toBe(true);
      expect(forgotRes.resetToken).toBeDefined();

      const rawToken = forgotRes.resetToken as string;

      // Verify PasswordReset record was created in database with hashed token
      const resetRecord = await PasswordReset.findOne({ userId: user._id });
      expect(resetRecord).not.toBeNull();
      expect(resetRecord?.usedAt).toBeUndefined();
      expect(resetRecord?.tokenHash).toBeDefined();

      // 2. Execute password reset with new password
      const newPassword = 'BrandNewSecurePassword2026!';
      const resetSuccess = await authService.resetPassword(rawToken, newPassword);
      expect(resetSuccess).toBe(true);

      // 3. Verify user password was updated
      const updatedUser = await User.findById(user._id);
      expect(await updatedUser?.comparePassword(newPassword)).toBe(true);
      expect(await updatedUser?.comparePassword(initialPassword)).toBe(false);

      // 4. Verify reset token was marked as used
      const usedRecord = await PasswordReset.findOne({ userId: user._id });
      expect(usedRecord?.usedAt).toBeDefined();

      // 5. Attempting to reuse the same reset token must fail
      await expect(
        authService.resetPassword(rawToken, 'AnotherPassword999!')
      ).rejects.toThrow('Password reset token has already been used');
    });

    it('should reject password reset when token has expired', async () => {
      const user = await User.create({
        companyId,
        firstName: 'Expired',
        lastName: 'Reset',
        email: 'expiredreset@authtest.com',
        passwordHash: 'hash',
        role: 'Admin'
      });

      const forgotRes = await authService.forgotPassword(user.email);
      const rawToken = forgotRes.resetToken as string;

      // Artificially expire the reset record
      await PasswordReset.findOneAndUpdate(
        { userId: user._id },
        { expiresAt: new Date(Date.now() - 1000) }
      );

      await expect(
        authService.resetPassword(rawToken, 'NewPass123456!')
      ).rejects.toThrow('Password reset token has expired');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Email Verification Model & Token Verification
  // --------------------------------------------------------------------------
  describe('5. Email Verification Model & Lifecycle', () => {
    it('should generate verification token and verify email successfully', async () => {
      const user = await User.create({
        companyId,
        firstName: 'Verify',
        lastName: 'Me',
        email: 'verifyme@authtest.com',
        passwordHash: 'hash',
        role: 'Employee',
        isEmailVerified: false
      });

      const sendRes = await authService.sendEmailVerification(user._id.toString(), companyId.toString());
      expect(sendRes.success).toBe(true);
      expect(sendRes.verificationToken).toBeDefined();

      const rawToken = sendRes.verificationToken as string;

      // Verify EmailVerification record in DB
      const record = await EmailVerification.findOne({ userId: user._id });
      expect(record).not.toBeNull();
      expect(record?.verifiedAt).toBeUndefined();

      // Execute verification
      const verifySuccess = await authService.verifyEmail(rawToken);
      expect(verifySuccess).toBe(true);

      // Verify user document has isEmailVerified = true
      const verifiedUser = await User.findById(user._id);
      expect(verifiedUser?.isEmailVerified).toBe(true);

      // Attempting to reuse verification token should throw error
      await expect(
        authService.verifyEmail(rawToken)
      ).rejects.toThrow('Email has already been verified using this token');
    });
  });
});
