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
  emotion: z.string().optional(),   // e.g. "happy", "sad"
  sentiment: z.string().optional(), // e.g. "positive", "negative"
});

// ✅ Add new message
router.post("/", auth, async (req, res) => {
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

    // Map sender -> role
    const role = data.sender === "bot" ? "assistant" : "user";

    const message = await Message.create({
      session: session._id,
      user: req.user._id,
      role,
      sender: data.sender,
      content: data.text,
      sentiment: data.sentiment,
      // emotion not stored in schema currently; if needed, add field
    });

    return res.status(201).json(message.toJSON());
  } catch (err) {
    if (err?.issues) {
      return res.status(400).json({ message: err.issues[0].message });
    }
    console.error("Add message error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get messages of a session
router.get("/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: sessionId,
      user: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Important: query by `session` (not sessionId)
    const messages = await Message.find({
      session: session._id,
      user: req.user._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    // Map to client-friendly shape
    const out = messages.map((m) => ({
      id: m._id,
      sender: m.role === "assistant" ? "bot" : "user",
      text: m.content,
      createdAt: m.createdAt,
    }));

    return res.json(out);
  } catch (err) {
    console.error("Get messages error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
