const express = require("express");
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getUserReviews,
  getUserReviewForProduct,
  checkUserCanReview,
  updateReview,
  deleteReview,
  getAllReviews,
} = require("../controllers/reviewController");

// Tạo review mới
router.post("/", createReview);

// Lấy reviews của một sản phẩm
router.get("/product/:productId", getProductReviews);

// Lấy reviews của một user
router.get("/user/:userId", getUserReviews);

// Lấy tất cả reviews (admin)
router.get("/all", getAllReviews);

// Lấy review của user cho một sản phẩm trong order
router.get("/user-review", getUserReviewForProduct);

// Kiểm tra user có thể review không
router.get("/check", checkUserCanReview);

// Cập nhật review
router.put("/:reviewId", updateReview);

// Xóa review
router.delete("/:reviewId", deleteReview);

module.exports = router;

