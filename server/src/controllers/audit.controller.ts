import { Response, NextFunction } from "express";
import { auditService } from "../services/audit.service";
import { AuthenticatedRequest } from "../middleware/auth";

export class AuditController {
  async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const module = req.query.module as string;
      const action = req.query.action as string;
      const userId = req.query.userId as string;

      const result = await auditService.getAuditLogs(req.companyId!, { page, limit, module, action, userId });

      res.status(200).json({
        success: true,
        message: "Audit logs retrieved successfully",
        data: result.logs,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getLogById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await auditService.getLogById(req.params.id, req.companyId!);
      if (!log) {
        res.status(404).json({
          success: false,
          message: "Audit log entry not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Audit log entry retrieved successfully",
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
export default auditController;
