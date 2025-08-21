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
    isActive: { type: Boolean, default: true }, // useful for ongoing sessions

  },
  { timestamps: true }
);
// Auto-mark ended sessions
sessionSchema.methods.endSession = function (finalScores = {}) {
  this.endedAt = new Date();
  this.finalScores = { ...this.finalScores, ...finalScores };
  this.isActive = false;
  return this.save();
};

export const Session = mongoose.model("Session", sessionSchema);
