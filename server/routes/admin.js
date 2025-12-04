const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const { getAllOrders, updateOrderStatus, updateOrder, deleteOrder } = require("../controllers/orderController");
const { getAllPromoCodes, createPromoCode, updatePromoCode, deletePromoCode } = require("../controllers/promoCodeController");
const { getAllBlogsAdmin, createBlog, updateBlog, deleteBlog } = require("../controllers/blogController");
const { getRevenueStats, getRevenueStatsByMonth, getMonthlyRevenue } = require("../controllers/revenueController");
const { getAllReviews } = require("../controllers/reviewController");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

// Middleware kiểm tra admin
const verifyAdmin = async (req, res, next) => {
  try {
    console.log(`🔐 [verifyAdmin] Checking admin access for: ${req.method} ${req.path}`);
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.log("❌ [verifyAdmin] No token provided");
      return res.status(401).json({ message: "Thiếu token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin") {
      console.log(`❌ [verifyAdmin] User ${decoded.id} is not admin`);
      return res.status(403).json({ message: "Không có quyền" });
    }

    console.log(`✅ [verifyAdmin] Admin verified: ${user.email}`);
    req.user = user;
    next();
  } catch (err) {
    console.error(`❌ [verifyAdmin] Error:`, err.message);
    return res.status(403).json({ message: "Token không hợp lệ", error: err.message });
  }
};

// ================== USER ==================

// Lấy danh sách user
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy user", error: err.message });
  }
});

// Cập nhật user
router.patch("/users/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, phone, role },
      { new: true, runValidators: true, context: "query" }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "Người dùng không tồn tại" });

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi cập nhật user", error: err.message });
  }
});

// Xóa user
router.delete("/users/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra ObjectId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }

    // Không cho admin xóa chính mình
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: "Không thể xóa chính bạn!" });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) return res.status(404).json({ message: "Người dùng không tồn tại" });

    res.status(200).json({ message: "Xóa người dùng thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi xóa user", error: err.message });
  }
});

// ================== PRODUCT ==================

// Lấy danh sách sản phẩm
router.get("/products", verifyAdmin, async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm", error: err.message });
  }
});

// Thêm sản phẩm
router.post("/products", verifyAdmin, async (req, res) => {
  try {
    const { name, price, category, description, image, productCode, brand, weight } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    const newProduct = new Product({
      productCode,
      name,
      brand,
      price,
      description,
      category,
      weight,
      image,
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi thêm sản phẩm", error: err.message });
  }
});

// Cập nhật sản phẩm
router.patch("/products/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi cập nhật sản phẩm", error: err.message });
  }
});

// Xóa sản phẩm
router.delete("/products/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    res.status(200).json({ message: "Đã xóa sản phẩm thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi xóa sản phẩm", error: err.message });
  }
});

// ================== ORDERS ==================

// Lấy tất cả đơn hàng (admin) - PHẢI ĐẶT TRƯỚC route /orders/test để tránh conflict
router.get("/orders", verifyAdmin, getAllOrders);

// Test route để kiểm tra (đặt sau route chính)
router.get("/orders/test", (req, res) => {
  res.json({ message: "✅ Route /api/admin/orders/test works!" });
});

// Cập nhật trạng thái đơn hàng (admin) - Route cụ thể phải đặt trước
router.put("/orders/:id/status", verifyAdmin, (req, res, next) => {
  console.log(`📝 [AdminRoute] PUT /orders/${req.params.id}/status`);
  next();
}, updateOrderStatus);

// Xóa đơn hàng (admin) - Đặt trước PATCH để tránh conflict
router.delete("/orders/:id", verifyAdmin, (req, res, next) => {
  console.log(`🗑️ [AdminRoute] DELETE /orders/${req.params.id}`);
  next();
}, deleteOrder);

// Cập nhật thông tin đơn hàng (admin) - sửa items, info, totalPrice, etc.
router.patch("/orders/:id", verifyAdmin, (req, res, next) => {
  console.log(`✏️ [AdminRoute] PATCH /orders/${req.params.id}`);
  next();
}, updateOrder);

// ================== PROMO CODES ==================

// Lấy tất cả mã khuyến mãi (admin)
router.get("/promo-codes", verifyAdmin, (req, res, next) => {
  console.log("📋 [AdminRoute] GET /promo-codes");
  next();
}, getAllPromoCodes);

// Tạo mã khuyến mãi mới (admin)
router.post("/promo-codes", verifyAdmin, (req, res, next) => {
  console.log("➕ [AdminRoute] POST /promo-codes");
  next();
}, createPromoCode);

// Cập nhật mã khuyến mãi (admin)
router.patch("/promo-codes/:id", verifyAdmin, (req, res, next) => {
  console.log(`✏️ [AdminRoute] PATCH /promo-codes/${req.params.id}`);
  next();
}, updatePromoCode);

// Xóa mã khuyến mãi (admin)
router.delete("/promo-codes/:id", verifyAdmin, (req, res, next) => {
  console.log(`🗑️ [AdminRoute] DELETE /promo-codes/${req.params.id}`);
  next();
}, deletePromoCode);

// ================== BLOG ==================

// Lấy tất cả blog (admin)
router.get("/blogs", verifyAdmin, (req, res, next) => {
  console.log("📋 [AdminRoute] GET /blogs");
  next();
}, getAllBlogsAdmin);

// Tạo blog mới (admin)
router.post("/blogs", verifyAdmin, (req, res, next) => {
  console.log("➕ [AdminRoute] POST /blogs");
  next();
}, createBlog);

// Cập nhật blog (admin)
router.patch("/blogs/:id", verifyAdmin, (req, res, next) => {
  console.log(`✏️ [AdminRoute] PATCH /blogs/${req.params.id}`);
  next();
}, updateBlog);

// Xóa blog (admin)
router.delete("/blogs/:id", verifyAdmin, (req, res, next) => {
  console.log(`🗑️ [AdminRoute] DELETE /blogs/${req.params.id}`);
  next();
}, deleteBlog);

// ================== REVIEWS ==================

// Lấy tất cả reviews (admin)
router.get("/reviews", verifyAdmin, (req, res, next) => {
  console.log("⭐ [AdminRoute] GET /reviews");
  next();
}, getAllReviews);

// ================== REVENUE STATS ==================

// Lấy thống kê thu nhập (admin)
router.get("/revenue/stats", verifyAdmin, (req, res, next) => {
  console.log("📊 [AdminRoute] GET /revenue/stats");
  next();
}, getRevenueStats);

// Lấy thống kê theo tháng được chọn
router.get("/revenue/stats/month", verifyAdmin, (req, res, next) => {
  console.log("📊 [AdminRoute] GET /revenue/stats/month");
  next();
}, getRevenueStatsByMonth);

// Lấy doanh thu từng tháng trong năm
router.get("/revenue/monthly", verifyAdmin, (req, res, next) => {
  console.log("📊 [AdminRoute] GET /revenue/monthly");
  next();
}, getMonthlyRevenue);

module.exports = router;
