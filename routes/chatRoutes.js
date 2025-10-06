import express from "express";
import OpenAI from "openai";
import { auth } from "../middleware/auth.js";
import { Session } from "../models/Session.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { getSummaryForUser, createOrUpdateSummary } from "../utils/summarizer.js";

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

    // Save USER message
    await Message.create({
      session: session._id,
      user: req.user._id,
      role: "user",
      sender: "user",
      content: message,
    });

    // Fetch user + check memoryEnabled
    const user = await User.findById(req.user._id);
    const memoryEnabled = user?.memoryEnabled ?? true;

    // Build OpenAI messages array
    const openaiMessages = [
      {
        role: "system",
        content:
          "You are EmpathAI, a supportive and empathetic mental health companion. " +
          "Always reply in a calm, understanding, and non-judgmental way. " +
          "Encourage positive coping strategies, active listening, and self-care. " +
          "If the user expresses thoughts of self-harm, encourage them to seek help from a trusted person or professional, and provide resources such as helpline numbers.",
      },
    ];

    if (memoryEnabled) {
      const summaryDoc = await getSummaryForUser(req.user._id);
      if (summaryDoc?.text) {
        openaiMessages.push({
          role: "system",
          content: `Summary of user's previous chats: ${summaryDoc.text}`,
        });
      }

      // include last 10 messages for recency context
      const recent = await Message.getRecentForUser(req.user._id, 10);
      for (const m of recent) {
        openaiMessages.push({ role: m.role, content: m.content });
      }
    }

    // Add the new user message
    openaiMessages.push({ role: "user", content: message });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      max_tokens: 800,
    });

    const reply =
      completion.choices?.[0]?.message?.content || "⚠️ No reply from AI";

    // Save ASSISTANT message
    await Message.create({
      session: session._id,
      user: req.user._id,
      role: "assistant",
      sender: "bot",
      content: reply,
    });

    // Periodically update summary (every 8 user messages)
    if (memoryEnabled) {
      const userMessageCount = await Message.countDocuments({
        user: req.user._id,
        role: "user",
      });
      if (userMessageCount % 8 === 0) {
        createOrUpdateSummary(req.user._id, { messageLimit: 200 }).catch((err) =>
          console.error("Summary update failed:", err.message)
        );
      }
    }

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

    const session = await Session.findOne({
      _id: sessionId,
      user: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const messages = await Message.find({
      session: sessionId,
      user: req.user._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    const out = messages.map(toClient);
    return res.json(out);
  } catch (err) {
    console.error("Error fetching chat history:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
