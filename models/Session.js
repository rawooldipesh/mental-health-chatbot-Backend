import mongoose from "mongoose";

const moodSchema = new mongoose.Schema(
  {
    depression: { type: Number, min: 0, max: 100, default: 0 },
    stress: { type: Number, min: 0, max: 100, default: 0 },
    anxiety: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    initialScores: { type: moodSchema, default: () => ({}) },
    finalScores: { type: moodSchema, default: () => ({}) },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Session = mongoose.model("Session", sessionSchema);
