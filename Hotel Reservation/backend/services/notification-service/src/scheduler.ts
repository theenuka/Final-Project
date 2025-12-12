import cron from "node-cron";
import mongoose from "mongoose";
import { enqueueNotification } from "./queue";
import { resolveTemplate } from "./templates";

// Connect to the booking collection to fetch upcoming bookings
const BookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.models.Booking || mongoose.model("Booking", BookingSchema, "bookings");

const HotelSchema = new mongoose.Schema({}, { strict: false });
const Hotel = mongoose.models.Hotel || mongoose.model("Hotel", HotelSchema, "hotels");

interface BookingDoc {
  _id: string;
  userId: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  checkIn: Date;
  checkOut: Date;
  status: string;
  reminderSent?: boolean;
}

// Send check-in reminders for bookings happening tomorrow
export const sendCheckInReminders = async () => {
  try {
    console.log("[scheduler] Running check-in reminder job...");
    
    // Get tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Find confirmed bookings with check-in tomorrow that haven't received reminders
    const upcomingBookings = await Booking.find({
      status: "confirmed",
      checkIn: { $gte: tomorrow, $lt: dayAfter },
      reminderSent: { $ne: true },
    }).lean() as unknown as BookingDoc[];

    console.log(`[scheduler] Found ${upcomingBookings.length} bookings needing reminders`);

    // Get hotel details for all bookings
    const hotelIds = [...new Set(upcomingBookings.map((b) => b.hotelId))];
    const hotels = await Hotel.find({ _id: { $in: hotelIds } }).lean();
    const hotelMap = new Map(hotels.map((h: any) => [String(h._id), h]));

    for (const booking of upcomingBookings) {
      const hotel = hotelMap.get(booking.hotelId) as any;
      const hotelName = hotel?.name || "your hotel";
      const checkInTime = hotel?.policies?.checkInFrom || hotel?.policies?.checkInTime || "2:00 PM";

      const template = resolveTemplate("check_in_reminder", {
        subject: `Check-in Reminder: ${hotelName}`,
        text: `Hi ${booking.firstName}, your check-in at ${hotelName} is tomorrow! Check-in time starts at ${checkInTime}. We look forward to welcoming you.`,
        metadata: {
          bookingId: booking._id,
          hotelId: booking.hotelId,
          hotelName,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
        },
      });

      // Send email reminder
      await enqueueNotification({
        type: "check_in_reminder",
        channel: "email",
        to: booking.email,
        subject: template.subject,
        message: template.text,
        metadata: {
          bookingId: String(booking._id),
          hotelId: booking.hotelId,
          userId: booking.userId,
          link: `/my-bookings`,
        },
      });

      // Mark reminder as sent
      await Booking.findByIdAndUpdate(booking._id, { reminderSent: true });

      console.log(`[scheduler] Sent reminder for booking ${booking._id} to ${booking.email}`);
    }

    console.log(`[scheduler] Completed check-in reminder job. Sent ${upcomingBookings.length} reminders.`);
  } catch (error) {
    console.error("[scheduler] Error sending check-in reminders:", error);
  }
};

// Send checkout reminders on the day of checkout
export const sendCheckOutReminders = async () => {
  try {
    console.log("[scheduler] Running check-out reminder job...");
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find confirmed bookings with check-out today
    const checkoutBookings = await Booking.find({
      status: { $in: ["confirmed", "completed"] },
      checkOut: { $gte: today, $lt: tomorrow },
      checkoutReminderSent: { $ne: true },
    }).lean() as unknown as BookingDoc[];

    console.log(`[scheduler] Found ${checkoutBookings.length} bookings for checkout reminder`);

    // Get hotel details
    const hotelIds = [...new Set(checkoutBookings.map((b) => b.hotelId))];
    const hotels = await Hotel.find({ _id: { $in: hotelIds } }).lean();
    const hotelMap = new Map(hotels.map((h: any) => [String(h._id), h]));

    for (const booking of checkoutBookings) {
      const hotel = hotelMap.get(booking.hotelId) as any;
      const hotelName = hotel?.name || "the hotel";
      const checkOutTime = hotel?.policies?.checkOutUntil || hotel?.policies?.checkOutTime || "11:00 AM";

      const template = resolveTemplate("check_out_reminder", {
        subject: `Check-out Reminder: ${hotelName}`,
        text: `Hi ${booking.firstName}, this is a reminder that your checkout at ${hotelName} is today. Please check out by ${checkOutTime}. Thank you for staying with us!`,
        metadata: {
          bookingId: booking._id,
          hotelId: booking.hotelId,
          hotelName,
        },
      });

      await enqueueNotification({
        type: "check_out_reminder",
        channel: "email",
        to: booking.email,
        subject: template.subject,
        message: template.text,
        metadata: {
          bookingId: String(booking._id),
          hotelId: booking.hotelId,
          userId: booking.userId,
        },
      });

      // Mark reminder as sent
      await Booking.findByIdAndUpdate(booking._id, { checkoutReminderSent: true });
    }

    console.log(`[scheduler] Completed checkout reminder job.`);
  } catch (error) {
    console.error("[scheduler] Error sending checkout reminders:", error);
  }
};

// Schedule the reminder jobs
export const initializeScheduler = () => {
  // Run check-in reminders at 9:00 AM every day
  cron.schedule("0 9 * * *", () => {
    sendCheckInReminders();
  });

  // Run checkout reminders at 7:00 AM every day
  cron.schedule("0 7 * * *", () => {
    sendCheckOutReminders();
  });

  console.log("[scheduler] Notification scheduler initialized");
  console.log("[scheduler] Check-in reminders: 9:00 AM daily");
  console.log("[scheduler] Checkout reminders: 7:00 AM daily");
};

export default { initializeScheduler, sendCheckInReminders, sendCheckOutReminders };
