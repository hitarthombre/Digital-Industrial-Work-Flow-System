import { AuditLog, IAuditLog } from "../models/AuditLog";

export interface CreateAuditLogParams {
  companyId?: string;
  userId?: string;
  action: string;
  module: string;
  referenceId?: string;
  before?: any;
  after?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  async log(params: CreateAuditLogParams): Promise<IAuditLog> {
    try {
      return await AuditLog.create(params);
    } catch (error) {
      console.error("[AuditLog Service Error]", error);
      throw error;
    }
  }

  async getAuditLogs(
    companyId: string,
    query: {
      module?: string;
      action?: string;
      userId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(Math.max(query.limit || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filter: any = { companyId };
    if (query.module) filter.module = query.module;
    if (query.action) filter.action = query.action;
    if (query.userId) filter.userId = query.userId;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "firstName lastName email role"),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLogById(id: string, companyId: string) {
    return AuditLog.findOne({ _id: id, companyId }).populate("userId", "firstName lastName email role");
  }
}

export const auditService = new AuditService();
export default auditService;
