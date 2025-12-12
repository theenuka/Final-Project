import { Request, Response } from "express";
import Maintenance, { IMaintenanceDocument } from "../models/maintenance";

export const createMaintenance = async (req: Request & { userId?: string; roles?: string[] }, res: Response) => {
  const allowedRoles = ["staff", "admin", "hotel_owner"];
  const hasPermission = req.roles?.some(role => allowedRoles.includes(role));
  
  if (!hasPermission) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const { hotelId, description, startDate, endDate, priority } = req.body || {};
  
  if (!hotelId || !startDate || !endDate) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const sd = new Date(startDate);
  const ed = new Date(endDate);
  
  if (isNaN(sd.getTime()) || isNaN(ed.getTime()) || sd >= ed) {
    return res.status(400).json({ message: "Invalid dates" });
  }

  const maintenance = await new Maintenance({
    hotelId,
    description,
    startDate: sd,
    endDate: ed,
    priority: priority || "medium",
    createdBy: req.userId,
    status: "scheduled",
  }).save();

  res.status(201).json(maintenance);
};

export const getMaintenance = async (req: Request, res: Response) => {
  const { hotelId, status } = req.query;
  const filter: Record<string, unknown> = {};
  
  if (hotelId) filter.hotelId = hotelId;
  if (status) filter.status = status;

  const records = await Maintenance.find(filter).sort({ startDate: -1 });
  res.json(records);
};

export const updateMaintenance = async (req: Request & { userId?: string; roles?: string[] }, res: Response) => {
  const allowedRoles = ["staff", "admin", "hotel_owner"];
  const hasPermission = req.roles?.some(role => allowedRoles.includes(role));
  
  if (!hasPermission) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const { maintenanceId } = req.params;
  const maintenance = await Maintenance.findById(maintenanceId) as IMaintenanceDocument;
  
  if (!maintenance) {
    return res.status(404).json({ message: "Maintenance record not found" });
  }

  const { description, startDate, endDate, priority, status } = req.body || {};
  
  if (description) maintenance.description = description;
  if (startDate) maintenance.startDate = new Date(startDate);
  if (endDate) maintenance.endDate = new Date(endDate);
  if (priority) (maintenance as any).priority = priority;
  if (status) (maintenance as any).status = status;

  await maintenance.save();
  res.json(maintenance);
};

export const deleteMaintenance = async (req: Request & { userId?: string; roles?: string[] }, res: Response) => {
  const allowedRoles = ["staff", "admin", "hotel_owner"];
  const hasPermission = req.roles?.some(role => allowedRoles.includes(role));
  
  if (!hasPermission) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const { maintenanceId } = req.params;
  const result = await Maintenance.findByIdAndDelete(maintenanceId);
  
  if (!result) {
    return res.status(404).json({ message: "Maintenance record not found" });
  }

  res.json({ success: true });
};
