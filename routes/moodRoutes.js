// routes/moodRoutes.js
import express from "express";
import {
  getMoods,
  getMoodByDate,
  upsertMood,
  deleteMoodByDate,
} from "../controllers/moodController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.get("/", auth, getMoods);
router.get("/:date", auth, getMoodByDate);
router.post("/", auth, upsertMood);
router.delete("/:date", auth, deleteMoodByDate);

export default router;
