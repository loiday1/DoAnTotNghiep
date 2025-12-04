const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

// ✅ SECURITY FIX: Bắt buộc phải có JWT_SECRET trong .env
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ [SECURITY] JWT_SECRET is not set in .env file!");
  throw new Error("JWT_SECRET is required. Please set it in .env file.");
}

// ✅ Xác thực token người dùng
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "❌ Không có token xác thực" });

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError")
        return res.status(401).json({ message: "⚠️ Token đã hết hạn" });
      return res.status(401).json({ message: "❌ Token không hợp lệ" });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user)
      return res.status(401).json({ message: "⚠️ Người dùng không tồn tại" });

    req.user = user; // gắn user vào request để controller sử dụng
    next();
  } catch (err) {
    console.error("Lỗi verifyToken:", err);
    res.status(500).json({ message: "❌ Lỗi server xác thực token" });
  }
};

// ✅ Kiểm tra quyền admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "🚫 Không có quyền truy cập" });
  next();
};

module.exports = { verifyToken, isAdmin };
