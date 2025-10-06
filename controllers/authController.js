// controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Register
export const registerUser = async (req, res) => {
  try {
    // accept either `name` or `username` from client
    const { name, username, email, password } = req.body;
    const displayName = name || username;

    if (!email || !password || !displayName) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    // check if user already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    // create new user — do NOT hash here; the model's pre('save') will hash
    const newUser = new User({ name: displayName, email, password });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("registerUser error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Invalid credentials" });

    // find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // generate token — put user id into `sub` so auth middleware expecting payload.sub works
    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("loginUser error:", err);
    res.status(500).json({ message: err.message });
  }
};
