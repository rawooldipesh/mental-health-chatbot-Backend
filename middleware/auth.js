// middleware/auth.js
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and exclude password
    const user = await User.findById(payload.sub).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token or user not found" });
    }

    // Attach user to request for later use
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
