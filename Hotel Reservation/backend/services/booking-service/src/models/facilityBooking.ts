import mongoose, { Document } from "mongoose";

export interface IFacilityBooking extends Document {
  _id: string;
  userId: string;
  hotelId: string;
  facilityName: string;
  facilityType: "spa" | "gym" | "conference" | "pool" | "restaurant" | "other";
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  guestCount: number;
  bookingDate: Date;
  startTime: string; // "09:00"
  endTime: string;   // "11:00"
  duration: number;  // hours
  totalCost: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  specialRequests?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const facilityBookingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    hotelId: { type: String, required: true, index: true },
    facilityName: { type: String, required: true },
    facilityType: { 
      type: String, 
      enum: ["spa", "gym", "conference", "pool", "restaurant", "other"], 
      required: true, 
      index: true 
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String },
    guestCount: { type: Number, required: true, default: 1 },
    bookingDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["pending", "confirmed", "cancelled", "completed"], 
      default: "pending", 
      index: true 
    },
    paymentStatus: { 
      type: String, 
      enum: ["pending", "paid", "failed", "refunded"], 
      default: "pending", 
      index: true 
    },
    specialRequests: { type: String },
    cancellationReason: { type: String }
  },
  { timestamps: true }
);

facilityBookingSchema.index({ hotelId: 1, facilityName: 1, bookingDate: 1, startTime: 1 });
facilityBookingSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IFacilityBooking>("FacilityBooking", facilityBookingSchema);
