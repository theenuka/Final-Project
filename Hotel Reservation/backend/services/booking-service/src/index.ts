import express from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";
import { connectWithRetry } from "./config/db";
import bookingRoutes from "./routes/bookingRoutes";
import facilityRoutes from "./routes/facilityRoutes";
import maintenanceRoutes from "./routes/maintenanceRoutes";
import insightsRoutes from "./routes/insightsRoutes";

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_URL || "http://localhost:5174"], credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

connectWithRetry();

// Health
app.get("/health", (_req, res) => res.json({ status: "ok", service: "booking-service" }));

// Routes
app.use("/api", bookingRoutes);
app.use("/api", facilityRoutes);
app.use("/api", maintenanceRoutes);
app.use("/api", insightsRoutes);

const port = process.env.PORT || 7104;
app.listen(port, () => console.log(`booking-service listening on :${port}`));
