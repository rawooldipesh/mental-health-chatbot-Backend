import express from "express";
import { z } from "zod";
import { Message } from "../models/Message.js";
import { Session } from "../models/Session.js";

const router = express.Router();

const createSchema = z.object({
  sessionId: z.string().min(1),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
  categories: z.array(z.string()).optional(),
  scores: z
    .object({
      depression: z.number().min(0).max(100).optional(),
      stress: z.number().min(0).max(100).optional(),
      anxiety: z.number().min(0).max(100).optional(),
    })
    .optional(),
  sentiment: z.enum(["pos", "neu", "neg"]).optional(),
});

router.post("/", async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const session = await Session.findOne({
      _id: data.sessionId,
      user: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const msg = await Message.create({
      session: data.sessionId,
      user: req.user._id,
      role: data.role,
      content: data.content,
      categories: data.categories,
      scores: data.scores,
      sentiment: data.sentiment,
    });

    res.status(201).json(msg);
  } catch (err) {
    if (err?.issues) return res.status(400).json({ message: err.issues[0].message });
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ message: "sessionId required" });

  const session = await Session.findOne({ _id: sessionId, user: req.user._id });
  if (!session) return res.status(404).json({ message: "Session not found" });

  const messages = await Message.find({ session: sessionId })
    .sort({ createdAt: 1 })
    .lean();
  res.json(messages);
});

export default router;
