import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getMyNotifications, markNotificationRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", authMiddleware, getMyNotifications);
router.put("/:id/read", authMiddleware, markNotificationRead);

export default router;
