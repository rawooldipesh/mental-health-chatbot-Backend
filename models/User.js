// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Mood subdocument schema (embedded inside User)
 * - date stored as YYYY-MM-DD string
 * - sentiment normalized between -1..1
 */
const MoodSubSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    mood: { type: String, required: true, enum: ["great", "good", "neutral", "low", "down"] },
    note: { type: String, default: "" },
    sentiment: { type: Number, default: 0 }, // -1..1
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },

    memoryEnabled: { type: Boolean, default: true },

    // Embedded user-specific moods
    moods: { type: [MoodSubSchema], default: [] },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

/**
 * Instance helper method:
 * Upsert a mood entry by date inside user's moods array.
 * Usage:
 *   await user.upsertMood({ date, mood, note, sentiment });
 */
userSchema.methods.upsertMood = async function ({ date, mood, note = "", sentiment = 0 }) {
  const idx = this.moods.findIndex((m) => m.date === date);
  const newEntry = { date, mood, note, sentiment, createdAt: new Date() };

  if (idx >= 0) {
    this.moods[idx] = { ...this.moods[idx]._doc, ...newEntry };
  } else {
    this.moods.push(newEntry);
  }

  await this.save();
  return this.moods.find((m) => m.date === date);
};

// Hide sensitive fields
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
