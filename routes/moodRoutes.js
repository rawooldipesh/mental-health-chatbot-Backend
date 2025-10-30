import express from "express";
import {
  getMoods,
  getMoodByDate,
  upsertMood,
  deleteMoodByDate,
  getMoodSummary, // added
} from "../controllers/moodController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getMoods);
// ✅ Summary route uses controller
router.get("/summary/:userId", auth, getMoodSummary);

router.get("/:date", auth, getMoodByDate);
router.post("/", auth, upsertMood);
router.delete("/:date", auth, deleteMoodByDate);


export default router;
