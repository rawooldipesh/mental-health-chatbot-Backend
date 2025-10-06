import Message from "../models/Message.js";
import Summary from "../models/Summary.js";
import OpenAI from "openai";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.warn("OPENAI_API_KEY not set — summarizer will fail until it's configured.");
}

// Use v4 style
const openai = new OpenAI({ apiKey: OPENAI_KEY });

/**
 * Build a plain text snapshot from messages array
 */
function buildSnapshot(messages = [], maxChars = 3000) {
  const lines = messages.map(m =>
    `${m.role === "user" ? "User" : m.role === "assistant" ? "Assistant" : "System"}: ${m.content}`
  );
  let joined = lines.join("\n");
  if (joined.length > maxChars) {
    joined = joined.slice(joined.length - maxChars);
    joined = "...(truncated)...\n" + joined;
  }
  return joined;
}

/**
 * Create or update a rolling summary for a user.
 */
export async function createOrUpdateSummary(userId, options = {}) {
  const { messageLimit = 200 } = options;
  if (!userId) throw new Error("userId required");

  const recent = await Message.getRecentForUser(userId, messageLimit);
  if (!recent || recent.length === 0) return null;

  const snapshot = buildSnapshot(
    recent.map(m => ({
      role: m.role || (m.sender === "bot" ? "assistant" : "user"),
      content: m.content,
    })),
    3000
  );

  const prompt = `You are a concise summarizer. Given the user's past chat history below, extract persistent personal facts, recurring topics, preferences, and anything that may help the assistant in future conversations. Keep it short and factual: 2-4 sentences. Avoid revealing or inventing sensitive PII.\n\n${snapshot}`;

  let summaryText = "";
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini", // same model as chatRoutes
      messages: [
        { role: "system", content: "You summarize user chat histories concisely." },
        { role: "user", content: prompt },
      ],
      max_tokens: 220,
      temperature: 0.0,
    });

    summaryText = resp.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.error("Summarization failed:", err?.response?.data || err.message || err);
    throw err;
  }

  const doc = await Summary.findOneAndUpdate(
    { user: userId },
    { text: summaryText, updatedAt: new Date(), $inc: { "meta.messageCount": recent.length } },
    { upsert: true, new: true }
  );

  return doc;
}

/**
 * Convenience getter
 */
export async function getSummaryForUser(userId) {
  if (!userId) return null;
  return Summary.findOne({ user: userId }).lean();
}
