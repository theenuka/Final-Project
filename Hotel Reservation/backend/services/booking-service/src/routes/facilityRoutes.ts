import express from "express";
import { attachUser } from "../middleware/auth";
import {
  getFacilityAvailability,
  bookFacility,
  getMyFacilityBookings,
  getHotelFacilityBookings,
  cancelFacilityBooking,
  updateFacilityBooking,
} from "../controllers/facilityController";

const router = express.Router();

router.get("/hotels/:hotelId/facilities/:facilityName/availability", getFacilityAvailability);
router.post("/hotels/:hotelId/facilities/book", attachUser, bookFacility);
router.get("/my-facility-bookings", attachUser, getMyFacilityBookings);
router.get("/hotels/:hotelId/facility-bookings", getHotelFacilityBookings);
router.post("/facility-bookings/:bookingId/cancel", attachUser, cancelFacilityBooking);
router.patch("/facility-bookings/:bookingId", attachUser, updateFacilityBooking);

export default router;
