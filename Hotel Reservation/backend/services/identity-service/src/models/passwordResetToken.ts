import mongoose, { Document } from "mongoose";

export interface IPasswordResetToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

passwordResetTokenSchema.index({ tokenHash: 1 });

export default mongoose.model<IPasswordResetToken>("PasswordResetToken", passwordResetTokenSchema);
