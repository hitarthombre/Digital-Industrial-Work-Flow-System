import { Response, NextFunction } from "express";
import { sessionService } from "../services/session.service";
import { AuthenticatedRequest } from "../middleware/auth";

export class SessionController {
  async getActiveSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await sessionService.getActiveSessions(req.user!._id.toString(), req.companyId!);

      res.status(200).json({
        success: true,
        message: "Active sessions retrieved successfully",
        data: sessions.map((s) => ({
          sessionId: s.sessionId,
          ipAddress: s.ipAddress,
          userAgent: s.userAgent,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.params.id;
      const success = await sessionService.revokeSession(sessionId, req.user!._id.toString());

      if (!success) {
        res.status(404).json({
          success: false,
          message: "Session not found or already revoked",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Session revoked successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeAllSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await sessionService.revokeAllUserSessions(req.user!._id.toString());

      res.status(200).json({
        success: true,
        message: `Revoked ${count} active sessions successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const sessionController = new SessionController();
export default sessionController;
