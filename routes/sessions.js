// routes/sessions.js
import express from "express";
import { z } from "zod";
import { Session } from "../models/Session.js";
import { Message } from "../models/Message.js"; // so we can include messages later
import {auth} from "../middleware/auth.js"; // ✅ ensure user is attached

const router = express.Router();

// ✅ Validation Schemas
const startSchema = z.object({
  initialScores: z
    .object({
      depression: z.number().min(0).max(100).optional(),
      stress: z.number().min(0).max(100).optional(),
      anxiety: z.number().min(0).max(100).optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
});

const endSchema = z.object({
  finalScores: z.object({
    depression: z.number().min(0).max(100).optional(),
    stress: z.number().min(0).max(100).optional(),
    anxiety: z.number().min(0).max(100).optional(),
  }),
});

// ✅ Start new session
router.post("/", auth, async (req, res) => {
  try {
    const data = startSchema.parse(req.body || {});
    const session = await Session.create({
      user: req.user._id,
      ...data,
    });
    return res.status(201).json({ sessionId: session._id });
  } catch (err) {
    if (err?.issues) {
      return res.status(400).json({ message: "Validation failed", errors: err.issues });
    }
    console.error("Error starting session:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ List user’s sessions
router.get("/", auth, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(sessions);
  } catch (err) {
    console.error("Error fetching sessions:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get single session + messages
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findOne({ _id: id, user: req.user._id }).lean();
    if (!session) return res.status(404).json({ message: "Session not found" });

    const messages = await Message.find({ session: id, user: req.user._id })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ ...session, messages });
  } catch (err) {
    console.error("Error fetching session:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ End session
router.patch("/:id/end", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = endSchema.parse(req.body);

    const session = await Session.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: { finalScores: data.finalScores, endedAt: new Date() } },
      { new: true }
    );

    if (!session) return res.status(404).json({ message: "Session not found" });
    return res.json(session);
  } catch (err) {
    if (err?.issues) {
      return res.status(400).json({ message: "Validation failed", errors: err.issues });
    }
    console.error("Error ending session:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
