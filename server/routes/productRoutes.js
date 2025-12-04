require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();

// ===================== CORS =====================
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL
].filter(Boolean);

allowedOrigins.push(/^https:\/\/.+\.ngrok-free\.(app|dev)$/);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // cho phép Postman / curl
    const allowed = allowedOrigins.some(o =>
      typeof o === "string" ? o === origin : o.test(origin)
    );
    callback(allowed ? null : new Error("Not allowed by CORS"), allowed);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
};

router.use(cors(corsOptions));

// ===================== ROUTES =====================

/** 🟤 Lấy tất cả sản phẩm */
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.status(200).json(products);
  } catch (err) {
    console.error("❌ Lỗi lấy sản phẩm:", err);
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm", error: err.message });
  }
});

/** 🟠 Lấy sản phẩm theo category slug */
router.get("/products/category/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const products = await Product.find({ category: slug }).lean();
    res.status(200).json(products);
  } catch (err) {
    console.error("❌ Lỗi lấy sản phẩm theo category:", err);
    res.status(500).json({ message: "Lỗi khi lấy sản phẩm theo category", error: err.message });
  }
});

/** 🟢 Lấy chi tiết sản phẩm theo ID */
router.get("/products/detail/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📦 Fetching product: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    }

    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    res.status(200).json(product);
  } catch (err) {
    console.error("❌ Lỗi lấy chi tiết sản phẩm:", err);
    res.status(500).json({ message: "Lỗi server khi lấy chi tiết sản phẩm", error: err.message });
  }
});

/** 🔵 Tìm sản phẩm theo tên */
router.get("/products/search/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const products = await Product.find({ name: { $regex: name, $options: "i" } }).lean();

    const seen = new Set();
    const uniqueProducts = products.filter((p) => {
      if (seen.has(p._id.toString())) return false;
      seen.add(p._id.toString());
      return true;
    });

    if (!uniqueProducts.length)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm phù hợp" });

    res.status(200).json(uniqueProducts);
  } catch (err) {
    console.error("❌ Lỗi tìm sản phẩm theo tên:", err);
    res.status(500).json({ message: "Lỗi khi tìm sản phẩm theo tên", error: err.message });
  }
});

module.exports = router;
