const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Order",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index để tối ưu query
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, orderId: 1 }); // Đảm bảo mỗi user chỉ review 1 lần cho mỗi order

// Middleware để cập nhật rating trung bình của product sau khi tạo/cập nhật/xóa review
reviewSchema.post("save", async function () {
  await updateProductRating(this.productId);
});

reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await updateProductRating(doc.productId);
  }
});

reviewSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    await updateProductRating(doc.productId);
  }
});

// Hàm helper để cập nhật rating trung bình
async function updateProductRating(productId) {
  try {
    const Review = mongoose.model("Review");
    const Product = mongoose.model("Product");
    
    const reviews = await Review.find({ productId });
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      // Nếu không có review, xóa rating
      await Product.findByIdAndUpdate(productId, {
        $unset: { averageRating: "", totalReviews: "" }
      });
      return;
    }
    
    const sumRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((sumRating / totalReviews) * 10) / 10; // Làm tròn 1 chữ số thập phân
    
    await Product.findByIdAndUpdate(productId, {
      averageRating,
      totalReviews,
    });
  } catch (error) {
    console.error("❌ Error updating product rating:", error);
  }
}

module.exports = mongoose.model("Review", reviewSchema);

