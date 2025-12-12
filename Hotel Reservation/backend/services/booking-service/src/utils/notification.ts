import "dotenv/config";

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:7101";
const NOTIFICATION_SERVICE_KEY = process.env.NOTIFICATION_SERVICE_KEY || process.env.INTERNAL_SERVICE_API_KEY;

export const sendNotification = async (payload: {
  type: string;
  to?: string;
  subject?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  channel?: string;
}) => {
  if (!payload?.to) return;
  try {
    await fetch(`${NOTIFICATION_SERVICE_URL}/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(NOTIFICATION_SERVICE_KEY ? { "x-service-key": NOTIFICATION_SERVICE_KEY } : {}),
      },
      body: JSON.stringify({ channel: payload.channel || "email", ...payload }),
    });
  } catch (err) {
    console.warn("Notification failed", err);
  }
};
