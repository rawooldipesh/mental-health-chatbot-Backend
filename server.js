// server.js
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
import { auth } from "./middleware/auth.js";
import moodRoutes from "./routes/moodRoutes.js";


const app = express();

app.disable("etag");
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Vary", "Authorization");
  next();
});
// ---------------------- Middlewares ----------------------
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ---------------------- CORS ----------------------
const rawCors = process.env.CORS_ORIGIN || "";
const whitelist = rawCors.split(",").map((s) => s.trim()).filter(Boolean);

if (process.env.NODE_ENV !== "production") {
  const devOrigins = [
    "http://localhost:8082",
    "http://localhost:3000",
    "http://127.0.0.1:8082",
    "http://192.168.1.9:8081",
  ];
  devOrigins.forEach((o) => {
    if (!whitelist.includes(o)) whitelist.push(o);
  });
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (whitelist.length === 0 && process.env.NODE_ENV === "production") {
        return callback(new Error("CORS: No allowed origins configured"), false);
      }
      if (whitelist.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error("CORS: Origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.use(morgan("dev"));



// ---------------------- Routes ----------------------
app.use("/api/auth", authRoutes);


app.use("/api/moods", moodRoutes);

// Apply `auth` globally to protect internal APIs
app.use("/api/sessions", auth, sessionRoutes);
app.use("/api/messages", auth, messageRoutes);
app.use("/api/chat", auth, chatRoutes);


// ---------------------- Error Handler ----------------------
app.use((err, _req, res, _next) => {
  console.error("Unhandled error: ", err?.message || err);
  const status = err?.status || 500;
  res.status(status).json({
    error: true,
    message: err?.message || "Internal server error",
  });
});

// ---------------------- DB + Server Init ----------------------
const PORT = process.env.PORT || 5000;

if (!process.env.OPENAI_API_KEY) {
  console.warn("Warning: OPENAI_API_KEY not set. Chat features will fail until configured.");
}

connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`✅ API running at: http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Failed to connect DB:", err.message);
    process.exit(1);
  });
