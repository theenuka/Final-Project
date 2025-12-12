import mongoose, { Document } from "mongoose";

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
}

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

refreshTokenSchema.index({ tokenHash: 1 });

export default mongoose.model<IRefreshToken>("RefreshToken", refreshTokenSchema);
