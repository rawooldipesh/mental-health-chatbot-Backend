import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
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

export const Message = mongoose.model("Message", messageSchema);
