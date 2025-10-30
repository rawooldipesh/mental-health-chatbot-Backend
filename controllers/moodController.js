// controllers/moodController.js
import { User } from "../models/User.js";
import mongoose from "mongoose";

/**
 * GET /api/moods
 */
export const getMoods = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("moods -_id").lean();
    return res.json({ moods: user?.moods || [] });
  } catch (err) {
    console.error("getMoods error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/moods/:date
 */
export const getMoodByDate = async (req, res) => {
  try {
    const { date } = req.params;
    if (!date) return res.status(400).json({ message: "date required" });

    console.log("Requesting mood for date:", date, "User ID:", req.user._id);  // Log request data

    const user = await User.findById(req.user._id).select("moods").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const entry = (user?.moods || []).find((m) => m.date === date);
    if (!entry) {
      console.log(`No mood found for date: ${date}`);
      //  return res.status(404).json();
    }

    console.log("Found mood for date:", entry);  // Log the found entry

    return res.json({ mood: entry });
  } catch (err) {
    console.error("getMoodByDate error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


/**
 * POST /api/moods
 * Body: { date: "YYYY-MM-DD", mood: "good", note?: string, sentiment?: number }
 * Uses User.upsertMood instance helper
 */
export const upsertMood = async (req, res) => {
  try {
    const { date, mood, note = "", sentiment = 0 } = req.body;
    if (!date || !mood) return res.status(400).json({ message: "date and mood required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updated = await user.upsertMood({ date, mood, note, sentiment });
    return res.json({ mood: updated });
  } catch (err) {
    console.error("upsertMood error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/moods/:date
 */
export const deleteMoodByDate = async (req, res) => {
  try {
    const { date } = req.params;
    if (!date) return res.status(400).json({ message: "date required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.moods = user.moods.filter((m) => m.date !== date);
    await user.save();
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteMoodByDate error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMoodSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    const summary = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$moods" },
      {
        $group: {
          _id: null,
          avgSentiment: { $avg: "$moods.sentiment" },
          totalEntries: { $sum: 1 },
          positive: { $sum: { $cond: [{ $gt: ["$moods.sentiment", 0] }, 1, 0] } },
          neutral: { $sum: { $cond: [{ $eq: ["$moods.sentiment", 0] }, 1, 0] } },
          negative: { $sum: { $cond: [{ $lt: ["$moods.sentiment", 0] }, 1, 0] } },
        },
      },
    ]);

    return res.json(
      summary[0] || {
        avgSentiment: 0,
        totalEntries: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
      }
    );
  } catch (err) {
    console.error("getMoodSummary error:", err);
    return res.status(500).json({ message: "Failed to generate mood summary" });
  }
};