import { Router, Response, NextFunction } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { notificationService } from "../services/notification.service";
import { reminderService } from "../services/reminder.service";
import { notFound } from "../utils/httpError";

const router = Router();

router.use(authenticate as any);

// GET /api/notifications?status=unread&type=order_status&page=1
router.get("/", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.getNotifications(String(req.user!._id), req.query as any);
    res.status(200).json({
      success: true,
      data: result.items,
      unread: result.unread,
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const count = await notificationService.getUnreadCount(String(req.user!._id));
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllAsRead(String(req.user!._id));
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/reminders/run - trigger the task reminder sweep for this company now
router.post(
  "/reminders/run",
  requireRole("Company Owner", "Company Admin") as any,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await reminderService.run(String(req.companyId));
      res.status(200).json({ success: true, message: `${result.sent} reminder(s) sent`, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, String(req.user!._id));
    if (!notification) throw notFound("Notification");
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const deleted = await notificationService.deleteNotification(req.params.id, String(req.user!._id));
    if (!deleted) throw notFound("Notification");
    res.status(200).json({ success: true, message: "Notification dismissed" });
  } catch (error) {
    next(error);
  }
});

export default router;
