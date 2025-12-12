import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: "user" | "admin" | "hotel_owner";
  loyaltyPoints?: number;
  totalSpent?: number;
  totalBookings?: number;
  emailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiresAt?: Date;
  notificationPreferences?: {
    emailBookingConfirmation: boolean;
    emailReminders: boolean;
    emailPromotions: boolean;
    smsBookingConfirmation: boolean;
    smsReminders: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ["user", "admin", "hotel_owner"], default: "user" },
    loyaltyPoints: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    emailVerified: { type: Boolean, default: false, index: true },
    verificationCode: { type: String },
    verificationCodeExpiresAt: { type: Date },
    notificationPreferences: {
      emailBookingConfirmation: { type: Boolean, default: true },
      emailReminders: { type: Boolean, default: true },
      emailPromotions: { type: Boolean, default: false },
      smsBookingConfirmation: { type: Boolean, default: true },
      smsReminders: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

userSchema.index({ verificationCode: 1 });

export default mongoose.model<IUser>("User", userSchema);
