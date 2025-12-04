require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { startAutoNgrok } = require("./utils/autoNgrok");

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================
// Import Routes
// ==========================
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");
const processingPublicRoutes = require("./routes/processingPublicRoutes");
const processingAdminRoutes = require("./routes/processingAdminRoutes");
const purchasePublicRoutes = require("./routes/purchasePublicRoutes");
const purchaseAdminRoutes = require("./routes/purchaseAdminRoutes");
const aiRoutes = require("./routes/aiRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const promoCodeRoutes = require("./routes/promoCodeRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

// ==========================
// Logging requests
// ==========================
app.use((req, res, next) => {
  console.log(
    `📥 [${new Date().toISOString()}] ${req.method} ${req.url} From: ${
      req.headers.origin || "Server"
    }`
  );
  // Log admin routes specifically
  if (req.url.startsWith('/api/admin')) {
    console.log(`🔍 [AdminRoute] ${req.method} ${req.url}`);
  }
  next();
});

// ==========================
// Body parser
// ==========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
// CORS toàn cục
// ==========================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL,
  /^http:\/\/localhost:\d+$/, // Cho phép tất cả localhost ports
  /^https:\/\/.+\.ngrok-free\.(app|dev)$/ // match any ngrok subdomain
].filter(Boolean);

// Helper function để check origin
const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return allowedOrigins.some(o =>
    o instanceof RegExp ? o.test(origin) : o === origin
  );
};

// ==========================
// Preflight OPTIONS handler - PHẢI ĐẶT TRƯỚC CORS
// ==========================
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    console.log(`🔄 [Preflight] OPTIONS request from: ${origin}`);
    
    if (isOriginAllowed(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours
      console.log(`✅ [Preflight] Allowed: ${origin}`);
      return res.sendStatus(200);
    } else {
      console.error(`❌ [Preflight] Blocked: ${origin}`);
      return res.sendStatus(403);
    }
  }
  next();
});

// CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.error(`❌ [CORS] Origin blocked: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "ngrok-skip-browser-warning"
    ],
    exposedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false, // Không tiếp tục sau preflight
    optionsSuccessStatus: 200 // Status code cho successful OPTIONS
  })
);

// ==========================
// Routes
// ==========================
app.get("/", (req, res) => res.send("✅ Server is running!"));

// Public
app.use("/api/public", publicRoutes);
app.use("/api/public/processings", processingPublicRoutes);
app.use("/api/public/purchases", purchasePublicRoutes);

// Auth
app.use("/api/auth", authRoutes);

// Admin
app.use("/api/admin/processings", processingAdminRoutes);
app.use("/api/admin/purchases", purchaseAdminRoutes);
app.use("/api/admin", (req, res, next) => {
  console.log(`🔐 [Server] Admin route: ${req.method} ${req.path}`);
  next();
}, adminRoutes);

// AI
app.use("/api/ai", aiRoutes);

// Payment
app.use("/api/payment", (req, res, next) => {
  console.log(`💳 [Payment Route] ${req.method} ${req.path}`);
  next();
}, paymentRoutes);

// Promo Code
app.use("/api/promo-code", promoCodeRoutes);

// Orders (COD)
app.use("/api/orders", (req, res, next) => {
  console.log(`📥 [Server] Order route: ${req.method} ${req.path}`);
  next();
}, orderRoutes);

// Reviews
app.use("/api/reviews", (req, res, next) => {
  console.log(`⭐ [Server] Review route: ${req.method} ${req.path}`);
  next();
}, reviewRoutes);

// ==========================
// 404 handler
// ==========================
app.use((req, res) => {
  console.log(`❌ [404] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "⚠️ Route không tồn tại", path: req.url, method: req.method });
});

// ==========================
// Error handler
// ==========================
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ message: "Lỗi server", error: err.message });
});

// ==========================
// MongoDB Connect + Start Server
// ==========================
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/TasteTheCoffee";

console.log(`🔌 Đang kết nối MongoDB: ${MONGO_URI.replace(/\/\/.*@/, "//***:***@")}`);

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout sau 5 giây
    socketTimeoutMS: 45000,
  })
  .then(async () => {
    console.log("✅ MongoDB connected successfully!");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Khởi động server
    app.listen(PORT, async () => {
      console.log(`🚀 Server running on port ${PORT}`);
      
      // Tự động khởi động ngrok sau khi server đã start
      // Chỉ chạy trong development mode
      if (process.env.NODE_ENV !== "production") {
        setTimeout(async () => {
          await startAutoNgrok(PORT);
        }, 1000); // Đợi 1 giây để server sẵn sàng
      }
    });
  })
  .catch(err => {
    console.error("\n❌ ========================================");
    console.error("❌ MongoDB Connection Failed!");
    console.error("❌ ========================================");
    console.error(`❌ Error: ${err.message}`);
    
    if (err.message.includes("ECONNREFUSED")) {
      console.error("\n⚠️  VẤN ĐỀ: MongoDB server không chạy hoặc không thể kết nối!");
      console.error("\n📝 CÁCH KHẮC PHỤC:");
      console.error("   1. Kiểm tra MongoDB đã được cài đặt chưa");
      console.error("   2. Khởi động MongoDB service:");
      console.error("      - Windows: net start MongoDB");
      console.error("      - Hoặc mở MongoDB Compass và kết nối");
      console.error("      - Hoặc chạy: mongod (nếu cài đặt thủ công)");
      console.error("   3. Kiểm tra MongoDB đang chạy trên port 27017");
      console.error("   4. Nếu dùng MongoDB Atlas, kiểm tra connection string trong .env");
      console.error(`\n🔗 Connection URI: ${MONGO_URI}`);
    } else if (err.message.includes("authentication failed")) {
      console.error("\n⚠️  VẤN ĐỀ: Xác thực MongoDB thất bại!");
      console.error("📝 Kiểm tra username/password trong connection string");
    } else if (err.message.includes("timeout")) {
      console.error("\n⚠️  VẤN ĐỀ: Kết nối MongoDB timeout!");
      console.error("📝 Kiểm tra network hoặc MongoDB server có đang chạy không");
    }
    
    console.error("\n❌ ========================================\n");
    process.exit(1);
  });
