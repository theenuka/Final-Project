import axios from "axios";
import Booking from "../models/booking";
import Maintenance from "../models/maintenance";
import Waitlist from "../models/waitlist";
import { sendNotification } from "./notification";

export const hasOverlap = async (hotelId: string, roomTypeId: string, checkIn: Date, checkOut: Date, excludeBookingId?: string) => {
  const query: Record<string, unknown> = {
    hotelId,
    "rooms.roomType": roomTypeId,
    status: { $in: ["pending", "confirmed"] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  const bookings = await Booking.find(query);
  return bookings.reduce((total, booking) => total + (booking.roomCount || 1), 0);
};

export const hasMaintenanceConflict = async (hotelId: string, checkIn: Date, checkOut: Date) => {
  return Maintenance.exists({ hotelId, startDate: { $lt: checkOut }, endDate: { $gt: checkIn } });
};

export const ensureAvailability = async (
  hotelId: string,
  roomTypeId: string,
  numberOfRooms: number,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
) => {
  const hotelServiceUrl = process.env.HOTEL_SERVICE_URL || "http://hotel-service:7103";
  const response = await axios.get(
    `${hotelServiceUrl}/api/hotels/${hotelId}/room-types/${roomTypeId}/count`
  );
  const totalRooms = response.data.count;

  const [overlappingBookings, maintenanceConflict] = await Promise.all([
    hasOverlap(hotelId, roomTypeId, checkIn, checkOut, excludeBookingId),
    hasMaintenanceConflict(hotelId, checkIn, checkOut),
  ]);

  const availableRooms = totalRooms - overlappingBookings;
  const bookingConflict = availableRooms < numberOfRooms;

  return { bookingConflict, maintenanceConflict: !!maintenanceConflict };
};

export const createOrUpdateWaitlistEntry = async (
  hotelId: string,
  payload: { email: string; firstName?: string; lastName?: string; checkIn: Date; checkOut: Date }
) => {
  return Waitlist.findOneAndUpdate(
    {
      hotelId,
      email: payload.email,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
    },
    { $setOnInsert: { ...payload, status: "waiting" } },
    { upsert: true, new: true }
  );
};

export const notifyWaitlistAvailability = async (hotelId: string, checkIn: Date, checkOut: Date) => {
  const watchers = await Waitlist.find({
    hotelId,
    status: "waiting",
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  })
    .sort({ createdAt: 1 })
    .limit(10);

  await Promise.all(
    watchers.map(async (entry) => {
      await sendNotification({
        type: "waitlist_available",
        to: entry.email,
        subject: "Availability opened up",
        message: `Good news! ${entry.checkIn.toDateString()} - ${entry.checkOut.toDateString()} is available again.`,
        metadata: {
          hotelId,
          waitlistId: entry._id,
          checkIn: entry.checkIn?.toISOString?.() || entry.checkIn,
          checkOut: entry.checkOut?.toISOString?.() || entry.checkOut,
        },
      });
      entry.status = "notified";
      entry.notifiedAt = new Date();
      await entry.save();
    })
  );
};
