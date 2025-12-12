import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";
import { connectDB } from "./config/db";
import hotelRoutes from "./routes/hotelRoutes";
import roomTypeRoutes from "./routes/roomTypeRoutes";
import roomRoutes from "./routes/roomRoutes";
import facilitySpaceRoutes from "./routes/facilitySpaceRoutes";

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_URL || "http://localhost:5174"], credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

connectDB();

app.get("/health", (_req: Request, res: Response) => res.json({ status: "ok", service: "hotel-service" }));

app.use("/api", hotelRoutes);
app.use("/api", roomTypeRoutes);
app.use("/api", roomRoutes);
app.use("/api", facilitySpaceRoutes);

const port = process.env.PORT || 7103;
app.listen(port, () => console.log(`hotel-service listening on :${port}`));
