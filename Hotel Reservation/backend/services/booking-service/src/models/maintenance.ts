import mongoose, { Document, Schema } from "mongoose";

export interface IMaintenance {
  hotelId: string;
  title?: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  priority?: string;
  status?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMaintenanceDocument extends IMaintenance, Document {}

const maintenanceSchema = new Schema<IMaintenanceDocument>(
  {
    hotelId: { type: String, required: true, index: true },
    title: { type: String },
    description: { type: String },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    priority: { type: String, default: "medium" },
    status: { type: String, default: "scheduled" },
    createdBy: { type: String },
  },
  { timestamps: true }
);

maintenanceSchema.index({ hotelId: 1, startDate: 1 });

export default mongoose.model<IMaintenanceDocument>("Maintenance", maintenanceSchema);
