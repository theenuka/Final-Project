import express from "express";
import cors from "cors";
import { connectWithRetry } from "./config/db";
import { notificationConfig } from "./config";
import { initializeScheduler } from "./scheduler";
import notificationRoutes from "./routes/notificationRoutes";
import pushRoutes from "./routes/pushRoutes";

const app = express();
const corsOrigins = notificationConfig.allowedOrigins.length
  ? { origin: notificationConfig.allowedOrigins, credentials: true }
  : undefined;
app.use(corsOrigins ? cors(corsOrigins) : cors());
app.use(express.json());

connectWithRetry();

// Health
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

// Routes
app.use("/api", notificationRoutes);
app.use("/api", pushRoutes);

const port = process.env.PORT || 7101;
app.listen(port, () => {
  console.log(`notification-service listening on :${port}`);
  // Initialize the reminder scheduler after MongoDB connects
  if (process.env.MONGODB_CONNECTION_STRING) {
    initializeScheduler();
  }
});
