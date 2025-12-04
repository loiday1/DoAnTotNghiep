const express = require("express");
const Purchase = require("../models/Purchase");

const router = express.Router();

// --- Public route: Lấy tất cả purchases (chỉ đọc, không cần token) ---
router.get("/", async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .select("name type weight quality price") // chỉ lấy những trường cần thiết
      .sort({ type: 1, createdAt: -1 }); // Sắp xếp theo type (tươi/khô) và ngày tạo

    res.status(200).json({
      success: true,
      data: purchases,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy dữ liệu purchases:", err.message);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy dữ liệu purchases",
      error: err.message,
    });
  }
});

module.exports = router;

