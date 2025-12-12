import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_URL || "http://localhost:5174"], credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

connectDB();

app.get("/health", (_req: Request, res: Response) => res.json({ status: "ok", service: "identity-service" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // For /api/users/me, /api/users/admin/users, etc.

const port = process.env.PORT || 7102;
app.listen(port, () => console.log(`identity-service listening on :${port}`));
