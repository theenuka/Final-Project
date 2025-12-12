import "dotenv/config";

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || "http://localhost:7102";
const INTERNAL_SERVICE_API_KEY = process.env.INTERNAL_SERVICE_API_KEY;
const LOYALTY_POINTS_PER_CURRENCY = Number(process.env.LOYALTY_POINTS_PER_CURRENCY || "0.1");

export const awardLoyaltyPoints = async (userId: string | undefined, totalCost: number, bookingId: string) => {
  if (!userId || !INTERNAL_SERVICE_API_KEY || !IDENTITY_SERVICE_URL) return;
  const multiplier = Number.isFinite(LOYALTY_POINTS_PER_CURRENCY) ? LOYALTY_POINTS_PER_CURRENCY : 0.1;
  const points = Math.max(1, Math.round(totalCost * multiplier));
  try {
    await fetch(`${IDENTITY_SERVICE_URL}/internal/users/${userId}/loyalty`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-key": INTERNAL_SERVICE_API_KEY,
      },
      body: JSON.stringify({
        points,
        reason: "completed_booking",
        metadata: { bookingId, totalCost },
      }),
    });
  } catch (err) {
    console.warn("award loyalty failed", err);
  }
};
