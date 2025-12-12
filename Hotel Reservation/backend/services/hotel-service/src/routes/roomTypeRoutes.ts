import express from "express";
import { verifyToken, requireOwner } from "../middleware/auth";
import {
  createRoomType,
  getRoomTypes,
  getRoomType,
  updateRoomType,
  deleteRoomType,
  getAllRoomTypes,
} from "../controllers/roomTypeController";

const router = express.Router();

router.get("/room-types", getAllRoomTypes);

router
  .route("/hotels/:hotelId/room-types")
  .post(verifyToken, requireOwner, createRoomType)
  .get(getRoomTypes);

router
  .route("/hotels/:hotelId/room-types/:roomTypeId")
  .get(getRoomType)
  .patch(verifyToken, requireOwner, updateRoomType)
  .delete(verifyToken, requireOwner, deleteRoomType);

export default router;
