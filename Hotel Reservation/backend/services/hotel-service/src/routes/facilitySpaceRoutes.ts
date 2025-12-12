import express from "express";
import { verifyToken, requireOwner } from "../middleware/auth";
import {
  getAllFacilitySpaces,
  getFacilitySpace,
  createFacilitySpace,
  updateFacilitySpace,
  deleteFacilitySpace,
} from "../controllers/facilitySpaceController";

const router = express.Router();

// Public routes - anyone can view facility spaces
router.get("/hotels/:hotelId/facility-spaces", getAllFacilitySpaces);
router.get("/hotels/:hotelId/facility-spaces/:facilityIndex", getFacilitySpace);

// Protected routes - only hotel owners can manage facility spaces
router.post("/hotels/:hotelId/facility-spaces", verifyToken, requireOwner, createFacilitySpace);
router.patch("/hotels/:hotelId/facility-spaces/:facilityIndex", verifyToken, requireOwner, updateFacilitySpace);
router.delete("/hotels/:hotelId/facility-spaces/:facilityIndex", verifyToken, requireOwner, deleteFacilitySpace);

export default router;
