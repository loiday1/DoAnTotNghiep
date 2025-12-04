const express = require("express");
const router = express.Router();
const { createOrder, getUserOrders, getOrderDetail, updateOrderStatus, cancelOrder } = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");

// ===== Tạo đơn hàng mới =====
// Route POST /api/orders (từ CheckoutPage) - PHẢI ĐẶT TRƯỚC route GET /:userId
router.post("/", (req, res, next) => {
  console.log("📥 [OrderRoutes] POST /api/orders called");
  next();
}, createOrder);

// Route POST /api/orders/create (tương thích ngược)
router.post("/create", createOrder);

// ===== Lấy chi tiết đơn hàng =====
// Route này phải đặt TRƯỚC route GET /:userId để tránh conflict
router.get("/detail/:orderId", getOrderDetail);

// ===== Lấy danh sách đơn hàng của user =====
// Route /user/:userId (tương thích với frontend cũ)
router.get("/user/:userId", getUserOrders);

// ===== Cập nhật trạng thái đơn hàng (admin) =====
router.put("/:orderId/status", updateOrderStatus);

// ===== Hủy đơn hàng (khách hàng) =====
// ✅ SECURITY FIX: Thêm verifyToken middleware để lấy userId từ JWT
router.post("/:orderId/cancel", verifyToken, cancelOrder);

// ===== Lấy danh sách đơn hàng của user (route ngắn) =====
// Route này phải đặt CUỐI CÙNG vì nó match mọi GET request
router.get("/:userId", getUserOrders);

module.exports = router;
