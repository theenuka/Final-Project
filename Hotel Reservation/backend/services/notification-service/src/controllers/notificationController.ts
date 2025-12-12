import { Request, Response } from "express";
import { enqueueNotification } from "../queue";
import { resolveTemplate } from "../templates";
import { NotificationChannel, NotificationJobPayload, NotificationRequestPayload } from "../types";
import Notification from "../models/notification";
import { AuthedRequest } from "../middleware/auth";

const allowedChannels: NotificationChannel[] = ["email", "sms", "push"];
const MONGO_URI = process.env.MONGODB_CONNECTION_STRING as string;

// Helper to map notification type to category
const mapNotificationType = (type?: string): "booking" | "reminder" | "promotion" | "system" => {
  if (!type) return "system";
  if (type.includes("booking") || type.includes("waitlist")) return "booking";
  if (type.includes("reminder")) return "reminder";
  if (type.includes("promo") || type.includes("offer")) return "promotion";
  return "system";
};

export const sendNotification = async (req: Request, res: Response) => {
  const { channel = "email", type, to, subject, message, metadata, html } = (req.body || {}) as NotificationRequestPayload;
  if (!to) {
    return res.status(400).json({ message: "'to' is required" });
  }
  if (!allowedChannels.includes(channel || "email")) {
    return res.status(400).json({ message: `channel '${channel}' not supported` });
  }

  const template = resolveTemplate(type, { subject, text: message, message, html, metadata });
  if (!template.text) {
    return res.status(400).json({ message: "Message body is required" });
  }

  const payload: NotificationJobPayload = {
    type,
    channel: channel || "email",
    to,
    subject: template.subject,
    message: template.text,
    html: template.html,
    metadata,
  };

  try {
    const result = await enqueueNotification(payload);
    console.log("[notification:queued]", { type, channel: payload.channel, to, queued: result.queued });
    
    // Also store notification in database if userId provided in metadata
    const userId = metadata?.userId as string | undefined;
    if (userId && MONGO_URI) {
      try {
        await Notification.create({
          userId,
          type: mapNotificationType(type),
          title: template.subject || type || "Notification",
          message: template.text,
          link: metadata?.link as string | undefined,
          metadata,
        });
      } catch (dbErr) {
        console.warn("[notification:db:error]", dbErr);
      }
    }
    
    return res.status(202).json({ accepted: true, channel: payload.channel, queued: result.queued });
  } catch (err: any) {
    console.error("[notification:enqueue:error]", err);
    return res.status(502).json({ message: "Failed to queue notification" });
  }
};

export const getNotifications = async (req: AuthedRequest, res: Response) => {
  if (!MONGO_URI) return res.json([]);
  const notifications = await Notification.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json(notifications);
};

export const getUnreadCount = async (req: AuthedRequest, res: Response) => {
  if (!MONGO_URI) return res.json({ count: 0 });
  const count = await Notification.countDocuments({ userId: req.userId, read: false });
  res.json({ count });
};

export const markAsRead = async (req: AuthedRequest, res: Response) => {
  if (!MONGO_URI) return res.json({ success: true });
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { read: true }
  );
  res.json({ success: true });
};

export const markAllAsRead = async (req: AuthedRequest, res: Response) => {
  if (!MONGO_URI) return res.json({ success: true });
  await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
  res.json({ success: true });
};

export const triggerReminders = async (req: Request, res: Response) => {
  const { sendCheckInReminders, sendCheckOutReminders } = await import("../scheduler");
  const { type } = req.body || {};
  
  try {
    if (type === "checkin" || !type) {
      await sendCheckInReminders();
    }
    if (type === "checkout" || !type) {
      await sendCheckOutReminders();
    }
    res.json({ success: true, message: `Triggered ${type || "all"} reminders` });
  } catch (error) {
    console.error("[admin:trigger-reminders]", error);
    res.status(500).json({ message: "Failed to trigger reminders" });
  }
};
