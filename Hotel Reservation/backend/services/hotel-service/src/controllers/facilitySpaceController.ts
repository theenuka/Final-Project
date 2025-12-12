import { Request, Response } from "express";
import Hotel from "../models/hotel";
import { AuthedRequest } from "../middleware/auth";
import { FacilitySpace } from "../models/hotel";

export const getAllFacilitySpaces = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    res.json(hotel.facilitySpaces || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getFacilitySpace = async (req: Request, res: Response) => {
  try {
    const { hotelId, facilityIndex } = req.params;
    const index = parseInt(facilityIndex);

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (!hotel.facilitySpaces || index < 0 || index >= hotel.facilitySpaces.length) {
      return res.status(404).json({ message: "Facility space not found" });
    }

    res.json({ index, facility: hotel.facilitySpaces[index] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const createFacilitySpace = async (req: AuthedRequest, res: Response) => {
  try {
    const { hotelId } = req.params;
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (hotel.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const newFacilitySpace: FacilitySpace = {
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      capacity: req.body.capacity,
      areaSqFt: req.body.areaSqFt,
      pricePerHour: req.body.pricePerHour,
      pricePerDay: req.body.pricePerDay,
      currency: req.body.currency || "USD",
      amenities: req.body.amenities || [],
      bookingRules: req.body.bookingRules || [],
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true,
      lastMaintainedAt: req.body.lastMaintainedAt ? new Date(req.body.lastMaintainedAt) : undefined,
      images: req.body.images || [],
    };

    if (!hotel.facilitySpaces) {
      hotel.facilitySpaces = [];
    }

    hotel.facilitySpaces.push(newFacilitySpace);
    await hotel.save();

    res.status(201).json({
      index: hotel.facilitySpaces.length - 1,
      facility: newFacilitySpace,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateFacilitySpace = async (req: AuthedRequest, res: Response) => {
  try {
    const { hotelId, facilityIndex } = req.params;
    const index = parseInt(facilityIndex);

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (hotel.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!hotel.facilitySpaces || index < 0 || index >= hotel.facilitySpaces.length) {
      return res.status(404).json({ message: "Facility space not found" });
    }

    // Update the facility space
    const currentFacility = hotel.facilitySpaces[index];
    hotel.facilitySpaces[index] = {
      name: req.body.name !== undefined ? req.body.name : currentFacility.name,
      type: req.body.type !== undefined ? req.body.type : currentFacility.type,
      description: req.body.description !== undefined ? req.body.description : currentFacility.description,
      capacity: req.body.capacity !== undefined ? req.body.capacity : currentFacility.capacity,
      areaSqFt: req.body.areaSqFt !== undefined ? req.body.areaSqFt : currentFacility.areaSqFt,
      pricePerHour: req.body.pricePerHour !== undefined ? req.body.pricePerHour : currentFacility.pricePerHour,
      pricePerDay: req.body.pricePerDay !== undefined ? req.body.pricePerDay : currentFacility.pricePerDay,
      currency: req.body.currency !== undefined ? req.body.currency : currentFacility.currency,
      amenities: req.body.amenities !== undefined ? req.body.amenities : currentFacility.amenities,
      bookingRules: req.body.bookingRules !== undefined ? req.body.bookingRules : currentFacility.bookingRules,
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : currentFacility.isAvailable,
      lastMaintainedAt: req.body.lastMaintainedAt !== undefined
        ? new Date(req.body.lastMaintainedAt)
        : currentFacility.lastMaintainedAt,
      images: req.body.images !== undefined ? req.body.images : currentFacility.images,
    };

    await hotel.save();

    res.json({
      index,
      facility: hotel.facilitySpaces[index],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteFacilitySpace = async (req: AuthedRequest, res: Response) => {
  try {
    const { hotelId, facilityIndex } = req.params;
    const index = parseInt(facilityIndex);

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (hotel.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!hotel.facilitySpaces || index < 0 || index >= hotel.facilitySpaces.length) {
      return res.status(404).json({ message: "Facility space not found" });
    }

    hotel.facilitySpaces.splice(index, 1);
    await hotel.save();

    res.json({ message: "Facility space deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
