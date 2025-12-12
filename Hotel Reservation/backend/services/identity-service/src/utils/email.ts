const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;
const NOTIFICATION_SERVICE_KEY = process.env.NOTIFICATION_SERVICE_KEY || process.env.INTERNAL_SERVICE_API_KEY;

export const sendEmail = async (payload: { to: string; subject: string; message: string; type?: string; metadata?: Record<string, unknown> }) => {
  if (NOTIFICATION_SERVICE_URL) {
    try {
      await fetch(`${NOTIFICATION_SERVICE_URL}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(NOTIFICATION_SERVICE_KEY ? { "x-service-key": NOTIFICATION_SERVICE_KEY } : {}),
        },
        body: JSON.stringify({ channel: "email", ...payload }),
      });
      return;
    } catch (err) {
      console.warn("notification-service-email-fallback", err);
    }
  }
  console.log(`[email] to=${payload.to} subject="${payload.subject}" body=${payload.message}`);
};
