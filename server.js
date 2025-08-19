import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/sessions.js";
import messageRoutes from "./routes/messages.js";
import { auth } from "./middleware/auth.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();

// Middlewares
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: "*", // For dev. Lock down later: ["http://localhost:19006", "http://<your-lan-ip>:19006"]
    credentials: false,
  })
);
app.use(morgan("dev"));

// Routes
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/sessions", auth, sessionRoutes);
app.use("/api/messages", auth, messageRoutes);
app.use("/api/chat", chatRoutes);

// Start server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});
