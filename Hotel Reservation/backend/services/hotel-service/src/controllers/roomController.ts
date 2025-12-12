import { Request, Response } from "express";
import Room from "../models/room";
import Hotel from "../models/hotel";
import { AuthedRequest } from "../middleware/auth";

export const createRoom = async (req: AuthedRequest, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { roomTypeId, roomNumber } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (hotel.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const newRoom = new Room({
      hotelId,
      roomTypeId,
      roomNumber,
    });

    await newRoom.save();

    res.status(201).json(newRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getRooms = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { roomTypeId } = req.query;
    const query: { hotelId: string; roomTypeId?: any } = { hotelId };
    if (roomTypeId) {
      query.roomTypeId = roomTypeId;
    }
    const rooms = await Room.find(query);
    res.status(200).json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.status(200).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateRoom = async (req: AuthedRequest, res: Response) => {
  try {
    const { hotelId, roomId } = req.params;
    const { roomNumber, isAvailable, lastMaintainedAt } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (hotel.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      {
        roomNumber,
        isAvailable,
        lastMaintainedAt,
      },
      { new: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getRoomCount = async (req: Request, res: Response) => {
  try {
    const { roomTypeId } = req.params;
    const count = await Room.countDocuments({ roomTypeId });
    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteRoom = async (req: AuthedRequest, res: Response) => {
  try {
    const { hotelId, roomId } = req.params;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (hotel.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const deletedRoom = await Room.findByIdAndDelete(roomId);

    if (!deletedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
