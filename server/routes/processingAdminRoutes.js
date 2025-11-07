const express = require("express");
const {
  getAllProcessings,
  createProcessing,
  updateProcessing,
  deleteProcessing,
} = require("../controllers/processingController");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// --- Admin routes: cần token + admin ---
// GET tất cả processings
router.get("/", verifyToken, isAdmin, getAllProcessings);

// POST thêm mới (chỉ nhận name, method, description)
router.post("/", verifyToken, isAdmin, createProcessing);

// PATCH cập nhật theo ID
router.patch("/:id", verifyToken, isAdmin, updateProcessing);

// DELETE theo ID
router.delete("/:id", verifyToken, isAdmin, deleteProcessing);

module.exports = router;
