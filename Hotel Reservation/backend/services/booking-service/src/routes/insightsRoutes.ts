import express from "express";
import {
  getDashboardInsights,
  getForecastInsights,
  getPerformanceInsights,
} from "../controllers/insightsController";

const router = express.Router();

router.get("/business-insights/dashboard", getDashboardInsights);
router.get("/business-insights/forecast", getForecastInsights);
router.get("/business-insights/performance", getPerformanceInsights);

export default router;
