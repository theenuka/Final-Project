import express from "express";
import {
  login,
  logout,
  refresh,
  register,
  requestPasswordReset,
  requestVerification,
  resetPassword,
  validateToken,
  verifyEmail,
} from "../controllers/authController";
import { verifyToken } from "../middleware/auth";

const router = express.Router();

router.post(["/register", "/users/register"], register);
router.post("/login", login);
router.get("/validate-token", verifyToken, validateToken);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/request-verification", requestVerification);
router.post("/verify-email", verifyEmail);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;
