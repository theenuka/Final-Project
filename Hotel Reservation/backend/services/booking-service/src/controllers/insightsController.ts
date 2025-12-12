import { Request, Response } from "express";
import mongoose from "mongoose";
import Booking from "../models/booking";
import mongoosePkg from "mongoose";

const HotelModel =
  mongoosePkg.models.Hotel ||
  mongoosePkg.model("Hotel", new mongoosePkg.Schema({}, { strict: false }), "hotels");

const buildDailyBookingSeries = async (days = 14) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const rows = await Booking.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        bookings: { $sum: 1 },
        revenue: { $sum: "$totalCost" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const map = new Map(rows.map((row) => [row._id, row]));
  return Array.from({ length: days }).map((_, idx) => {
    const day = new Date(start);
    day.setDate(start.getDate() + idx);
    const key = day.toISOString().slice(0, 10);
    const row = map.get(key);
    return {
      date: day.toISOString(),
      bookings: row?.bookings || 0,
      revenue: row?.revenue || 0,
    };
  });
};

const buildWeeklySeries = async (weeks = 8) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - weeks * 7);
  const rows = await Booking.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          week: { $dateToString: { format: "%G-%V", date: "$createdAt" } },
          start: {
            $dateTrunc: { date: "$createdAt", unit: "week", binSize: 1, timezone: "UTC" },
          },
        },
        bookings: { $sum: 1 },
        revenue: { $sum: "$totalCost" },
      },
    },
    { $sort: { "_id.start": 1 } },
  ]);
  return rows.map((row) => ({
    week: new Date(row._id.start).toISOString(),
    bookings: row.bookings,
    revenue: row.revenue,
  }));
};

export const getDashboardInsights = async (_req: Request, res: Response) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [totalBookings, recentBookings, totalRevenueAgg, recentRevenueAgg, totalHotels, distinctUsers] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Booking.aggregate([{ $group: { _id: null, total: { $sum: "$totalCost" } } }]),
    Booking.aggregate([{ $match: { createdAt: { $gte: sevenDaysAgo } } }, { $group: { _id: null, total: { $sum: "$totalCost" } } }]),
    HotelModel.countDocuments(),
    Booking.distinct("userId"),
  ]);

  const popularity = await Booking.aggregate([
    {
      $group: {
        _id: "$hotelId",
        bookingCount: { $sum: 1 },
        avgPrice: { $avg: "$totalCost" },
        totalRevenue: { $sum: "$totalCost" },
        avgNights: {
          $avg: {
            $divide: [{ $subtract: ["$checkOut", "$checkIn"] }, 1000 * 60 * 60 * 24],
          },
        },
      },
    },
    { $sort: { bookingCount: -1 } },
    { $limit: 10 },
  ]);
  const hotelMapIds = popularity.map((p) => p._id);
  const hotels = hotelMapIds.length
    ? await HotelModel.find({ _id: { $in: hotelMapIds.map((id: string) => new mongoosePkg.Types.ObjectId(id)) } })
        .select("name city country pricePerNight starRating type")
        .lean()
    : [];
  const hotelInfo = new Map(hotels.map((h: any) => [String(h._id), h]));
  const popularDestinations = popularity.slice(0, 5).map((entry) => {
    const hotel = hotelInfo.get(entry._id) as any;
    return {
      hotelId: entry._id,
      name: hotel?.name,
      city: hotel?.city,
      country: hotel?.country,
      bookingCount: entry.bookingCount,
      avgPrice: Math.round(entry.avgPrice || 0),
      totalRevenue: Math.round(entry.totalRevenue || 0),
    };
  });

  const hotelPerformance = popularity.map((entry) => {
    const hotel = hotelInfo.get(entry._id) as any;
    return {
      hotelId: entry._id,
      name: hotel?.name || "Unknown Hotel",
      city: hotel?.city,
      starRating: hotel?.starRating,
      pricePerNight: hotel?.pricePerNight,
      bookingCount: entry.bookingCount,
      totalRevenue: Math.round(entry.totalRevenue || 0),
      avgStayLength: Number(entry.avgNights?.toFixed?.(1) || entry.avgNights || 0),
    };
  });

  const overview = {
    totalHotels,
    totalUsers: Array.isArray(distinctUsers) ? distinctUsers.length : 0,
    totalBookings,
    recentBookings,
    totalRevenue: totalRevenueAgg[0]?.total || 0,
    recentRevenue: recentRevenueAgg[0]?.total || 0,
    revenueGrowth: recentRevenueAgg[0]?.total && totalRevenueAgg[0]?.total
      ? Number(((recentRevenueAgg[0].total / (totalRevenueAgg[0].total || 1)) * 100).toFixed(2))
      : 0,
  };

  const dailyBookings = await buildDailyBookingSeries(14);

  res.json({
    overview,
    popularDestinations,
    dailyBookings,
    hotelPerformance,
    lastUpdated: new Date().toISOString(),
  });
};

