// backend/routes/chatRoutes.js
import express from "express";
import OpenAI from "openai";
import { auth } from "../middleware/auth.js";
import { Session } from "../models/Session.js";
import { Message } from "../models/Message.js";

const router = express.Router();

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper: map DB message -> client shape your app expects
function toClient(m) {
  return {
    sender: m.role === "assistant" ? "bot" : "user",
    text: m.content,
    createdAt: m.createdAt,
  };
}

// POST /api/chat/send
router.post("/send", auth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res
        .status(400)
        .json({ message: "Message and sessionId are required" });
    }

    // Ensure the session exists and belongs to the current user
    const session = await Session.findOne({
      _id: sessionId,
      user: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // 1) Save USER message (explicit role mapping)
    await Message.create({
      session: session._id,
      user: req.user._id,
      role: "user",
      sender: "user",        

      content: message,
    });

    // 2) Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are EmpathAI, a supportive and empathetic mental health companion. " +
            "Always reply in a calm, understanding, and non-judgmental way. " +
            "Encourage positive coping strategies, active listening, and self-care. " +
            "If the user expresses thoughts of self-harm, encourage them to seek help from a trusted person or professional, and provide resources such as helpline numbers.",
        },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content || "⚠️ No reply from AI";

    // 3) Save ASSISTANT message
    await Message.create({
      session: session._id,
      user: req.user._id,
      role: "assistant",
      sender: "bot",
      content: reply,
    });

    // 4) Return reply
    return res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err.response?.data || err.message);
    return res.status(500).json({ message: err.message || "Chat failed" });
  }
});

// GET /api/chat/history/:sessionId
router.get("/history/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Ensure the session exists and belongs to the current user
    const session = await Session.findOne({
      _id: sessionId,
      user: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // IMPORTANT: query by `session` field, not `sessionId`
    const messages = await Message.find({
      session: sessionId,
      user: req.user._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    // Map to frontend-friendly shape
    const out = messages.map(toClient);
    return res.json(out);
  } catch (err) {
    console.error("Error fetching chat history:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
