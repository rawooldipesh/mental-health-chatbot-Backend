import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true, // we query by user often for summarization
    },

    // OpenAI-like role: user / assistant / system
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },

    // Who sent it in your app (could be user id, "bot", "system" etc.)
    sender: {
      type: String,
      required: true,
    },

    // actual message text
    content: { type: String, required: true, trim: true },

    // Optional fields for NLP later:
    sentiment: { type: String, enum: ["pos", "neu", "neg"], default: "neu" },
    categories: [{ type: String, trim: true }], // e.g., ["depression","anxiety"]
    scores: {
      depression: { type: Number, min: 0, max: 100 },
      stress: { type: Number, min: 0, max: 100 },
      anxiety: { type: Number, min: 0, max: 100 },
    },
  },
  { timestamps: true }
);

// Indexes for faster retrieval (sessions + user queries)
messageSchema.index({ session: 1, createdAt: 1 });
messageSchema.index({ user: 1, createdAt: -1 });

// Helper for quick tagging
messageSchema.methods.addCategory = function (category) {
  if (!this.categories.includes(category)) {
    this.categories.push(category);
  }
  return this.save();
};

// Static utility: get last N messages for a user across sessions (for summarizer)
messageSchema.statics.getRecentForUser = async function (userId, limit = 50) {
  // returns messages in chronological order
  const docs = await this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.reverse();
};

// Convenient JSON transform
messageSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Message = mongoose.model("Message", messageSchema);
export default Message;
