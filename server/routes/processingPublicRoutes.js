const express = require("express");
const Processing = require("../models/Processing");

const router = express.Router();

// --- Public route: Lấy tất cả processings (chỉ đọc, không cần token) ---
router.get("/", async (req, res) => {
  try {
    const processings = await Processing.find()
      .select("name method description") // chỉ lấy những trường cần thiết
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: processings,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy dữ liệu processings:", err.message);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy dữ liệu processings",
      error: err.message,
    });
  }
});

module.exports = router;
