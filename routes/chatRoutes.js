// backend/routes/chatRoutes.js
import express from "express";
import OpenAI from "openai";

const router = express.Router();

// setup openai client with API key from .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/chat/send
router.post("/send", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Message required" });
    }

    console.log("User message:", message);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });

    const reply = completion.choices[0]?.message?.content || "⚠️ No reply from AI";

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err.response?.data || err.message);
    res.status(500).json({ message: err.message || "Chat failed" });
  }
});

export default router;
