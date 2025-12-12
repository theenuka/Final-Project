import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import express from "express";
import { createBooking } from "./bookingController";
import * as availability from "../utils/availability";
import * as loyalty from "../utils/loyalty";
import * as notification from "../utils/notification";
import { attachUser } from "../middleware/auth"; // Import attachUser

// Mock attachUser middleware
jest.mock("../middleware/auth", () => ({
  attachUser: jest.fn((req, res, next) => {
    req.userId = "testUserId"; // Mock userId
    next();
  }),
}));

jest.mock("../utils/availability");
jest.mock("../utils/loyalty");
jest.mock("../utils/notification");

const app = express();
app.use(express.json());
app.post("/api/hotels/:hotelId/bookings", attachUser, createBooking);

describe("Booking Controller", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    (availability.ensureAvailability as jest.Mock).mockResolvedValue({
      bookingConflict: false,
      maintenanceConflict: false,
    });
    (loyalty.awardLoyaltyPoints as jest.Mock).mockResolvedValue(undefined);
    (notification.sendNotification as jest.Mock).mockResolvedValue(undefined);
    (attachUser as jest.Mock).mockClear(); // Clear mock calls for each test
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a booking with valid data", async () => {
    const response = await supertest(app)
      .post("/api/hotels/123/bookings")
      .set("Authorization", "Bearer some-token")
      .send({
        checkIn: "2025-01-01",
        checkOut: "2025-01-05",
        totalCost: 400,
        adultCount: 2,
        childCount: 1,
        rooms: [{ roomType: "roomType1", numberOfRooms: 1, pricePerNight: 100 }],
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
      });

    expect(response.status).toBe(201);
    expect(response.body.bookingId).toBeDefined();
  }, 10000);

  it("should return 400 for invalid check-in/check-out dates", async () => {
    const response = await supertest(app)
      .post("/api/hotels/123/bookings")
      .set("Authorization", "Bearer some-token")
      .send({
        checkIn: "2025-01-05",
        checkOut: "2025-01-01",
        totalCost: 400,
        rooms: [{ roomType: "roomType1", numberOfRooms: 1 }],
      });

    expect(response.status).toBe(400);
  });

  it("should return 409 if room is not available", async () => {
    (availability.ensureAvailability as jest.Mock).mockResolvedValue({
      bookingConflict: true,
      maintenanceConflict: false,
    });

    const response = await supertest(app)
      .post("/api/hotels/123/bookings")
      .set("Authorization", "Bearer some-token")
      .send({
        checkIn: "2025-01-01",
        checkOut: "2025-01-05",
        totalCost: 400,
        rooms: [{ roomType: "roomType1", numberOfRooms: 1 }],
      });

    expect(response.status).toBe(409);
  });
});
