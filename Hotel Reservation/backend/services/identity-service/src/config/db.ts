import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_CONNECTION_STRING as string;

if (!MONGO_URI) {
  console.error("MONGODB_CONNECTION_STRING missing");
  process.exit(1);
}

export const connectDB = async () => {
  const connectWithRetry = async () => {
    try {
      await mongoose.connect(MONGO_URI);
      console.log("identity-service connected to MongoDB");
    } catch (e: any) {
      console.error("Mongo connect failed, retrying in 5s:", e?.message || e);
      setTimeout(connectWithRetry, 5000);
    }
  };
  await connectWithRetry();
};
