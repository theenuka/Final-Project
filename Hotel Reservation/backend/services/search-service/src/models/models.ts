import mongoosePkg from "mongoose";

export const Hotel =
  mongoosePkg.models.Hotel ||
  mongoosePkg.model(
    "Hotel",
    new mongoosePkg.Schema(
      {
        city: String,
        country: String,
        pricePerNight: Number,
        starRating: Number,
        facilities: [String],
        type: [String],
      },
      { strict: false }
    ),
    "hotels"
  );

export const Booking =
  mongoosePkg.models.Booking ||
  mongoosePkg.model(
    "Booking",
    new mongoosePkg.Schema(
      {
        hotelId: String,
        checkIn: Date,
        checkOut: Date,
        status: String,
      },
      { strict: false }
    ),
    "bookings"
  );

export const Maintenance =
  mongoosePkg.models.Maintenance ||
  mongoosePkg.model(
    "Maintenance",
    new mongoosePkg.Schema(
      {
        hotelId: String,
        startDate: Date,
        endDate: Date,
      },
      { strict: false }
    ),
    "maintenances"
  );
