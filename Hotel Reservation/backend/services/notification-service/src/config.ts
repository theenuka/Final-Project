import "dotenv/config";

const parseList = (value?: string | string[]) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

const parseBool = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback;
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
};

export const notificationConfig = {
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  queueName: process.env.NOTIFICATION_QUEUE_NAME || "notification-jobs",
  queueMode: (process.env.NOTIFICATION_QUEUE_MODE || "queue").toLowerCase() as "queue" | "inline" | "off",
  serviceKey: process.env.NOTIFICATION_SERVICE_KEY || process.env.INTERNAL_SERVICE_API_KEY,
  disableAuth: parseBool(process.env.NOTIFICATION_DISABLE_AUTH, false),
  allowedOrigins: parseList(process.env.NOTIFICATION_ALLOWED_ORIGINS),
  sendgridKey: process.env.SENDGRID_API_KEY,
  brand: {
    name: process.env.NOTIFICATION_BRAND_NAME || "Phoenix Booking",
    supportEmail: process.env.NOTIFICATION_SUPPORT_EMAIL || "support@phoenix-booking.local",
    color: process.env.NOTIFICATION_BRAND_COLOR || "#ea580c",
  },
  email: {
    fromEmail: process.env.NOTIFICATION_FROM_EMAIL || "no-reply@phoenix-booking.local",
    fromName: process.env.NOTIFICATION_FROM_NAME || "Phoenix Booking",
    fallbackToConsole: parseBool(process.env.NOTIFICATION_EMAIL_FALLBACK_CONSOLE, true),
  },
  sms: {
    twilioSid: process.env.TWILIO_ACCOUNT_SID,
    twilioToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    fallbackToConsole: parseBool(process.env.NOTIFICATION_SMS_FALLBACK_CONSOLE, true),
  },
};
