// routes/messages.js
import express from "express";
import { z } from "zod";
import { Message } from "../models/Message.js";
import { Session } from "../models/Session.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// ✅ Schema for validation
const messageSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  sender: z.enum(["user", "bot"]),
  text: z.string().min(1, "Message cannot be empty").max(2000),
  emotion: z.string().optional(), // e.g. "happy", "sad"
  sentiment: z.string().optional(), // e.g. "positive", "negative"
});

// ✅ Add new message
router.post("/",auth, async (req, res) => {
  try {
    const data = messageSchema.parse(req.body);

    // Ensure session exists & belongs to user
    const session = await Session.findOne({
      _id: data.sessionId,
      user: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const message = await Message.create({
      ...data,
      user: req.user._id,
    });

    return res.status(201).json(message);
  } catch (err) {
    if (err?.issues) return res.status(400).json({ message: err.issues[0].message });
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get messages of a session
router.get("/:sessionId",auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify session belongs to user
    const session = await Session.findOne({ _id: sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const messages = await Message.find({ sessionId, user: req.user._id })
      .sort({ createdAt: 1 })
      .lean();

    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
