import axios from "axios";
import { Request, Response } from "express";
import Stripe from "stripe";
import Booking from "../models/booking";
import Waitlist from "../models/waitlist";
import mongoosePkg from "mongoose";
import { ensureAvailability, createOrUpdateWaitlistEntry, notifyWaitlistAvailability } from "../utils/availability";
import { awardLoyaltyPoints } from "../utils/loyalty";
import { sendNotification } from "../utils/notification";


const HotelModel =
  mongoosePkg.models.Hotel ||
  mongoosePkg.model("Hotel", new mongoosePkg.Schema({}, { strict: false }), "hotels");

const STRIPE_KEY = process.env.STRIPE_API_KEY;
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY) : undefined;



export const createPaymentIntent = async (req: Request, res: Response) => {
  const { numberOfNights, roomCount = 1, roomTypeId } = req.body;

  if (!roomTypeId) {
    return res.status(400).json({ message: "roomTypeId is required" });
  }

  const hotelServiceUrl = process.env.HOTEL_SERVICE_URL || "http://hotel-service:7103";
  const response = await axios.get(
    `${hotelServiceUrl}/api/hotels/${req.params.hotelId}/room-types/${roomTypeId}`
  );
  const roomType = response.data;
  const pricePerNight = roomType.pricePerNight;

  const totalCost = pricePerNight * Number(numberOfNights || 1) * Number(roomCount);

  if (!stripe) {
    return res.json({ paymentIntentId: "mock_intent", clientSecret: "mock_secret", totalCost });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCost * 100,
    currency: "gbp",
    metadata: { hotelId: req.params.hotelId, roomCount: String(roomCount), roomTypeId },
  });

  res.json({ paymentIntentId: paymentIntent.id, clientSecret: paymentIntent.client_secret, totalCost });
};

export const createBooking = async (req: Request & { userId?: string }, res: Response) => {
  const hotelId = req.params.hotelId;
  const { checkIn, checkOut, totalCost, autoWaitlist, rooms } = req.body || {};
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  if (!checkIn || !checkOut || isNaN(ci.getTime()) || isNaN(co.getTime()) || ci >= co) {
    return res.status(400).json({ message: "Invalid check-in/check-out" });
  }

  if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
    return res.status(400).json({ message: "At least one room must be selected" });
  }

  for (const room of rooms) {
    const { roomTypeId, numberOfRooms } = room;
    const availability = await ensureAvailability(hotelId, roomTypeId, numberOfRooms, ci, co);
    if (availability.bookingConflict || availability.maintenanceConflict) {
      let waitlistEntry;
      const wantsAutoWaitlist =
        typeof autoWaitlist === "string" ? autoWaitlist.toLowerCase() === "true" : Boolean(autoWaitlist);
      if (wantsAutoWaitlist && req.body.email) {
        waitlistEntry = (
          await createOrUpdateWaitlistEntry(hotelId, {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            checkIn: ci,
            checkOut: co,
          })
        )?.toObject();
      }
      return res.status(409).json({
        message: availability.maintenanceConflict
          ? "Hotel is under maintenance"
          : `Room type ${roomTypeId} is not available for the selected dates`,
        reason: availability.maintenanceConflict ? "maintenance" : "booked_out",
        waitlistEntry,
      });
    }
  }

  const total = Number(totalCost ?? req.body.totalCost ?? 0);
  const newBooking = {
    ...req.body,
    userId: req.userId,
    hotelId,
    createdAt: new Date(),
    status: "confirmed",
    paymentStatus: "paid",
    totalCost: total,
  };
  const booking = await new Booking(newBooking).save();

  if (req.body.waitlistId) {
    await Waitlist.findByIdAndUpdate(req.body.waitlistId, {
      status: "converted",
      convertedBookingId: booking._id,
      notifiedAt: new Date(),
    });
  }

  await awardLoyaltyPoints(req.userId, total || booking.totalCost, booking._id);

  await sendNotification({
    type: "booking_confirmation",
    to: newBooking.email,
    subject: "Booking Confirmation",
    message: `Hi ${newBooking.firstName}, your booking is confirmed.`,
    metadata: {
      bookingId: booking._id,
      hotelId: newBooking.hotelId,
      checkIn: booking.checkIn?.toISOString?.() || booking.checkIn,
      checkOut: booking.checkOut?.toISOString?.() || booking.checkOut,
      totalCost: booking.totalCost,
    },
  });

  res.status(201).json({ bookingId: booking._id, booking });
};

