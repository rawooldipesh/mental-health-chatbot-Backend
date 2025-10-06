// routes/authRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js"; // adjust path if needed

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h"; // configurable

// Simple token verification middleware (replace with your own if present)
export function verifyToken(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing auth token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // attach user info to request for downstream handlers
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// helper to create tokens
function createToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/** POST /auth/register */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // create user (password will be hashed by userSchema pre-save hook)
    const user = new User({ name, email, password });
    await user.save();

    // generate JWT
    const token = createToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, email: user.email, name: user.name, memoryEnabled: user.memoryEnabled ?? true },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/** POST /auth/login */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // compare password using schema method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // generate JWT
    const token = createToken(user);

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, email: user.email, name: user.name, memoryEnabled: user.memoryEnabled ?? true },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/** GET /auth/me — returns current user profile (auth required) */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -__v").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (err) {
    console.error("GET /me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/** PATCH /auth/me/memory — toggle memory on/off (auth required) */
router.patch("/me/memory", verifyToken, async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "enabled must be boolean" });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.memoryEnabled = enabled;
    await user.save();
    return res.json({ message: "Memory setting updated", memoryEnabled: user.memoryEnabled });
  } catch (err) {
    console.error("PATCH /me/memory error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
