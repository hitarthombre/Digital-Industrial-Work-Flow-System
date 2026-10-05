import { Model } from "mongoose";

/**
 * Generates a readable, company-scoped document number, e.g. WO-2026-0007.
 * Records are soft-deleted, so the per-company count is monotonic.
 */
export const generateDocNumber = async (
  model: Model<any>,
  companyId: string,
  prefix: string
): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await model.countDocuments({ companyId });
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
};

export const round2 = (value: number): number => Number((Number(value) || 0).toFixed(2));

export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const paginate = (query: { page?: any; limit?: any }) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 200);
  return { page, limit, skip: (page - 1) * limit };
};

export const buildDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return undefined;
  const range: Record<string, Date> = {};
  if (startDate) range.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return range;
};
