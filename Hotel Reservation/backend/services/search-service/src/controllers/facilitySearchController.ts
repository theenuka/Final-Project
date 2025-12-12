import { Request, Response } from "express";
import mongoosePkg from "mongoose";
import { Hotel } from "../models/models";
import { getCached, setCache, stableKey } from "../utils/cache";
import { normalizeArrayParam, toNumber } from "../utils/queryBuilder";

// FacilityBooking model for availability checking
const FacilityBookingSchema = new mongoosePkg.Schema({}, { strict: false });
const FacilityBooking =
  mongoosePkg.models.FacilityBooking ||
  mongoosePkg.model("FacilityBooking", FacilityBookingSchema, "facilitybookings");

export const searchFacilities = async (req: Request, res: Response) => {
  const start = Date.now();
  const {
    destination,
    type,
    capacity,
    amenities,
    maxPrice,
    minPrice,
    date,
    startTime,
    endTime,
    sortOption,
    page,
  } = req.query as Record<string, unknown>;

  const amenityFilters = normalizeArrayParam(amenities);
  const pageSize = Number(process.env.SEARCH_PAGE_SIZE || 10);
  const pageNumber = Math.max(1, Number(page) || 1);
  const skip = (pageNumber - 1) * pageSize;

  // Build query for hotels that have facility spaces
  const hotelQuery: Record<string, unknown> = {
    facilitySpaces: { $exists: true, $ne: [] },
  };

  // Filter by destination
  if (destination && typeof destination === "string" && destination.trim()) {
    const regex = { $regex: destination.trim(), $options: "i" };
    hotelQuery.$or = [
      { city: regex },
      { country: regex },
      { "location.city": regex },
      { "location.country": regex },
    ];
  }

  // Get all hotels with facility spaces
  const hotels = await Hotel.find(hotelQuery).lean();

  // Filter facility spaces based on criteria
  let allFacilities: any[] = [];

  for (const hotel of hotels) {
    if (!hotel.facilitySpaces || !Array.isArray(hotel.facilitySpaces)) continue;

    hotel.facilitySpaces.forEach((facility: any, index: number) => {
      let matches = true;

      // Filter by facility type
      if (type && typeof type === "string") {
        if (facility.type.toLowerCase() !== type.toLowerCase()) {
          matches = false;
        }
      }

      // Filter by capacity
      if (capacity && facility.capacity) {
        const minCapacity = Number(capacity);
        if (Number.isFinite(minCapacity) && facility.capacity < minCapacity) {
          matches = false;
        }
      }

      // Filter by amenities
      if (amenityFilters.length > 0 && facility.amenities) {
        const facilityAmenities = facility.amenities.map((a: string) => a.toLowerCase());
        const hasAllAmenities = amenityFilters.every((required) =>
          facilityAmenities.some((a: string) => a.toLowerCase().includes(required.toLowerCase()))
        );
        if (!hasAllAmenities) {
          matches = false;
        }
      }

      // Filter by price (hourly or daily)
      const facilityPrice = facility.pricePerHour || facility.pricePerDay || 0;
      const parsedMin = toNumber(minPrice);
      const parsedMax = toNumber(maxPrice);
      if (parsedMin !== undefined && facilityPrice < parsedMin) {
        matches = false;
      }
      if (parsedMax !== undefined && facilityPrice > parsedMax) {
        matches = false;
      }

      // Check if facility is available
      if (facility.isAvailable === false) {
        matches = false;
      }

      if (matches) {
        allFacilities.push({
          facilityIndex: index,
          facilityName: facility.name,
          facilityType: facility.type,
          description: facility.description,
          capacity: facility.capacity,
          areaSqFt: facility.areaSqFt,
          pricePerHour: facility.pricePerHour,
          pricePerDay: facility.pricePerDay,
          currency: facility.currency || "USD",
          amenities: facility.amenities || [],
          bookingRules: facility.bookingRules || [],
          isAvailable: facility.isAvailable !== false,
          lastMaintainedAt: facility.lastMaintainedAt,
          images: facility.images || [],
          hotel: {
            _id: hotel._id,
            name: hotel.name,
            city: hotel.city,
            country: hotel.country,
            location: hotel.location,
            starRating: hotel.starRating,
            imageUrls: hotel.imageUrls,
          },
        });
      }
    });
  }

  // Check availability against facility bookings if date/time provided
  let unavailableFacilities: string[] = [];
  if (date && startTime && endTime) {
    const bookingDate = new Date(String(date));
    const st = String(startTime);
    const et = String(endTime);

    if (!isNaN(bookingDate.getTime())) {
      const dayStart = new Date(bookingDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      // Find all facility bookings for the requested date/time
      const existingBookings = await FacilityBooking.find({
        bookingDate: { $gte: dayStart, $lt: dayEnd },
        status: { $in: ["pending", "confirmed"] },
        $or: [{ startTime: { $lt: et }, endTime: { $gt: st } }],
      }).lean();

      // Create a set of unavailable facility identifiers
      unavailableFacilities = existingBookings.map((booking: any) =>
        `${booking.hotelId}_${booking.facilityName}`
      );

      // Filter out unavailable facilities
      allFacilities = allFacilities.filter((f) => {
        const identifier = `${f.hotel._id}_${f.facilityName}`;
        return !unavailableFacilities.includes(identifier);
      });
    }
  }

  // Sort facilities
  switch (sortOption) {
    case "priceAsc":
      allFacilities.sort((a, b) => {
        const priceA = a.pricePerHour || a.pricePerDay || 0;
        const priceB = b.pricePerHour || b.pricePerDay || 0;
        return priceA - priceB;
      });
      break;
    case "priceDesc":
      allFacilities.sort((a, b) => {
        const priceA = a.pricePerHour || a.pricePerDay || 0;
        const priceB = b.pricePerHour || b.pricePerDay || 0;
        return priceB - priceA;
      });
      break;
    case "capacityDesc":
      allFacilities.sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
      break;
    case "capacityAsc":
      allFacilities.sort((a, b) => (a.capacity || 0) - (b.capacity || 0));
      break;
    case "name":
      allFacilities.sort((a, b) => a.facilityName.localeCompare(b.facilityName));
      break;
    default:
      // Default: sort by hotel star rating and then by capacity
      allFacilities.sort((a, b) => {
        if (b.hotel.starRating !== a.hotel.starRating) {
          return b.hotel.starRating - a.hotel.starRating;
        }
        return (b.capacity || 0) - (a.capacity || 0);
      });
  }

  // Calculate totals and pagination
  const total = allFacilities.length;
  const paginatedFacilities = allFacilities.slice(skip, skip + pageSize);

  // Collect facets for filtering
  const facilityTypes = [...new Set(allFacilities.map((f) => f.facilityType))];
  const capacityRanges = allFacilities.map((f) => f.capacity || 0).filter((c) => c > 0);
  const priceRanges = allFacilities
    .map((f) => f.pricePerHour || f.pricePerDay || 0)
    .filter((p) => p > 0);

  const facets = {
    types: facilityTypes.map((type) => ({
      _id: type,
      count: allFacilities.filter((f) => f.facilityType === type).length,
    })),
    capacityRange: {
      min: capacityRanges.length > 0 ? Math.min(...capacityRanges) : 0,
      max: capacityRanges.length > 0 ? Math.max(...capacityRanges) : 0,
    },
    priceRange: {
      min: priceRanges.length > 0 ? Math.min(...priceRanges) : 0,
      max: priceRanges.length > 0 ? Math.max(...priceRanges) : 0,
    },
  };

  const response = {
    data: paginatedFacilities,
    pagination: {
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
      pageSize,
    },
    facets,
    availability: {
      requestedWindow: date && startTime && endTime ? { date, startTime, endTime } : null,
      excludedFacilityCount: unavailableFacilities.length,
    },
    meta: {
      durationMs: Date.now() - start,
      servedFromCache: false,
    },
  };

  res.json(response);
};
