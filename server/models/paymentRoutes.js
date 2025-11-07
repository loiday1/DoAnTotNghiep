const express = require("express");
const { createPayment, vnpayReturn } = require("../controllers/paymentController"); // import controller & callback

const router = express.Router();

/**
 * @route   POST /api/payment/create
 * @desc    Tạo thanh toán VNPay hoặc COD
 * @access  Public
 */
router.post("/create", createPayment);

/**
 * @route   GET /api/payment/vnpay_return
 * @desc    Callback từ VNPay sau khi thanh toán (sandbox/production)
 * @access  Public
 */
router.get("/vnpay_return", vnpayReturn);

module.exports = router;
