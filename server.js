import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import sessionRoutes from "./routes/sessions.js";
import messageRoutes from "./routes/messages.js";
import chatRoutes from "./routes/chatRoutes.js";

// Middleware
import {auth}  from "./middleware/auth.js";

const app = express();

/* -------------------------------
   Global Middlewares
--------------------------------*/
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*", // configurable origins
    credentials: true, // usually better to keep credentials true for auth flows
  })
);
app.use(morgan("dev"));

/* -------------------------------
   Health Check
--------------------------------*/
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, timestamp: new Date().toISOString() })
);

/* -------------------------------
   API Routes
--------------------------------*/
app.use("/api/auth", authRoutes);
app.use("/api/sessions", auth, sessionRoutes);
app.use("/api/messages", auth, messageRoutes);
app.use("/api/chat", auth, chatRoutes); // 🔒 protected (better to enforce login)

/* -------------------------------
   Database + Server Init
--------------------------------*/
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`✅ API running at: http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Failed to connect DB:", err.message);
    process.exit(1); // crash on DB failure
  });
