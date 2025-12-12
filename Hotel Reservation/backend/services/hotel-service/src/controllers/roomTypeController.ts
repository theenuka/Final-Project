import mongoose from "mongoose";
import { Request, Response } from "express";
import RoomType from "../models/roomType";
import Hotel from "../models/hotel";
import { AuthedRequest } from "../middleware/auth";

export const createRoomType = async (req: AuthedRequest, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { name, description, adultCount, childCount, pricePerNight, amenities, imageUrls } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (hotel.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const newRoomType = new RoomType({
      hotelId,
      name,
      description,
      adultCount: Number(adultCount),
      childCount: Number(childCount),
      pricePerNight: Number(pricePerNight),
      amenities,
      imageUrls,
    });

    await newRoomType.save();

    hotel.roomTypes.push(new mongoose.Types.ObjectId(newRoomType._id));
    await hotel.save();

    res.status(201).json(newRoomType);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getRoomTypes = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const roomTypes = await RoomType.find({ hotelId });
    res.status(200).json(roomTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getRoomType = async (req: Request, res: Response) => {
  try {
    const { roomTypeId } = req.params;
    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      return res.status(404).json({ message: "Room type not found" });
    }
    res.status(200).json(roomType);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateRoomType = async (req: AuthedRequest, res: Response) => {
  try {
    const { hotelId, roomTypeId } = req.params;
    const { name, description, adultCount, childCount, pricePerNight, amenities, imageUrls } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (hotel.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updatedRoomType = await RoomType.findByIdAndUpdate(
      roomTypeId,
      {
        name,
        description,
        adultCount: Number(adultCount),
        childCount: Number(childCount),
        pricePerNight: Number(pricePerNight),
        amenities,
        imageUrls,
      },
      { new: true }
    );

    if (!updatedRoomType) {
      return res.status(404).json({ message: "Room type not found" });
    }

    res.status(200).json(updatedRoomType);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getAllRoomTypes = async (req: Request, res: Response) => {
  try {
    const roomTypes = await RoomType.find();
    res.status(200).json(roomTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteRoomType = async (req: AuthedRequest, res: Response) => {
  try {
    const { hotelId, roomTypeId } = req.params;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (hotel.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const deletedRoomType = await RoomType.findByIdAndDelete(roomTypeId);

    if (!deletedRoomType) {
      return res.status(404).json({ message: "Room type not found" });
    }

    hotel.roomTypes = hotel.roomTypes.filter(
      (id: mongoose.Types.ObjectId) => id.toString() !== roomTypeId
    );
    await hotel.save();

    // TODO: also delete all rooms of this type

    res.status(200).json({ message: "Room type deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
