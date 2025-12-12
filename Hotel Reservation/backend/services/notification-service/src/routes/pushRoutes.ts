import express from "express";
import { attachUser } from "../middleware/auth";
import {
  getPublicKey,
  subscribe,
  unsubscribe,
  testPush,
} from "../controllers/pushController";

const router = express.Router();

router.get("/push/vapid-public-key", getPublicKey);
router.post("/push/subscribe", attachUser, subscribe);
router.post("/push/unsubscribe", attachUser, unsubscribe);
router.post("/push/test", attachUser, testPush);

export default router;
