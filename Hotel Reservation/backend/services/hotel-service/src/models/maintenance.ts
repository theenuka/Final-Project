import mongoose, { Document } from "mongoose";

export interface IMaintenance extends Document {
  _id: string;
  hotelId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const maintenanceSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

maintenanceSchema.index({ hotelId: 1, startDate: 1 });

export default mongoose.model<IMaintenance>("Maintenance", maintenanceSchema);
