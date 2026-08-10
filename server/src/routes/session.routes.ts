import { Router } from "express";
import { sessionController } from "../controllers/session.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate as any);

router.get("/", (req: any, res: any, next: any) => sessionController.getActiveSessions(req, res, next));
router.delete("/:id", (req: any, res: any, next: any) => sessionController.revokeSession(req, res, next));
router.delete("/", (req: any, res: any, next: any) => sessionController.revokeAllSessions(req, res, next));

export default router;
