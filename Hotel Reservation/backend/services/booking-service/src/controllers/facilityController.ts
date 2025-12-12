import { Request, Response } from "express";
import FacilityBooking from "../models/facilityBooking";
import { awardLoyaltyPoints } from "../utils/loyalty";
import { sendNotification } from "../utils/notification";

const hasFacilityOverlap = async (
  hotelId: string,
  facilityName: string,
  bookingDate: Date,
  startTime: string,
  endTime: string,
  excludeId?: string
) => {
  const dayStart = new Date(bookingDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const query: Record<string, unknown> = {
    hotelId,
    facilityName,
    bookingDate: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ["pending", "confirmed"] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  return FacilityBooking.exists(query);
};

export const getFacilityAvailability = async (req: Request, res: Response) => {
  const { hotelId, facilityName } = req.params;
  const { date } = req.query;
  
  if (!date) return res.status(400).json({ message: "Date is required" });
  
  const bookingDate = new Date(date as string);
  const dayStart = new Date(bookingDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const existingBookings = await FacilityBooking.find({
    hotelId,
    facilityName,
    bookingDate: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ["pending", "confirmed"] },
  }).select("startTime endTime guestCount").lean();

  res.json({
    date: date,
    facilityName,
    bookedSlots: existingBookings.map(b => ({
      startTime: b.startTime,
      endTime: b.endTime,
      guestCount: b.guestCount,
    })),
  });
};

export const bookFacility = async (req: Request & { userId?: string }, res: Response) => {
  const hotelId = req.params.hotelId;
  const {
    facilityName,
    facilityType,
    firstName,
    lastName,
    email,
    phone,
    guestCount,
    bookingDate,
    startTime,
    endTime,
    duration,
    totalCost,
    specialRequests,
  } = req.body || {};

  if (!facilityName || !facilityType || !firstName || !lastName || !email || !bookingDate || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const bd = new Date(bookingDate);
  if (isNaN(bd.getTime())) {
    return res.status(400).json({ message: "Invalid booking date" });
  }

  const hasConflict = await hasFacilityOverlap(hotelId, facilityName, bd, startTime, endTime);
  if (hasConflict) {
    return res.status(409).json({
      message: "This time slot is already booked",
      reason: "slot_unavailable",
    });
  }

  const newFacilityBooking = await new FacilityBooking({
    userId: req.userId,
    hotelId,
    facilityName,
    facilityType,
    firstName,
    lastName,
    email,
    phone,
    guestCount: guestCount || 1,
    bookingDate: bd,
    startTime,
    endTime,
    duration: duration || 1,
    totalCost: totalCost || 0,
    specialRequests,
    status: "confirmed",
    paymentStatus: "paid",
  }).save();

  await awardLoyaltyPoints(req.userId, totalCost || 0, String(newFacilityBooking._id));

  await sendNotification({
    type: "facility_booking_confirmation",
    to: email,
    subject: `${facilityName} Booking Confirmation`,
    message: `Hi ${firstName}, your ${facilityName} booking is confirmed for ${bd.toDateString()} from ${startTime} to ${endTime}.`,
    metadata: {
      bookingId: newFacilityBooking._id,
      hotelId,
      facilityName,
      facilityType,
      bookingDate: bd.toISOString(),
      startTime,
      endTime,
      totalCost,
    },
  });

  res.status(201).json({ bookingId: newFacilityBooking._id, booking: newFacilityBooking });
};

export const getMyFacilityBookings = async (req: Request & { userId?: string }, res: Response) => {
  const filter = req.userId ? { userId: req.userId } : {};
  const bookings = await FacilityBooking.find(filter).sort({ bookingDate: -1, startTime: 1 }).lean();
  res.json(bookings);
};

export const getHotelFacilityBookings = async (req: Request, res: Response) => {
  const { facilityName, status, date } = req.query;
  const filter: Record<string, unknown> = { hotelId: req.params.hotelId };
  
  if (facilityName) filter.facilityName = facilityName;
  if (status) filter.status = status;
  if (date) {
    const d = new Date(date as string);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    filter.bookingDate = { $gte: dayStart, $lt: dayEnd };
  }

  const bookings = await FacilityBooking.find(filter).sort({ bookingDate: -1, startTime: 1 });
  res.json(bookings);
};

export const cancelFacilityBooking = async (req: Request & { userId?: string }, res: Response) => {
  const { bookingId } = req.params;
  const booking = await FacilityBooking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: "Facility booking not found" });

  booking.status = "cancelled";
  booking.paymentStatus = booking.paymentStatus === "paid" ? "refunded" : booking.paymentStatus;
  booking.cancellationReason = req.body?.reason || "User cancelled";
  await booking.save();

  await sendNotification({
    type: "facility_booking_cancelled",
    to: booking.email,
    subject: `${booking.facilityName} Booking Cancelled`,
    message: `Your ${booking.facilityName} booking for ${booking.bookingDate.toDateString()} has been cancelled.`,
    metadata: {
      bookingId: booking._id,
      hotelId: booking.hotelId,
      facilityName: booking.facilityName,
      bookingDate: booking.bookingDate?.toISOString?.() || booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
    },
  });

  res.json({ success: true });
};

export const updateFacilityBooking = async (req: Request & { userId?: string }, res: Response) => {
  const { bookingId } = req.params;
  const booking = await FacilityBooking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: "Facility booking not found" });

  const { bookingDate, startTime, endTime, guestCount, specialRequests, status } = req.body || {};

  if (bookingDate || startTime || endTime) {
    const bd = bookingDate ? new Date(bookingDate) : booking.bookingDate;
    const st = startTime || booking.startTime;
    const et = endTime || booking.endTime;

    const hasConflict = await hasFacilityOverlap(booking.hotelId, booking.facilityName, bd, st, et, bookingId);
    if (hasConflict) {
      return res.status(409).json({
        message: "This time slot is already booked",
        reason: "slot_unavailable",
      });
    }

    if (bookingDate) booking.bookingDate = bd;
    if (startTime) booking.startTime = st;
    if (endTime) booking.endTime = et;
  }

  if (guestCount !== undefined) booking.guestCount = guestCount;
  if (specialRequests !== undefined) booking.specialRequests = specialRequests;
  if (status) booking.status = status;

  await booking.save();

  await sendNotification({
    type: "facility_booking_updated",
    to: booking.email,
    subject: `${booking.facilityName} Booking Updated`,
    message: `Your ${booking.facilityName} booking has been updated.`,
    metadata: {
      bookingId: booking._id,
      hotelId: booking.hotelId,
      facilityName: booking.facilityName,
      bookingDate: booking.bookingDate?.toISOString?.() || booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
    },
  });

  res.json(booking);
};
