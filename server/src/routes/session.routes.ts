import { Router } from "express";
import { sessionController } from "../controllers/session.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate as any);

router.get("/", (req: any, res, next) => sessionController.getActiveSessions(req, res, next));
router.delete("/:id", (req: any, res, next) => sessionController.revokeSession(req, res, next));
router.delete("/", (req: any, res, next) => sessionController.revokeAllSessions(req, res, next));

export default router;