export const updateBooking = async (req: Request & { userId?: string }, res: Response) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: "not found" });
  const previousStatus = booking.status;
  const { checkIn, checkOut, rooms } = req.body || {};
  if (checkIn || checkOut) {
    const ci = new Date(checkIn ?? booking.checkIn);
    const co = new Date(checkOut ?? booking.checkOut);
    if (isNaN(ci.getTime()) || isNaN(co.getTime()) || ci >= co) {
      return res.status(400).json({ message: "Invalid check-in/check-out" });
    }

    if (rooms && Array.isArray(rooms) && rooms.length > 0) {
      for (const room of rooms) {
        const { roomTypeId, numberOfRooms } = room;
        const availability = await ensureAvailability(
          booking.hotelId,
          roomTypeId,
          numberOfRooms,
          ci,
          co,
          bookingId
        );
        if (availability.bookingConflict || availability.maintenanceConflict) {
          return res.status(409).json({
            message: availability.maintenanceConflict
              ? "Hotel is under maintenance"
              : `Room type ${roomTypeId} is not available for the selected dates`,
            reason: availability.maintenanceConflict ? "maintenance" : "booked_out",
          });
        }
      }
    }
    booking.checkIn = ci;
    booking.checkOut = co;
  }
  if (typeof req.body?.status === 'string') booking.status = req.body.status;
  await booking.save();
  await sendNotification({
    type: "booking_updated",
    to: booking.email,
    subject: "Booking Updated",
    message: `Your booking has been updated. New dates: ${booking.checkIn.toDateString()} - ${booking.checkOut.toDateString()}`,
    metadata: {
      bookingId: booking._id,
      hotelId: booking.hotelId,
      checkIn: booking.checkIn?.toISOString?.() || booking.checkIn,
      checkOut: booking.checkOut?.toISOString?.() || booking.checkOut,
      status: booking.status,
    },
  });
  if (previousStatus !== "cancelled" && booking.status === "cancelled") {
    await notifyWaitlistAvailability(booking.hotelId, booking.checkIn, booking.checkOut);
  }
  res.json(booking);
};

export const getMyBookings = async (req: Request & { userId?: string }, res: Response) => {
  const filter = req.userId ? { userId: req.userId } : {};
  const bookings = await Booking.find(filter).sort({ createdAt: -1 }).lean();
  const hotelIds = Array.from(new Set(bookings.map((b: any) => b.hotelId))).filter(Boolean);
  if (hotelIds.length === 0) return res.json([]);

  const hotels = await HotelModel.find({ _id: { $in: hotelIds.map((id: string) => new mongoosePkg.Types.ObjectId(id)) } }).lean();
  const hotelsById = new Map(hotels.map((h: any) => [String(h._id), h]));

  const result = hotelIds
    .map((hid) => {
      const h = hotelsById.get(hid);
      if (!h) return null;
      const hb = bookings.filter((b: any) => String(b.hotelId) === hid);
      return { ...h, bookings: hb };
    })
    .filter(Boolean);

  res.json(result);
};

export const getAllBookings = async (req: Request & { userId?: string; roles?: string[] }, res: Response) => {
  const allowedRoles = ["staff", "admin", "hotel_owner"];
  const hasPermission = req.roles?.some(role => allowedRoles.includes(role));
  
  if (!hasPermission) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const { status, hotelId, startDate, endDate, limit = 100 } = req.query;
  const filter: Record<string, unknown> = {};
  
  if (status) filter.status = status;
  if (hotelId) filter.hotelId = hotelId;
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);
    filter.checkIn = dateFilter;
  }

  const bookings = await Booking.find(filter)
    .sort({ checkIn: -1 })
    .limit(Number(limit))
    .lean();

  res.json(bookings);
};

export const getHotelBookings = async (req: Request, res: Response) => {
  const bookings = await Booking.find({ hotelId: req.params.hotelId }).sort({ createdAt: -1 });
  res.json(bookings);
};

export const cancelBooking = async (req: Request & { userId?: string }, res: Response) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: "not found" });
  // In a full app, verify req.userId is booking.userId or hotel owner; omitted for brevity
  booking.status = "cancelled";
  booking.paymentStatus = booking.paymentStatus === "paid" ? "refunded" : booking.paymentStatus;
  await booking.save();
  await sendNotification({
    type: "booking_cancelled",
    to: booking.email,
    subject: "Booking Cancelled",
    message: "Your booking has been cancelled.",
    metadata: {
      bookingId: booking._id,
      hotelId: booking.hotelId,
      checkIn: booking.checkIn?.toISOString?.() || booking.checkIn,
      checkOut: booking.checkOut?.toISOString?.() || booking.checkOut,
      status: booking.status,
    },
  });
  await notifyWaitlistAvailability(booking.hotelId, booking.checkIn, booking.checkOut);
  res.json({ success: true });
};

export const joinWaitlist = async (req: Request & { userId?: string }, res: Response) => {
  const { email, firstName, lastName, checkIn, checkOut } = req.body || {};
  if (!email || !checkIn || !checkOut) return res.status(400).json({ message: "Missing fields" });
  const ci = new Date(checkIn); const co = new Date(checkOut);
  if (isNaN(ci.getTime()) || isNaN(co.getTime()) || ci >= co) return res.status(400).json({ message: "Invalid dates" });
  const entry = await new Waitlist({ hotelId: req.params.hotelId, email, firstName, lastName, checkIn: ci, checkOut: co }).save();
  await sendNotification({
    type: "waitlist_joined",
    to: email,
    subject: "Added to Waitlist",
    message: "You're on the waitlist. We'll notify you if dates open up.",
    metadata: {
      hotelId: req.params.hotelId,
      waitlistId: entry._id,
      checkIn: ci.toISOString(),
      checkOut: co.toISOString(),
    },
  });
  res.status(201).json(entry);
};

export const getWaitlist = async (req: Request, res: Response) => {
  const items = await Waitlist.find({ hotelId: req.params.hotelId }).sort({ createdAt: -1 });
  res.json(items);
};
