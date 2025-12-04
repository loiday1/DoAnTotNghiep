const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
      image: String,
      productId: { type: String, default: null }, // ID sản phẩm để review
    },
  ],
  info: {
    fullName: String,
    phone: String,
    address: String,
    note: String,
  },
  subtotal: { type: Number, default: 0 }, // Tổng tiền trước khi giảm giá và phí ship
  shippingFee: { type: Number, default: 0 }, // Phí vận chuyển
  totalPrice: Number,
  method: String, // "cod", "paypal", "momo"
  promoCode: { type: String, default: null }, // Mã khuyến mãi đã sử dụng
  discountAmount: { type: Number, default: 0 }, // Số tiền giảm giá
  status: { type: String, default: "Đang xử lý" },
  paymentStatus: { type: String, default: "unpaid" }, // "paid", "unpaid", "failed"
  paypalOrderId: { type: String, default: null }, // PayPal Order ID
  paypalTransactionId: { type: String, default: null }, // PayPal Transaction ID
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
