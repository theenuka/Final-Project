import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user";
import RefreshToken from "../models/refreshToken";
import PasswordResetToken from "../models/passwordResetToken";
import { sendEmail } from "../utils/email";
import {
  attachTokens,
  generateVerificationCode,
  hashToken,
  issueTokens,
  randomToken,
  sanitizeUser,
  SanitizableUser,
} from "../services/authService";
import { AuthedRequest } from "../middleware/auth";

const VERIFICATION_CODE_TTL_MINUTES = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 15);
const PASSWORD_RESET_TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 60);
const REQUIRE_VERIFIED_LOGIN = (process.env.REQUIRE_VERIFIED_EMAIL_FOR_LOGIN || "false") === "true";
const allowRoleOverride = (process.env.ALLOW_ROLE_FROM_REGISTER ?? "true").toLowerCase() === "true";

const minutesToMillis = (minutes: number) => minutes * 60 * 1000;

export const register = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const requestedRole = allowRoleOverride ? ((req.body?.role as string) || undefined) : undefined;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already used" });
  const hashed = await bcrypt.hash(password, 10);
  const role = requestedRole && ["user", "admin", "hotel_owner"].includes(requestedRole) ? requestedRole : "user";
  const verificationCode = generateVerificationCode();
  const user = await User.create({
    email,
    password: hashed,
    firstName,
    lastName,
    role,
    verificationCode,
    verificationCodeExpiresAt: new Date(Date.now() + minutesToMillis(VERIFICATION_CODE_TTL_MINUTES)),
  });
  await sendEmail({
    to: email,
    subject: "Verify your account",
    message: `Your verification code is ${verificationCode}`,
    type: "verification_code",
    metadata: { email, verificationCode },
  });
  const tokens = await issueTokens(user);
  res.json({
    ...attachTokens(user, tokens),
    message: "Registration successful. Please verify your email.",
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  if (REQUIRE_VERIFIED_LOGIN && !user.emailVerified) {
    return res.status(409).json({ message: "Email not verified" });
  }
  const tokens = await issueTokens(user);
  res.json(attachTokens(user, tokens));
};

export const validateToken = (_req: Request, res: Response) => res.json({ valid: true });

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.body?.refreshToken as string | undefined;
  if (refreshToken) {
    await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
  }
  res.json({ success: true });
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.body?.refreshToken as string | undefined;
  if (!refreshToken) return res.status(400).json({ message: "refreshToken required" });
  const tokenHash = hashToken(refreshToken);
  const stored = await RefreshToken.findOne({ tokenHash });
  if (!stored || stored.expiresAt.getTime() <= Date.now()) {
    return res.status(401).json({ message: "refresh token invalid" });
  }
  const user = await User.findById(stored.userId);
  if (!user) {
    await stored.deleteOne();
    return res.status(401).json({ message: "refresh token invalid" });
  }
  await stored.deleteOne();
  const tokens = await issueTokens(user);
  res.json(attachTokens(user, tokens));
};

export const requestVerification = async (req: Request, res: Response) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "email required" });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "user not found" });
  if (user.emailVerified) return res.json({ message: "already verified" });
  user.verificationCode = generateVerificationCode();
  user.verificationCodeExpiresAt = new Date(Date.now() + minutesToMillis(VERIFICATION_CODE_TTL_MINUTES));
  await user.save();
  await sendEmail({
    to: email,
    subject: "Verify your account",
    message: `Your verification code is ${user.verificationCode}`,
    type: "verification_code",
    metadata: { email, verificationCode: user.verificationCode },
  });
  res.json({ message: "verification code sent" });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ message: "email and code required" });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "user not found" });
  if (!user.verificationCode || user.verificationCode !== code) {
    return res.status(400).json({ message: "invalid code" });
  }
  if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: "code expired" });
  }
  user.emailVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpiresAt = undefined;
  await user.save();
  res.json({ ...sanitizeUser(user) });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "email required" });
  const user = await User.findOne({ email });
  if (!user) return res.json({ message: "If the account exists, a reset email was sent." });
  const token = randomToken();
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + minutesToMillis(PASSWORD_RESET_TOKEN_TTL_MINUTES)),
  });
  await sendEmail({
    to: email,
    subject: "Password reset",
    message: `Use this token to reset your password: ${token}`,
    type: "password_reset",
    metadata: { email, token },
  });
  res.json({ message: "If the account exists, a reset email was sent." });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ message: "token and password required" });
  const tokenHash = hashToken(token);
  const resetDoc = await PasswordResetToken.findOne({ tokenHash });
  if (!resetDoc || resetDoc.usedAt || resetDoc.expiresAt.getTime() <= Date.now()) {
    return res.status(400).json({ message: "invalid token" });
  }
  const user = await User.findById(resetDoc.userId);
  if (!user) {
    await resetDoc.deleteOne();
    return res.status(400).json({ message: "invalid token" });
  }
  user.password = await bcrypt.hash(password, 10);
  await user.save();
  resetDoc.usedAt = new Date();
  await resetDoc.save();
  await RefreshToken.deleteMany({ userId: user._id });
  res.json({ message: "password updated" });
};
