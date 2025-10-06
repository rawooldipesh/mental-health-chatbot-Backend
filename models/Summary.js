import mongoose from "mongoose";

const SummarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    text: { type: String, default: "" }, // rolling summary text
    updatedAt: { type: Date, default: Date.now },
    meta: {
      messageCount: { type: Number, default: 0 }, // optional tracking
    },
  },
  { timestamps: true }
);

export const Summary = mongoose.model("Summary", SummarySchema);
export default Summary;
