import express from "express";
import { attachUser } from "../middleware/auth";
import {
  createPaymentIntent,
  createBooking,
  updateBooking,
  getMyBookings,
  getAllBookings,
  getHotelBookings,
  cancelBooking,
  joinWaitlist,
  getWaitlist,
} from "../controllers/bookingController";

const router = express.Router();

router.post("/hotels/:hotelId/bookings/payment-intent", createPaymentIntent);
router.post("/hotels/:hotelId/bookings", attachUser, createBooking);
router.patch("/bookings/:bookingId", attachUser, updateBooking);
router.get("/my-bookings", attachUser, getMyBookings);
router.get("/bookings/all", attachUser, getAllBookings);
router.get("/bookings/hotel/:hotelId", getHotelBookings);
router.post("/bookings/:bookingId/cancel", attachUser, cancelBooking);
router.post("/hotels/:hotelId/waitlist", attachUser, joinWaitlist);
router.get("/hotels/:hotelId/waitlist", getWaitlist);

export default router;
