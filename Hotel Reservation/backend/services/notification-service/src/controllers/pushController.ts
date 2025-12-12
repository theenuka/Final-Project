import { Request, Response } from "express";
import webpush from "web-push";
import { AuthedRequest } from "../middleware/auth";
import { getVapidPublicKey, pushSubscriptions, sendPushNotification } from "../utils/push";

const MONGO_URI = process.env.MONGODB_CONNECTION_STRING as string;

export const getPublicKey = (_req: Request, res: Response) => {
  res.json({ publicKey: getVapidPublicKey() });
};

export const subscribe = async (req: AuthedRequest, res: Response) => {
  const { subscription } = req.body || {};
  
  if (!subscription || !req.userId) {
    return res.status(400).json({ message: "Subscription data required" });
  }

  // Store the subscription
  pushSubscriptions.set(req.userId, subscription as webpush.PushSubscription);
  
  // Optionally store in database for persistence
  if (MONGO_URI) {
    try {
      // You could create a PushSubscription model to persist this
      console.log(`[push:subscribe] User ${req.userId} subscribed to push notifications`);
    } catch (err) {
      console.warn("[push:subscribe:db:error]", err);
    }
  }

  res.json({ success: true, message: "Successfully subscribed to push notifications" });
};

export const unsubscribe = async (req: AuthedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(400).json({ message: "User ID required" });
  }

  pushSubscriptions.delete(req.userId);
  res.json({ success: true, message: "Successfully unsubscribed from push notifications" });
};

export const testPush = async (req: AuthedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(400).json({ message: "User ID required" });
  }

  const success = await sendPushNotification(
    req.userId,
    "Test Notification",
    "This is a test push notification from Phoenix Booking!",
    { type: "test", timestamp: Date.now() }
  );

  if (success) {
    res.json({ success: true, message: "Test notification sent" });
  } else {
    res.status(400).json({ message: "Failed to send test notification. Make sure you're subscribed." });
  }
};
