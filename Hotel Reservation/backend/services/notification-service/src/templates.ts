import { notificationConfig } from "./config";
import { TemplateContext, TemplateResult } from "./types";

const humanDate = (value?: string | Date) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const builders: Record<string, (context: TemplateContext) => TemplateResult> = {
  booking_confirmation: ({ metadata }) => {
    const checkIn = humanDate(metadata?.checkIn as string);
    const checkOut = humanDate(metadata?.checkOut as string);
    const hotelName = metadata?.hotelName || "your hotel";
    return {
      subject: `Your booking at ${hotelName} is confirmed` ,
      text: `Hi ${metadata?.firstName || "there"}, your stay at ${hotelName} is confirmed from ${checkIn} to ${checkOut}. Reservation ID: ${metadata?.bookingId}.`,
    };
  },
  booking_updated: ({ metadata }) => {
    const checkIn = humanDate(metadata?.checkIn as string);
    const checkOut = humanDate(metadata?.checkOut as string);
    return {
      subject: "Booking updated",
      text: `Your booking ${metadata?.bookingId || ""} has been updated. New dates: ${checkIn} - ${checkOut}.`,
    };
  },
  booking_cancelled: ({ metadata }) => ({
    subject: "Booking cancelled",
    text: `Booking ${metadata?.bookingId || ""} has been cancelled. If this was unexpected please contact ${notificationConfig.brand.supportEmail}.`,
  }),
  waitlist_joined: ({ metadata }) => ({
    subject: "You're on the waitlist",
    text: `We've added you to the waitlist for ${metadata?.hotelName || "the property"}. We'll notify you if ${humanDate(metadata?.checkIn as string)} - ${humanDate(metadata?.checkOut as string)} open up.`,
  }),
  waitlist_available: ({ metadata }) => ({
    subject: "Dates are now available",
    text: `Good news! Your requested dates ${humanDate(metadata?.checkIn as string)} - ${humanDate(metadata?.checkOut as string)} are now available.`,
  }),
  password_reset: ({ metadata }) => ({
    subject: "Reset your password",
    text: `Use code ${metadata?.code || metadata?.token} to reset your password. This code expires in 10 minutes.`,
  }),
};

export const resolveTemplate = (type: string | undefined, context: TemplateContext): TemplateResult => {
  if (!type || !builders[type]) {
    return {
      subject: context.subject || "Phoenix Booking Notification",
      text: context.text || context.message || "",
      html: context.html,
    };
  }
  const built = builders[type](context);
  return {
    subject: context.subject || built.subject,
    text: context.text || built.text,
    html: context.html || built.html,
  };
};
