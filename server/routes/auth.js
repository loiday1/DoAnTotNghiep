require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// =================== REGISTER ===================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone)
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email đã tồn tại" });

    const newUser = new User({ name, email, password, phone, provider: "local" });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ message: "Đăng ký thành công", user: newUser, token });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// =================== LOGIN ===================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

    if (user.provider !== "local")
      return res
        .status(400)
        .json({ message: `Vui lòng đăng nhập bằng ${user.provider}` });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ message: "Đăng nhập thành công", user, token });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// =================== GOOGLE LOGIN ===================
router.post("/oauth-login", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Thiếu token Google" });

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: providerId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ name, email, provider: "google", providerId });
      await user.save();
    } else if (user.provider !== "google") {
      // Nếu trước đó là local, cập nhật provider sang google
      user.provider = "google";
      user.providerId = providerId;
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ message: "Đăng nhập Google thành công", user, token: jwtToken });
  } catch (err) {
    res.status(500).json({ message: "OAuth login thất bại", error: err.message });
  }
});

// =================== VERIFY TOKEN ===================
router.get("/verify-token", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Không có token" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Token không hợp lệ" });

    res.status(200).json({ user });
  } catch (err) {
    res.status(401).json({ message: "Token không hợp lệ", error: err.message });
  }
});

module.exports = router;
