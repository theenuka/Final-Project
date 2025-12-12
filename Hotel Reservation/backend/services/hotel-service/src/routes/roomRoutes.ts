import express from "express";
import { verifyToken, requireOwner } from "../middleware/auth";
import {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  getRoomCount,
} from "../controllers/roomController";

const router = express.Router();

router.get("/hotels/:hotelId/room-types/:roomTypeId/count", getRoomCount);

router
  .route("/hotels/:hotelId/rooms")
  .post(verifyToken, requireOwner, createRoom)
  .get(getRooms);

router
  .route("/hotels/:hotelId/rooms/:roomId")
  .get(getRoom)
  .patch(verifyToken, requireOwner, updateRoom)
  .delete(verifyToken, requireOwner, deleteRoom);

export default router;
