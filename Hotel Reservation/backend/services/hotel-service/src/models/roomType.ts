import mongoose, { Document } from "mongoose";

export interface IRoomType extends Document {
  _id: string;
  hotelId: string;
  name: string;
  description: string;
  adultCount: number;
  childCount: number;
  pricePerNight: number;
  amenities: string[];
  imageUrls: string[];
}

const roomTypeSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    adultCount: { type: Number, required: true },
    childCount: { type: Number, required: true },
    pricePerNight: { type: Number, required: true },
    amenities: [{ type: String }],
    imageUrls: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IRoomType>("RoomType", roomTypeSchema);
