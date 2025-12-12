import express from "express";
import { attachUser } from "../middleware/auth";
import {
  createMaintenance,
  getMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from "../controllers/maintenanceController";

const router = express.Router();

router.post("/maintenance", attachUser, createMaintenance);
router.get("/maintenance", getMaintenance);
router.patch("/maintenance/:maintenanceId", attachUser, updateMaintenance);
router.delete("/maintenance/:maintenanceId", attachUser, deleteMaintenance);

export default router;
