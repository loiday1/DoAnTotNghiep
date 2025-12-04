require('dotenv').config();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// ✅ SECURITY FIX: Bắt buộc phải có JWT_SECRET trong .env
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ [SECURITY] JWT_SECRET is not set in .env file!");
  throw new Error("JWT_SECRET is required. Please set it in .env file.");
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  console.warn("⚠️ [AUTH] GOOGLE_CLIENT_ID is not set. Google OAuth will not work.");
}

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone)
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email đã tồn tại" });

    const newUser = new User({ name, email, password, phone, provider: 'local' });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: "Đăng ký thành công", user: newUser, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Lỗi server khi đăng ký", error: err.message });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });

    const user = await User.findOne({ email });
    if (!user || user.provider !== 'local')
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: "Đăng nhập thành công", user, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Lỗi server khi đăng nhập", error: err.message });
  }
};

// ================= GOOGLE LOGIN =================
exports.googleLogin = async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(500).json({ message: "Google OAuth chưa được cấu hình" });
    }
    
    const { token: googleToken } = req.body;
    if (!googleToken) return res.status(400).json({ message: "Thiếu token Google" });

    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, sub: providerId } = payload;
    if (!email) return res.status(400).json({ message: "Không lấy được email từ Google" });

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ name, email, provider: 'google', providerId });
      await user.save();
    } else if (user.provider !== 'google') {
      user.provider = 'google';
      user.providerId = providerId;
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: "Đăng nhập Google thành công", user, token: jwtToken });
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.status(500).json({ message: "OAuth login thất bại", error: err.message });
  }
};

// ================= VERIFY TOKEN =================
exports.verifyToken = async (req, res) => {
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
};
