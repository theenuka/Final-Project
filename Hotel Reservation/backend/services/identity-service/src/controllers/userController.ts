import { Request, Response } from "express";
import User from "../models/user";
import { sanitizeUser, SanitizableUser } from "../services/authService";
import { AuthedRequest } from "../middleware/auth";

export const getMe = async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "not found" });
  res.json(sanitizeUser(user));
};

export const updateMe = async (req: AuthedRequest, res: Response) => {
  const updates: any = {};
  if (typeof req.body?.firstName === 'string') updates.firstName = req.body.firstName;
  if (typeof req.body?.lastName === 'string') updates.lastName = req.body.lastName;
  if (typeof req.body?.phone === 'string') updates.phone = req.body.phone;
  const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
  if (!user) return res.status(404).json({ message: "not found" });
  res.json(sanitizeUser(user));
};

export const getNotificationPreferences = async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "not found" });
  res.json(user.notificationPreferences || {
    emailBookingConfirmation: true,
    emailReminders: true,
    emailPromotions: false,
    smsBookingConfirmation: true,
    smsReminders: false,
  });
};

export const updateNotificationPreferences = async (req: AuthedRequest, res: Response) => {
  const prefs = req.body || {};
  const updates: any = {};
  if (typeof prefs.emailBookingConfirmation === 'boolean') updates['notificationPreferences.emailBookingConfirmation'] = prefs.emailBookingConfirmation;
  if (typeof prefs.emailReminders === 'boolean') updates['notificationPreferences.emailReminders'] = prefs.emailReminders;
  if (typeof prefs.emailPromotions === 'boolean') updates['notificationPreferences.emailPromotions'] = prefs.emailPromotions;
  if (typeof prefs.smsBookingConfirmation === 'boolean') updates['notificationPreferences.smsBookingConfirmation'] = prefs.smsBookingConfirmation;
  if (typeof prefs.smsReminders === 'boolean') updates['notificationPreferences.smsReminders'] = prefs.smsReminders;
  
  const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true });
  if (!user) return res.status(404).json({ message: "not found" });
  res.json({ success: true, notificationPreferences: user.notificationPreferences });
};

export const getLoyalty = async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "not found" });
  
  const points = user.loyaltyPoints || 0;
  let tier: "bronze" | "silver" | "gold" | "platinum" = "bronze";
  let nextTierPoints: number | undefined;
  
  if (points >= 15000) {
    tier = "platinum";
  } else if (points >= 5000) {
    tier = "gold";
    nextTierPoints = 15000;
  } else if (points >= 1000) {
    tier = "silver";
    nextTierPoints = 5000;
  } else {
    tier = "bronze";
    nextTierPoints = 1000;
  }
  
  const benefits = {
    bronze: ["1 point per £1 spent", "Birthday bonus points"],
    silver: ["5% discount on bookings", "Priority customer support", "Early check-in when available"],
    gold: ["10% discount on bookings", "Free room upgrades", "Late checkout", "Lounge access"],
    platinum: ["15% discount on bookings", "Guaranteed room upgrades", "24/7 concierge", "Free airport transfers"],
  };
  
  res.json({
    tier,
    points,
    totalBookings: user.totalBookings || 0,
    memberSince: user.createdAt?.toISOString() || new Date().toISOString(),
    nextTierPoints,
    benefits: benefits[tier],
  });
};

export const addLoyaltyPoints = async (req: AuthedRequest, res: Response) => {
  const points = Number(req.body?.points || 0);
  if (!Number.isFinite(points) || points <= 0) return res.status(400).json({ message: "points must be > 0" });
  const user = await User.findByIdAndUpdate(req.userId, { $inc: { loyaltyPoints: points } }, { new: true });
  if (!user) return res.status(404).json({ message: "not found" });
  res.json({ loyaltyPoints: user.loyaltyPoints });
};

export const getAllUsers = async (_req: Request, res: Response) => {
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  res.json(users.map((u) => sanitizeUser(u as SanitizableUser)));
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { role }: { role?: "user" | "admin" | "hotel_owner" } = req.body || {};
  if (!role || !["user", "admin", "hotel_owner"].includes(role)) {
    return res.status(400).json({ message: "invalid role" });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return res.status(404).json({ message: "not found" });
  res.json(sanitizeUser(user));
};

export const internalAddLoyalty = async (req: Request, res: Response) => {
  const points = Number(req.body?.points ?? 0);
  if (!Number.isFinite(points) || points <= 0) {
    return res.status(400).json({ message: "points must be greater than 0" });
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $inc: { loyaltyPoints: points } },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: "not found" });
  res.json({ userId: user._id, loyaltyPoints: user.loyaltyPoints });
};
