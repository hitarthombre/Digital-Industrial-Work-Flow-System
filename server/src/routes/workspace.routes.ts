import { Router, Response, NextFunction } from "express";
import z from "zod";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { enforceTenantIsolation } from "../middleware/tenant";
import { validateRequest } from "../middleware/validation";
import { dashboardService } from "../services/dashboard.service";
import { searchService } from "../services/search.service";
import { SavedFilter } from "../models/SavedFilter";
import { notFound, HttpError } from "../utils/httpError";

// Cross-module workspace endpoints: dashboard summary, global search and saved filters
const router = Router();

router.use(authenticate as any);
router.use(enforceTenantIsolation as any);

const isAdmin = (req: AuthenticatedRequest) => req.user?.role === "Company Owner" || req.user?.role === "Company Admin";

// GET /api/dashboard/summary
router.get("/dashboard/summary", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await dashboardService.getSummary(String(req.companyId)));
  } catch (error) {
    next(error);
  }
});

// GET /api/search?q=steel&limit=5&types=product,sales_order
router.get("/search", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const types = req.query.types ? String(req.query.types).split(",").filter(Boolean) : undefined;
    const result = await searchService.globalSearch(String(req.companyId), String(req.query.q || ""), {
      permissions: req.permissions || [],
      isAdmin: isAdmin(req),
      limit: Number(req.query.limit) || undefined,
      types,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// SAVED FILTERS (per user, per list)
// ==========================================

const SavedFilterSchema = z.object({
  module: z.string().min(1, "Module is required").max(60),
  name: z.string().min(1, "Filter name is required").max(60),
  filters: z.record(z.any()),
  isDefault: z.boolean().optional(),
});

router.get("/saved-filters", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const filter: any = { userId: req.user!._id, companyId: req.companyId };
    if (req.query.module) filter.module = String(req.query.module).toLowerCase();
    const filters = await SavedFilter.find(filter).sort({ isDefault: -1, name: 1 });
    res.status(200).json({ success: true, data: filters });
  } catch (error) {
    next(error);
  }
});

router.post("/saved-filters", validateRequest(SavedFilterSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const module = String(req.body.module).toLowerCase();
    if (req.body.isDefault) {
      await SavedFilter.updateMany({ userId: req.user!._id, module }, { isDefault: false });
    }
    // Saving under an existing name overwrites that preset
    const saved = await SavedFilter.findOneAndUpdate(
      { userId: req.user!._id, module, name: req.body.name.trim() },
      {
        companyId: req.companyId,
        userId: req.user!._id,
        module,
        name: req.body.name.trim(),
        filters: req.body.filters,
        isDefault: !!req.body.isDefault,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true, message: `Filter "${saved.name}" saved`, data: saved });
  } catch (error: any) {
    if (error.code === 11000) return next(new HttpError(409, "A saved filter with this name already exists"));
    next(error);
  }
});

router.delete("/saved-filters/:id", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await SavedFilter.deleteOne({ _id: req.params.id, userId: req.user!._id });
    if (result.deletedCount === 0) throw notFound("Saved filter");
    res.status(200).json({ success: true, message: "Saved filter deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
