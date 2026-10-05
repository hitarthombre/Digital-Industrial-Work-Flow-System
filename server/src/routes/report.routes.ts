import { Router, Response, NextFunction } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { enforceTenantIsolation } from "../middleware/tenant";
import { reportService, REPORT_TYPES } from "../services/report.service";

const router = Router();

router.use(authenticate as any);
router.use(enforceTenantIsolation as any);
router.use(requirePermission("reports:read") as any);

const reportQuery = (req: AuthenticatedRequest) => ({
  startDate: req.query.startDate as string | undefined,
  endDate: req.query.endDate as string | undefined,
  warehouseId: req.query.warehouseId as string | undefined,
  status: req.query.status as string | undefined,
  category: req.query.category as string | undefined,
});

// GET /api/reports - available report types
router.get("/", (req: any, res: Response) => {
  res.status(200).json({ success: true, data: REPORT_TYPES });
});

// GET /api/reports/:type/export?format=pdf|xlsx
router.get("/:type/export", async (req: any, res: Response, next: NextFunction) => {
  try {
    const { buffer, fileName, contentType } = await reportService.export(
      String(req.companyId),
      req.params.type,
      String(req.query.format || "pdf"),
      reportQuery(req)
    );
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", buffer.length.toString());
    res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:type
router.get("/:type", async (req: any, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.generate(String(req.companyId), req.params.type, reportQuery(req));
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

export default router;
