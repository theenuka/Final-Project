import webpush from "web-push";

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:notifications@phoenixbooking.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log("[notification-service] Web Push configured with VAPID keys");
}

// Store push subscriptions in memory (in production, use database)
export const pushSubscriptions = new Map<string, webpush.PushSubscription>();

export const getVapidPublicKey = () => VAPID_PUBLIC_KEY;

export const sendPushNotification = async (userId: string, title: string, body: string, data?: Record<string, unknown>) => {
  const subscription = pushSubscriptions.get(userId);
  
  if (!subscription || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log(`[push:send] No subscription found for user ${userId} or VAPID not configured`);
    return false;
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title,
        body,
        icon: "/logo.png",
        badge: "/badge.png",
        data,
        timestamp: Date.now(),
      })
    );
    console.log(`[push:send] Push notification sent to user ${userId}`);
    return true;
  } catch (error: any) {
    if (error.statusCode === 410) {
      // Subscription expired or invalid
      pushSubscriptions.delete(userId);
      console.log(`[push:send] Subscription expired for user ${userId}, removed`);
    } else {
      console.error(`[push:send:error] Failed to send push to user ${userId}:`, error.message);
    }
    return false;
  }
};
