const PromoCode = require("../models/PromoCode");

// Validate và apply mã khuyến mãi
exports.validatePromoCode = async (req, res) => {
  try {
    const { code, totalAmount, userId } = req.body;

    if (!code || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Mã khuyến mãi và tổng tiền là bắt buộc",
      });
    }

    // Tìm mã khuyến mãi
    const promoCode = await PromoCode.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    });

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: "Mã khuyến mãi không tồn tại hoặc đã bị vô hiệu hóa",
      });
    }

    // Kiểm tra ngày hết hạn
    const now = new Date();
    if (now < promoCode.startDate || now > promoCode.endDate) {
      return res.status(400).json({
        success: false,
        message: "Mã khuyến mãi đã hết hạn hoặc chưa có hiệu lực",
      });
    }

    // Kiểm tra số lần sử dụng
    if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Mã khuyến mãi đã hết lượt sử dụng",
      });
    }

    // Kiểm tra đơn hàng tối thiểu
    if (totalAmount < promoCode.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu để áp dụng mã là ${promoCode.minOrderAmount.toLocaleString("vi-VN")}₫`,
      });
    }

    // Kiểm tra user có được phép sử dụng không
    if (
      promoCode.applicableUsers.length > 0 &&
      (!userId || !promoCode.applicableUsers.includes(userId))
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền sử dụng mã khuyến mãi này",
      });
    }

    // Tính toán discount
    let discountAmount = 0;
    if (promoCode.discountType === "percentage") {
      discountAmount = (totalAmount * promoCode.discountValue) / 100;
      // Áp dụng giới hạn giảm tối đa nếu có
      if (
        promoCode.maxDiscountAmount &&
        discountAmount > promoCode.maxDiscountAmount
      ) {
        discountAmount = promoCode.maxDiscountAmount;
      }
    } else {
      // fixed amount
      discountAmount = promoCode.discountValue;
    }

    // Đảm bảo discount không vượt quá tổng tiền
    if (discountAmount > totalAmount) {
      discountAmount = totalAmount;
    }

    const finalAmount = totalAmount - discountAmount;

    res.json({
      success: true,
      promoCode: {
        code: promoCode.code,
        description: promoCode.description,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
      },
      discountAmount,
      finalAmount,
    });
  } catch (err) {
    console.error("❌ Error validating promo code:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xác thực mã khuyến mãi",
      error: err.message,
    });
  }
};

// Tăng số lần sử dụng mã khuyến mãi
exports.incrementUsage = async (req, res) => {
  try {
    const { code } = req.body;
    const promoCode = await PromoCode.findOneAndUpdate(
      { code: code.toUpperCase().trim() },
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: "Mã khuyến mãi không tồn tại",
      });
    }

    res.json({ success: true, promoCode });
  } catch (err) {
    console.error("❌ Error incrementing promo code usage:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật số lần sử dụng",
      error: err.message,
    });
  }
};

// Lấy danh sách mã khuyến mãi đang active (public)
exports.getActivePromoCodes = async (req, res) => {
  try {
    const now = new Date();
    const promoCodes = await PromoCode.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(promoCodes);
  } catch (err) {
    console.error("❌ Error getting active promo codes:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách mã khuyến mãi",
      error: err.message,
    });
  }
};

// ================== ADMIN FUNCTIONS ==================

// Lấy tất cả mã khuyến mãi (admin)
exports.getAllPromoCodes = async (req, res) => {
  try {
    console.log("📋 [PromoCodeController] getAllPromoCodes called");
    const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
    console.log(`✅ [PromoCodeController] Found ${promoCodes.length} promo codes`);
    res.json(promoCodes);
  } catch (err) {
    console.error("❌ Error getting promo codes:", err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách mã khuyến mãi", error: err.message });
  }
};

// Tạo mã khuyến mãi mới (admin)
exports.createPromoCode = async (req, res) => {
  try {
    console.log("➕ [PromoCodeController] createPromoCode called");
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      isActive,
    } = req.body;

    // Validate
    if (!code || !discountType || !discountValue || !endDate) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    // Check duplicate
    const existing = await PromoCode.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "Mã khuyến mãi đã tồn tại" });
    }

    const promoCode = await PromoCode.create({
      code: code.toUpperCase().trim(),
      description: description || "",
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: new Date(endDate),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      isActive: isActive !== undefined ? isActive : true,
    });

    console.log(`✅ [PromoCodeController] Created promo code: ${promoCode.code}`);
    res.status(201).json(promoCode);
  } catch (err) {
    console.error("❌ Error creating promo code:", err);
    res.status(500).json({ message: "Lỗi khi tạo mã khuyến mãi", error: err.message });
  }
};

// Cập nhật mã khuyến mãi (admin)
exports.updatePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✏️ [PromoCodeController] updatePromoCode called for: ${id}`);

    const updateData = {};
    if (req.body.code) updateData.code = req.body.code.toUpperCase().trim();
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.discountType) updateData.discountType = req.body.discountType;
    if (req.body.discountValue !== undefined) updateData.discountValue = Number(req.body.discountValue);
    if (req.body.minOrderAmount !== undefined) updateData.minOrderAmount = Number(req.body.minOrderAmount);
    if (req.body.maxDiscountAmount !== undefined) {
      updateData.maxDiscountAmount = req.body.maxDiscountAmount ? Number(req.body.maxDiscountAmount) : null;
    }
    if (req.body.startDate) updateData.startDate = new Date(req.body.startDate);
    if (req.body.endDate) updateData.endDate = new Date(req.body.endDate);
    if (req.body.usageLimit !== undefined) {
      updateData.usageLimit = req.body.usageLimit ? Number(req.body.usageLimit) : null;
    }
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

    const promoCode = await PromoCode.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!promoCode) {
      return res.status(404).json({ message: "Mã khuyến mãi không tồn tại" });
    }

    console.log(`✅ [PromoCodeController] Updated promo code: ${promoCode.code}`);
    res.json(promoCode);
  } catch (err) {
    console.error("❌ Error updating promo code:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật mã khuyến mãi", error: err.message });
  }
};

// Xóa mã khuyến mãi (admin)
exports.deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ [PromoCodeController] deletePromoCode called for: ${id}`);

    const promoCode = await PromoCode.findByIdAndDelete(id);

    if (!promoCode) {
      return res.status(404).json({ message: "Mã khuyến mãi không tồn tại" });
    }

    console.log(`✅ [PromoCodeController] Deleted promo code: ${promoCode.code}`);
    res.json({ message: "✅ Xóa mã khuyến mãi thành công", deletedPromoCode: { _id: promoCode._id, code: promoCode.code } });
  } catch (err) {
    console.error("❌ Error deleting promo code:", err);
    res.status(500).json({ message: "Lỗi khi xóa mã khuyến mãi", error: err.message });
  }
};

