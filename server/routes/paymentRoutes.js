const express = require("express");
const { createPayment, vnpayReturn } = require("../controllers/paymentController");

const router = express.Router();

/**
 * @route   POST /api/payment/create
 * @desc    Tạo thanh toán VNPay hoặc COD
 */
router.post("/create", createPayment);

/**
 * @route   GET /api/payment/vnpay_return
 * @desc    Callback từ VNPay sau khi thanh toán
 * @note    VNPay sẽ gọi route này với query params, cần xác thực chữ ký
 */
router.get("/vnpay_return", vnpayReturn);

module.exports = router;
