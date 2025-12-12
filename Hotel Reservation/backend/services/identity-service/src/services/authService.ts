import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { IUser } from "../models/user";
import RefreshToken from "../models/refreshToken";

const JWT_SECRET = (process.env.JWT_SECRET_KEY || "dev_secret") as jwt.Secret;
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);

const millis = (days: number) => days * 24 * 60 * 60 * 1000;

export type SanitizableUser = Pick<IUser, "_id" | "email" | "firstName" | "lastName" | "phone" | "role" | "loyaltyPoints" | "totalSpent" | "totalBookings" | "emailVerified" | "createdAt" | "notificationPreferences">;

export const sanitizeUser = (user: SanitizableUser) => ({
  _id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  role: user.role,
  loyaltyPoints: user.loyaltyPoints,
  totalSpent: user.totalSpent,
  totalBookings: user.totalBookings,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  notificationPreferences: user.notificationPreferences,
});

export const attachTokens = (user: SanitizableUser, tokens: { accessToken: string; refreshToken: string }) => ({
  ...sanitizeUser(user),
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  token: tokens.accessToken,
});

export const createAccessToken = (user: IUser) =>
  jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL as SignOptions["expiresIn"] });

export const randomToken = () => crypto.randomBytes(48).toString("hex");

export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export const generateVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

export const issueTokens = async (user: IUser) => {
  const accessToken = createAccessToken(user);
  const refreshToken = randomToken();
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + millis(REFRESH_TOKEN_TTL_DAYS)),
  });
  return { accessToken, refreshToken };
};
