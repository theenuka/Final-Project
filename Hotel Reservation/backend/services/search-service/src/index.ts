import express from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";
import { connectWithRetry } from "./config/db";
import searchRoutes from "./routes/searchRoutes";
import facilitySearchRoutes from "./routes/facilitySearchRoutes";

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_URL || "http://localhost:5174"], credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

connectWithRetry();

// Health
app.get("/health", (_req, res) => res.json({ status: "ok", service: "search-service" }));

// Routes
app.use("/api", searchRoutes);
app.use("/api", facilitySearchRoutes);

const port = process.env.PORT || 7105;
app.listen(port, () => console.log(`search-service listening on :${port}`));
