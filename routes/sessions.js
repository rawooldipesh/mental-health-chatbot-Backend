import express from "express";
import { z } from "zod";
import { Session } from "../models/Session.js";

const router = express.Router();

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

router.post("/", async (req, res) => {
  try {
    const data = startSchema.parse(req.body || {});
    const session = await Session.create({
      user: req.user._id,
      ...data,
    });
    res.status(201).json(session);
  } catch (err) {
    if (err?.issues) return res.status(400).json({ message: err.issues[0].message });
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  const sessions = await Session.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  res.json(sessions);
});

const endSchema = z.object({
  finalScores: z.object({
    depression: z.number().min(0).max(100).optional(),
    stress: z.number().min(0).max(100).optional(),
    anxiety: z.number().min(0).max(100).optional(),
  }),
});

router.patch("/:id/end", async (req, res) => {
  try {
    const { id } = req.params;
    const data = endSchema.parse(req.body);
    const session = await Session.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: { finalScores: data.finalScores, endedAt: new Date() } },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: "Not found" });
    res.json(session);
  } catch (err) {
    if (err?.issues) return res.status(400).json({ message: err.issues[0].message });
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
