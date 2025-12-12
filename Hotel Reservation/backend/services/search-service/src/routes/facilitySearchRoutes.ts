import express from "express";
import { searchFacilities } from "../controllers/facilitySearchController";

const router = express.Router();

router.get("/facilities/search", searchFacilities);

export default router;
