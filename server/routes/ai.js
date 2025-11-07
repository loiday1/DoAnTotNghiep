const express = require("express");
const { makeCoffee, getHistory, clearHistory } = require("../controllers/aiController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Token bắt buộc trước khi gọi controller
router.post("/make-coffee", verifyToken, makeCoffee);
router.get("/history", verifyToken, getHistory);

// ✅ Thêm route xóa toàn bộ lịch sử của user
router.delete("/history", verifyToken, clearHistory);

module.exports = router;
