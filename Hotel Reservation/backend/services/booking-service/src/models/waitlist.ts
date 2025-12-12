import mongoose, { Document } from "mongoose";

export type WaitlistStatus = "waiting" | "notified" | "converted";

export interface IWaitlist extends Document {
  _id: string;
  hotelId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  checkIn: Date;
  checkOut: Date;
  status: WaitlistStatus;
  notifiedAt?: Date;
  convertedBookingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const waitlistSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    firstName: { type: String },
    lastName: { type: String },
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true },
    status: { type: String, enum: ["waiting", "notified", "converted"], default: "waiting", index: true },
    notifiedAt: { type: Date },
    convertedBookingId: { type: String },
  },
  { timestamps: true }
);

waitlistSchema.index({ hotelId: 1, email: 1, checkIn: 1 });
waitlistSchema.index({ hotelId: 1, status: 1, createdAt: 1 });

export default mongoose.model<IWaitlist>("Waitlist", waitlistSchema);
