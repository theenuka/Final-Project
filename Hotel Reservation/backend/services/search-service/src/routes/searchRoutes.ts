import express from "express";
import { searchHotels } from "../controllers/searchController";

const router = express.Router();

router.get("/hotels/search", searchHotels);

export default router;
