import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_CONNECTION_STRING as string;

export const connectWithRetry = async () => {
  if (!MONGO_URI) {
    console.error("MONGODB_CONNECTION_STRING missing");
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGO_URI);
    console.log("booking-service connected to MongoDB");
  } catch (e: any) {
    console.error("Mongo connect failed, retrying in 5s:", e?.message || e);
    setTimeout(connectWithRetry, 5000);
  }
};
