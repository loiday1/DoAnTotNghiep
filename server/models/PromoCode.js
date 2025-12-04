const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"], // percentage: giảm %, fixed: giảm số tiền cố định
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0, // Đơn hàng tối thiểu để áp dụng mã
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // Giảm giá tối đa (cho percentage)
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null, // null = không giới hạn số lần sử dụng
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableUsers: {
      type: [String], // Array of user IDs, empty = áp dụng cho tất cả
      default: [],
    },
  },
  { timestamps: true }
);

// Index để tìm kiếm nhanh
promoCodeSchema.index({ code: 1, isActive: 1 });

module.exports = mongoose.model("PromoCode", promoCodeSchema);

