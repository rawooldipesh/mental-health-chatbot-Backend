// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // default import

export const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
     console.log("DEBUG: Authorization header:", header);
    console.log("DEBUG: Extracted token:", token);
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Verify token (throws on invalid/expired). Optionally restrict algorithms:
    // const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
        console.log("DEBUG: JWT payload:", payload);

    // Accept either `sub` (recommended) or `id` (compat)
    const userId = payload && (payload.sub || payload.id);
        console.log("DEBUG: userId from payload:", userId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    const user = await User.findById(userId).select("-password");
        console.log("DEBUG: user found in DB:", user);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token or user not found" });
    }

    // Attach a minimal safe user object to request
   req.user = {
  _id: user._id,            // actual ObjectId for mongoose queries
  id: String(user._id),    // string alias (legacy)
  email: user.email,
  role: user.role,
};


    next();
  } catch (err) {
    // distinguish token errors optionally
    const message = err.name === "TokenExpiredError" ? "Token expired" : "Unauthorized";
    // helpful debug info in development only
    const errorDetail = process.env.NODE_ENV === "development" ? err.message : undefined;
    return res.status(401).json({
      success: false,
      message,
      error: errorDetail,
    });
  }
};
