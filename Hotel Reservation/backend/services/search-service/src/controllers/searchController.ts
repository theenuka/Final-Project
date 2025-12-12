import { Request, Response } from "express";
import mongoosePkg from "mongoose";
import { Hotel, Booking, Maintenance } from "../models/models";
import { getCached, setCache, stableKey } from "../utils/cache";
import { normalizeArrayParam, toNumber, buildAmenitiesFilter } from "../utils/queryBuilder";

export const searchHotels = async (req: Request, res: Response) => {
  const start = Date.now();
  const {
    destination,
    adultCount,
    childCount,
    facilities,
    types,
    stars,
    maxPrice,
    minPrice,
    sortOption,
    page,
    checkIn,
    checkOut,
    tags,
    featured,
    amenities,
    roomTypeId,
  } = req.query as Record<string, unknown>;

  const facilityFilters = normalizeArrayParam(facilities);
  const typeFilters = normalizeArrayParam(types);
  const starFilters = normalizeArrayParam(stars).map((s) => Number(s)).filter(Number.isFinite);
  const tagFilters = normalizeArrayParam(tags);
  const amenityFilters = normalizeArrayParam(amenities);
  const pageSize = Number(process.env.SEARCH_PAGE_SIZE || 6);
  const pageNumber = Math.max(1, Number(page) || 1);
  const skip = (pageNumber - 1) * pageSize;

  const query: Record<string, unknown> = {};
  if (destination && typeof destination === "string" && destination.trim()) {
    const regex = { $regex: destination.trim(), $options: "i" };
    query.$or = [
      { city: regex },
      { country: regex },
      { "location.city": regex },
      { "location.country": regex },
    ];
  }
  if (adultCount) query.adultCount = { $gte: Number(adultCount) };
  if (childCount) query.childCount = { $gte: Number(childCount) };
  if (facilityFilters.length) query.facilities = { $all: facilityFilters };
  if (typeFilters.length) query.type = { $in: typeFilters };
  if (starFilters.length) query.starRating = { $in: starFilters };
  const priceConditions: Record<string, number> = {};
  const parsedMin = toNumber(minPrice);
  const parsedMax = toNumber(maxPrice);
  if (parsedMin !== undefined) priceConditions.$gte = parsedMin;
  if (parsedMax !== undefined) priceConditions.$lte = parsedMax;
  if (Object.keys(priceConditions).length) query.minPricePerNight = priceConditions;
  if ((featured as string)?.toLowerCase() === "true") query.isFeatured = true;
  if (tagFilters.length) query.tags = { $all: tagFilters };
  if (amenityFilters.length) {
    const clauses = buildAmenitiesFilter(amenityFilters);
    query.$and = [...((query.$and as any[]) || []), ...clauses];
  }

  let sort: Record<string, 1 | -1> = {};
  switch (sortOption) {
    case "starRating":
      sort = { starRating: -1 };
      break;
    case "pricePerNightAsc":
      sort = { minPricePerNight: 1 };
      break;
    case "pricePerNightDesc":
      sort = { minPricePerNight: -1 };
      break;
    case "updated":
      sort = { lastUpdated: -1 };
      break;
    case "popular":
      sort = { totalBookings: -1 };
      break;
    default:
      sort = { starRating: -1, minPricePerNight: 1 };
  }

  const cacheKeyPayload = {
    destination: typeof destination === "string" ? destination.trim().toLowerCase() : undefined,
    adultCount: query.adultCount,
    childCount: query.childCount,
    facilityFilters,
    typeFilters,
    starFilters,
    tagFilters,
    amenityFilters,
    priceConditions,
    sort,
    pageNumber,
    pageSize,
    checkIn,
    checkOut,
    featured: query.isFeatured,
  };

  const cacheEligible = !(checkIn && checkOut);
  const cacheKey = cacheEligible ? stableKey(cacheKeyPayload as Record<string, unknown>) : undefined;
  const cached = cacheEligible && cacheKey ? getCached(cacheKey) : undefined;
  if (cached) {
    res.setHeader("x-cache", "HIT");
    return res.json({ ...cached, meta: { ...(cached.meta || {}), servedFromCache: true } });
  }

  let unavailableHotelIds: string[] = [];
  let maintenanceBlocked: string[] = [];
  let bookingBlocked: string[] = [];
  if (checkIn && checkOut) {
    const ci = new Date(String(checkIn));
    const co = new Date(String(checkOut));
    if (!isNaN(ci.getTime()) && !isNaN(co.getTime()) && ci < co) {
      const bookingQuery: Record<string, unknown> = {
        status: { $in: ["pending", "confirmed"] },
        checkIn: { $lt: co },
        checkOut: { $gt: ci },
      };
      if (roomTypeId) {
        bookingQuery["rooms.roomType"] = roomTypeId;
      }
      [bookingBlocked, maintenanceBlocked] = await Promise.all([
        Booking.distinct("hotelId", bookingQuery) as Promise<string[]>,
        Maintenance.distinct("hotelId", {
          startDate: { $lt: co },
          endDate: { $gt: ci },
        }) as Promise<string[]>,
      ]);
      unavailableHotelIds = [...new Set([...(bookingBlocked || []), ...(maintenanceBlocked || [])])];
      if (unavailableHotelIds.length) {
        query._id = { $nin: unavailableHotelIds.map((id) => new mongoosePkg.Types.ObjectId(id)) };
      }
    }
  }

  const facetsPromise = Hotel.aggregate([
    { $match: query },
    {
      $facet: {
        starBuckets: [{ $group: { _id: "$starRating", count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        typeBuckets: [
          { $unwind: { path: "$type", preserveNullAndEmptyArrays: false } },
          { $group: { _id: "$type", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        priceRange: [{ $group: { _id: null, min: { $min: "$minPricePerNight" }, max: { $max: "$minPricePerNight" } } }],
      },
    },
  ]).then((result: any[]) => {
    const [facets] = result;
    return {
      stars: facets?.starBuckets || [],
      types: facets?.typeBuckets || [],
      priceRange: facets?.priceRange?.[0] || { min: null, max: null },
    };
  });

  const [data, total, facets] = await Promise.all([
    Hotel.find(query).sort(sort).skip(skip).limit(pageSize).lean(),
    Hotel.countDocuments(query),
    facetsPromise,
  ]);

  // TODO: Make room capacity configurable
  const adultsPerRoom = 2;
  const childrenPerRoom = 1;
  const numAdults = Number(adultCount) || 0;
  const numChildren = Number(childCount) || 0;
  const requiredRooms = Math.ceil(numAdults / adultsPerRoom) + Math.ceil(numChildren / childrenPerRoom);

  const filteredData = data.filter((hotel) => {
    // @ts-ignore
    const totalRooms = (hotel.roomTypes || []).reduce((acc, roomType) => {
      // @ts-ignore
      return acc + (roomType?.rooms?.length || 0);
    }, 0);
    return totalRooms >= requiredRooms;
  });

  const response = {
    data: filteredData,
    pagination: { total, page: pageNumber, pages: Math.ceil(total / pageSize), pageSize },
    facets,
    availability: {
      requestedWindow: checkIn && checkOut ? { checkIn, checkOut } : null,
      excludedHotelCount: unavailableHotelIds.length,
      maintenanceBlocked: maintenanceBlocked.length,
      bookingBlocked: bookingBlocked.length,
    },
    meta: {
      durationMs: Date.now() - start,
      servedFromCache: false,
    },
  };

  if (cacheEligible && cacheKey) {
    setCache(cacheKey, response);
    res.setHeader("x-cache", "MISS");
  } else {
    res.setHeader("x-cache", "SKIP");
  }
  res.json(response);
};