export const getForecastInsights = async (_req: Request, res: Response) => {
  const historical = await buildWeeklySeries(8);
  const totalHistoricalRevenue = historical.reduce((sum, row) => sum + row.revenue, 0);
  const totalHistoricalBookings = historical.reduce((sum, row) => sum + row.bookings, 0);
  const avgRevenuePerBooking = totalHistoricalBookings ? totalHistoricalRevenue / totalHistoricalBookings : 0;
  const growthRates = historical.slice(1).map((row, idx) => row.bookings - historical[idx].bookings);
  const avgGrowth = growthRates.length
    ? growthRates.reduce((sum, val) => sum + val, 0) / growthRates.length
    : 0;
  const lastWeekBookings = historical[historical.length - 1]?.bookings || 0;

  const forecasts = Array.from({ length: 8 }).map((_, i) => {
    const projectedBookings = Math.max(0, Math.round(lastWeekBookings + (i + 1) * avgGrowth));
    return {
      week: new Date(Date.now() + (i + 1) * 7 * 24 * 3600 * 1000).toISOString(),
      bookings: projectedBookings,
      revenue: Math.round(projectedBookings * avgRevenuePerBooking),
      confidence: Math.min(0.9, 0.65 + i * 0.03),
    };
  });

  res.json({
    historical,
    forecasts,
    seasonalGrowth: Number((avgGrowth || 0).toFixed(2)),
    trends: {
      bookingTrend: avgGrowth >= 0 ? "increasing" : "decreasing",
      revenueTrend: avgGrowth >= 0 ? "increasing" : "flat",
    },
    lastUpdated: new Date().toISOString(),
  });
};

export const getPerformanceInsights = async (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const totalBookings = await Booking.countDocuments();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayBookings = await Booking.countDocuments({ createdAt: { $gte: todayStart } });
  const pendingBookings = await Booking.countDocuments({ status: "pending" });
  const totalRevenueAgg = await Booking.aggregate([{ $group: { _id: null, total: { $sum: "$totalCost" } } }]);
  const avgStayAgg = await Booking.aggregate([
    {
      $group: {
        _id: null,
        avgStay: {
          $avg: { $divide: [{ $subtract: ["$checkOut", "$checkIn"] }, 1000 * 60 * 60 * 24] },
        },
      },
    },
  ]);

  const uptimeSeconds = process.uptime();
  const cpuUsage = process.cpuUsage();
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekBookings = await Booking.countDocuments({ createdAt: { $gte: weekStart } });

  res.json({
    system: {
      memory: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        utilization: Number(((mem.heapUsed / mem.heapTotal) * 100).toFixed(2)),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptimeSeconds,
    },
    database: {
      collections: mongoose.connection.db ? (await mongoose.connection.db.listCollections().toArray()).length : 0,
      totalBookings,
      totalRevenue: totalRevenueAgg[0]?.total || 0,
      avgStayLength: Number(avgStayAgg[0]?.avgStay?.toFixed?.(1) || 0),
    },
    application: {
      pendingBookings,
      todayBookings,
      thisWeekBookings: weekBookings,
      errorRate: 0.0,
      avgResponseTime: 95,
      requestsPerMinute: 220,
    },
    lastUpdated: new Date().toISOString(),
  });
};
