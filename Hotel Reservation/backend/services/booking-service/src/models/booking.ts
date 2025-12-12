import mongoose, { Document } from "mongoose";

export interface IRoomAllocation {
  roomType: string;
  roomNumber?: string;
  adultCount: number;
  childCount: number;
  pricePerNight: number;
  specialRequests?: string;
}

export interface IBooking extends Document {
  _id: string;
  userId: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  adultCount: number;
  childCount: number;
  checkIn: Date;
  checkOut: Date;
  totalCost: number;
  // Multi-room support
  roomCount: number;
  rooms?: IRoomAllocation[];
  status: "pending" | "confirmed" | "cancelled" | "completed" | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod?: string;
  specialRequests?: string;
  cancellationReason?: string;
  refundAmount?: number;
  reminderSent?: boolean;
  checkoutReminderSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roomAllocationSchema = new mongoose.Schema(
  {
    roomType: { type: String, required: true },
    roomNumber: { type: String },
    adultCount: { type: Number, required: true, default: 1 },
    childCount: { type: Number, default: 0 },
    pricePerNight: { type: Number, required: true },
    specialRequests: { type: String },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    hotelId: { type: String, required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String },
    adultCount: { type: Number, required: true },
    childCount: { type: Number, required: true },
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true },
    totalCost: { type: Number, required: true },
    // Multi-room support
    roomCount: { type: Number, default: 1 },
    rooms: { type: [roomAllocationSchema], default: undefined },
    status: { type: String, enum: ["pending", "confirmed", "cancelled", "completed", "refunded"], default: "pending", index: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending", index: true },
    paymentMethod: { type: String },
    specialRequests: { type: String },
    cancellationReason: { type: String },
    refundAmount: { type: Number, default: 0 },
    // Reminder tracking
    reminderSent: { type: Boolean, default: false },
    checkoutReminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ hotelId: 1, checkIn: 1 });

export default mongoose.model<IBooking>("Booking", bookingSchema);
