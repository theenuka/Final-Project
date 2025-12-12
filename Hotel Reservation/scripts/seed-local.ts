import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Schemas should reflect the main application's models as closely as possible
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ["user", "admin", "hotel_owner"], default: "user" }
});
const User = mongoose.model("User", userSchema);

const roomTypeSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
  name: { type: String, required: true },
  description: { type: String },
  adultCount: { type: Number, required: true },
  childCount: { type: Number, required: true },
  pricePerNight: { type: Number, required: true },
  amenities: [String],
  imageUrls: [String],
});
const RoomType = mongoose.model("RoomType", roomTypeSchema);

const hotelSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: String,
  city: String,
  country: String,
  description: String,
  type: [String],
  facilities: [String],
  starRating: Number,
  imageUrls: [String],
  lastUpdated: Date,
  minPricePerNight: Number, // Denormalized for search
  roomTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: "RoomType" }],
});
const Hotel = mongoose.model("Hotel", hotelSchema);


// Helper functions
const unwrap = (v: any) => {
  if (!v || typeof v !== "object") return v;
  if (v.$oid) return v.$oid;
  if (v.$numberInt) return Number(v.$numberInt);
  if (v.$date?.$numberLong) return new Date(Number(v.$date.$numberLong));
  return v;
};

const toArray = (value: unknown): string[] => Array.isArray(value) ? value.filter(Boolean) as string[] : (value ? [String(value)] : []);
const toNumber = (value: unknown, fallback: number): number => {
  const n = Number(unwrap(value));
  return Number.isNaN(n) ? fallback : n;
};
const normalizeImage = (url: string) => url?.replace(/^http:\/\//, "https://");


const run = async () => {
  const MONGO = process.env.MONGODB_CONNECTION_STRING || "mongodb://localhost:27018/hotel-booking";
  await mongoose.connect(MONGO);
  console.log("Connected to", MONGO);

  // Clear existing data
  await Hotel.deleteMany({});
  await RoomType.deleteMany({});
  await User.deleteMany({});
  console.log("Cleared existing collections.");

  // Data sources
  const dataDir = path.resolve(process.cwd(), "data");
  const usersPath = path.join(dataDir, "test-users.json");
  const sampleHotelsPath = path.join(dataDir, "sample-hotels.json");

  const userDoc = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const sampleHotelsRaw = JSON.parse(fs.readFileSync(sampleHotelsPath, "utf-8"));

  // Seed user
  const user = {
    ...userDoc,
    _id: unwrap(userDoc._id),
    password: userDoc.password, // already hashed
    role: userDoc.role || "hotel_owner",
  };
  const upsertedUser = await User.findOneAndUpdate({ email: user.email }, user, { upsert: true, new: true });
  console.log("Seeded user:", upsertedUser.email);

  // Seed hotels and their room types
  for (const hotelDoc of sampleHotelsRaw) {
    if (!hotelDoc || !hotelDoc.name) continue;

    // First, create the RoomType documents for the current hotel
    const roomTypeIds = [];
    let minPrice = Infinity;

    for (const rtDoc of hotelDoc.roomTypes || []) {
      const roomType = new RoomType({
        // hotelId will be set later
        name: rtDoc.name,
        description: rtDoc.description,
        adultCount: toNumber(rtDoc.adultCount, 2),
        childCount: toNumber(rtDoc.childCount, 0),
        pricePerNight: toNumber(rtDoc.pricePerNight, 100),
        amenities: toArray(rtDoc.amenities),
        imageUrls: toArray(rtDoc.imageUrls).map(normalizeImage),
      });
      await roomType.save();
      roomTypeIds.push(roomType._id);
      if (roomType.pricePerNight < minPrice) {
        minPrice = roomType.pricePerNight;
      }
    }

    // Now create the Hotel document
    const hotel = new Hotel({
      userId: upsertedUser._id.toString(),
      name: hotelDoc.name,
      city: hotelDoc.city,
      country: hotelDoc.country,
      description: hotelDoc.description,
      type: toArray(hotelDoc.type),
      facilities: toArray(hotelDoc.facilities),
      starRating: toNumber(hotelDoc.starRating, 4),
      imageUrls: toArray(hotelDoc.imageUrls).map(normalizeImage),
      lastUpdated: new Date(),
      roomTypes: roomTypeIds,
      minPricePerNight: minPrice === Infinity ? 100 : minPrice, // Set the denormalized min price
      isFeatured: hotelDoc.isFeatured || false,
    });
    await hotel.save();

    // Now, update the room types with the hotel ID
    await RoomType.updateMany({ _id: { $in: roomTypeIds } }, { hotelId: hotel._id });

    console.log("Upserted hotel:", hotel.name);
  }
  console.log(`Seeded ${sampleHotelsRaw.length} hotels.`);

  await mongoose.disconnect();
  console.log("Done.");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
