import express from "express";
import {
  createHotel,
  createMaintenance,
  deleteHotel,
  deleteMaintenance,
  getAllHotels,
  getHotelById,
  getMaintenance,
  getMyHotelById,
  getMyHotels,
  updateHotel,
} from "../controllers/hotelController";
import { requireOwner, verifyToken } from "../middleware/auth";
import { upload } from "../utils/hotelUtils";

const router = express.Router();

// Public routes
router.get("/hotels", getAllHotels);
router.get("/hotels/:id", getHotelById);

// Protected routes (My Hotels)
router.get("/my-hotels", verifyToken, requireOwner, getMyHotels);
router.post("/my-hotels", verifyToken, requireOwner, upload.array("imageFiles", 6), createHotel);
router.get("/my-hotels/:id", verifyToken, requireOwner, getMyHotelById);
router.put("/my-hotels/:id", verifyToken, requireOwner, upload.array("imageFiles", 6), updateHotel);
router.delete("/my-hotels/:id", verifyToken, requireOwner, deleteHotel);

// Maintenance
router.get("/my-hotels/:id/maintenance", verifyToken, requireOwner, getMaintenance);
router.post("/my-hotels/:id/maintenance", verifyToken, requireOwner, createMaintenance);
router.delete("/my-hotels/:id/maintenance/:mid", verifyToken, requireOwner, deleteMaintenance);

export default router;
