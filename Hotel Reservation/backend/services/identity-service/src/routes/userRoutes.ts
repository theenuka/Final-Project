import express from "express";
import {
  addLoyaltyPoints,
  getAllUsers,
  getLoyalty,
  getMe,
  getNotificationPreferences,
  internalAddLoyalty,
  updateMe,
  updateNotificationPreferences,
  updateUserRole,
} from "../controllers/userController";
import { requireRole, verifyServiceKey, verifyToken } from "../middleware/auth";

const router = express.Router();

router.get("/me", verifyToken, getMe);
router.patch("/me", verifyToken, updateMe);
router.get("/me/notifications", verifyToken, getNotificationPreferences);
router.patch("/me/notifications", verifyToken, updateNotificationPreferences);
router.get("/me/loyalty", verifyToken, getLoyalty);
router.post("/me/loyalty/add", verifyToken, addLoyaltyPoints);

// Admin routes
router.get("/admin/users", verifyToken, requireRole(["admin"]), getAllUsers);
router.patch("/admin/users/:id/role", verifyToken, requireRole(["admin"]), updateUserRole);

// Internal routes
router.post("/internal/users/:id/loyalty", verifyServiceKey, internalAddLoyalty);

export default router;
