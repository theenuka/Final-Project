import express from "express";
import { attachUser, verifyServiceKey } from "../middleware/auth";
import {
  sendNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  triggerReminders,
} from "../controllers/notificationController";

const router = express.Router();

router.post("/notify", verifyServiceKey, sendNotification);
router.get("/notifications", attachUser, getNotifications);
router.get("/notifications/unread-count", attachUser, getUnreadCount);
router.patch("/notifications/:id/read", attachUser, markAsRead);
router.patch("/notifications/read-all", attachUser, markAllAsRead);
router.post("/admin/trigger-reminders", verifyServiceKey, triggerReminders);

export default router;
