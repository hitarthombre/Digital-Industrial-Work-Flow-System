import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Session, ISession } from "../models/Session";

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "diws_refresh_token_secret_key_2026_industrial_workflow";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export interface SessionPayload {
  sessionId: string;
  userId: string;
  companyId: string;
}

export class SessionService {
  async createSession(
    userId: string,
    companyId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ sessionId: string; refreshToken: string; expiresAt: Date }> {
    const sessionId = crypto.randomUUID();
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { sessionId, userId, companyId },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN as any }
    );

    // Calculate expiration date (7 days default)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Hash refresh token before saving in DB
    const salt = await bcrypt.genSalt(10);
    const refreshTokenHash = await bcrypt.hash(refreshToken, salt);

    await Session.create({
      sessionId,
      userId,
      companyId,
      refreshTokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return { sessionId, refreshToken, expiresAt };
  }

  async validateRefreshToken(refreshToken: string): Promise<ISession> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as SessionPayload;
      
      const session = await Session.findOne({ sessionId: decoded.sessionId });
      if (!session) {
        throw new Error("Session not found");
      }

      if (session.revokedAt) {
        throw new Error("Session has been revoked");
      }

      if (new Date() > session.expiresAt) {
        throw new Error("Session has expired");
      }

      const isValidToken = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (!isValidToken) {
        throw new Error("Invalid refresh token");
      }

      return session;
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate session token");
    }
  }

  async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    const session = await Session.findOne({ sessionId, userId });
    if (!session) return false;

    session.revokedAt = new Date();
    await session.save();
    return true;
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await Session.updateMany(
      { userId, revokedAt: null },
      { revokedAt: new Date() }
    );
    return result.modifiedCount;
  }

  async getActiveSessions(userId: string, companyId: string): Promise<ISession[]> {
    return Session.find({
      userId,
      companyId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
  }
}

export const sessionService = new SessionService();
export default sessionService;
