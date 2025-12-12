import mongoose, { Document } from "mongoose";

export interface IRoom extends Document {
  _id: string;
  hotelId: string;
  roomTypeId: string;
  roomNumber: string;
  isAvailable: boolean;
  lastMaintainedAt?: Date;
}

const roomSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, index: true },
    roomTypeId: { type: String, required: true, ref: "RoomType" },
    roomNumber: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    lastMaintainedAt: Date,
  },
  { timestamps: true }
);

roomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });

export default mongoose.model<IRoom>("Room", roomSchema);
