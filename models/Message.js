import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User"  },
    role: {
  type: String,
  enum: ["user", "assistant", "system"], // who is "talking" in AI sense
  required: true,
},
sender: {
  type: String, // or ObjectId if you want relation to User model
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
// Index for faster retrieval
// This will help when fetching messages for a session
messageSchema.index({ session: 1, createdAt: 1 }),


// Helper for quick tagging
messageSchema.methods.addCategory = function (category) {
  if (!this.categories.includes(category)) {
    this.categories.push(category);
  }
  return this.save();
};

export const Message = mongoose.model("Message", messageSchema);
