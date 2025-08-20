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
      completion.choices[0]?.message?.content || "⚠️ No reply from AI";

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err.response?.data || err.message);
    res.status(500).json({ message: err.message || "Chat failed" });
  }
});

export default router;
