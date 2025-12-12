import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: string;
  type: "booking" | "reminder" | "promotion" | "system";
  title: string;
  message: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["booking", "reminder", "promotion", "system"], default: "system" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Create index for fetching user notifications efficiently
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export default mongoose.model<INotification>("Notification", NotificationSchema);
