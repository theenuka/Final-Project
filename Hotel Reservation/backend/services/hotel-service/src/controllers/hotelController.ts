import { Request, Response } from "express";
import Hotel from "../models/hotel";
import Maintenance from "../models/maintenance";
import { AuthedRequest } from "../middleware/auth";
import { buildHotelPayload, extractImageUrls, uploadToCloudinary } from "../utils/hotelUtils";

export const getAllHotels = async (_req: Request, res: Response) => {
  try {
    console.log("Attempting to fetch hotels...");
    const hotels = await Hotel.find({ imageUrls: { $exists: true, $ne: [] } }).sort("-lastUpdated");
    console.log(`Fetched ${hotels.length} hotels`);
    res.json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Error fetching hotels", error: String(error) });
  }
};

export const getHotelById = async (req: Request, res: Response) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) return res.status(404).json({ message: "Hotel not found" });
  res.json(hotel);
};

export const getMyHotels = async (req: AuthedRequest, res: Response) => {
  const hotels = await Hotel.find({ userId: req.userId }).sort("-lastUpdated");
  res.json(hotels);
};

export const getMyHotelById = async (req: AuthedRequest, res: Response) => {
  const hotel = await Hotel.findOne({ _id: req.params.id, userId: req.userId });
  if (!hotel) return res.status(404).json({ message: "Hotel not found" });
  res.json(hotel);
};

export const createHotel = async (req: AuthedRequest, res: Response) => {
  const uploaded = await uploadToCloudinary((req.files as Express.Multer.File[]) || []);
  let imageUrls = uploaded.length > 0 ? uploaded : extractImageUrls(req.body);
  if (!Array.isArray(imageUrls)) imageUrls = imageUrls ? [imageUrls as any] : [];
  const payload = buildHotelPayload(req.body);
  const hotel = await new Hotel({
    ...payload,
    imageUrls,
    userId: req.userId,
    lastUpdated: new Date(),
  }).save();
  res.json(hotel);
};

export const updateHotel = async (req: AuthedRequest, res: Response) => {
  const uploaded = await uploadToCloudinary((req.files as Express.Multer.File[]) || []);
  let imageUrls = uploaded.length > 0 ? uploaded : extractImageUrls(req.body);
  if (!Array.isArray(imageUrls)) imageUrls = imageUrls ? [imageUrls as any] : [];
  const payload = buildHotelPayload(req.body);
  const updated = await Hotel.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { ...payload, imageUrls, lastUpdated: new Date() },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: "Hotel not found" });
  res.json(updated);
};

export const deleteHotel = async (req: AuthedRequest, res: Response) => {
  const deleted = await Hotel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!deleted) return res.status(404).json({ message: "Hotel not found" });
  res.json({ success: true });
};

export const getMaintenance = async (req: AuthedRequest, res: Response) => {
  const hotel = await Hotel.findOne({ _id: req.params.id, userId: req.userId });
  if (!hotel) return res.status(404).json({ message: "Hotel not found" });
  const items = await Maintenance.find({ hotelId: req.params.id }).sort({ startDate: 1 });
  res.json(items);
};

export const createMaintenance = async (req: AuthedRequest, res: Response) => {
  const hotel = await Hotel.findOne({ _id: req.params.id, userId: req.userId });
  if (!hotel) return res.status(404).json({ message: "Hotel not found" });
  const { title, description, startDate, endDate } = req.body || {};
  const sd = new Date(startDate);
  const ed = new Date(endDate);
  if (!startDate || !endDate || isNaN(sd.getTime()) || isNaN(ed.getTime()) || sd >= ed) {
    return res.status(400).json({ message: "Invalid start/end dates" });
  }
  const existing = await Maintenance.findOne({ hotelId: req.params.id, startDate: { $lt: ed }, endDate: { $gt: sd } });
  if (existing) return res.status(409).json({ message: "Overlaps an existing maintenance window" });
  const item = await new Maintenance({ hotelId: req.params.id, title, description, startDate: sd, endDate: ed }).save();
  res.status(201).json(item);
};

export const deleteMaintenance = async (req: AuthedRequest, res: Response) => {
  const hotel = await Hotel.findOne({ _id: req.params.id, userId: req.userId });
  if (!hotel) return res.status(404).json({ message: "Hotel not found" });
  const deleted = await Maintenance.findOneAndDelete({ _id: req.params.mid, hotelId: req.params.id });
  if (!deleted) return res.status(404).json({ message: "Maintenance not found" });
  res.json({ success: true });
};
