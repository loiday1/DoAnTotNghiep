const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// Tạo review mới
exports.createReview = async (req, res) => {
  try {
    const { userId, productId, orderId, rating, comment, userName, userEmail } = req.body;

    // Validation
    if (!userId || !productId || !orderId || !rating) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating phải từ 1 đến 5 sao" });
    }

    // Kiểm tra order có tồn tại và thuộc về user không
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền đánh giá đơn hàng này" });
    }

    // Kiểm tra order đã giao thành công chưa
    const statusLower = (order.status || "").toLowerCase();
    const isDelivered = 
      statusLower.includes("giao thành công") || 
      statusLower.includes("delivered") || 
      statusLower.includes("hoàn thành") || 
      statusLower.includes("completed");

    if (!isDelivered) {
      return res.status(400).json({ message: "Chỉ có thể đánh giá sản phẩm sau khi đơn hàng đã giao thành công" });
    }

    // Kiểm tra sản phẩm có trong đơn hàng không
    // Tìm bằng productId trước
    let productInOrder = order.items.find(
      (item) => item.productId && item.productId.toString() === productId.toString()
    );
    
    // Nếu không tìm thấy bằng productId, thử tìm bằng id (tương thích ngược)
    if (!productInOrder) {
      productInOrder = order.items.find(
        (item) => item.id && item.id.toString() === productId.toString()
      );
    }
    
    // Nếu vẫn không tìm thấy, kiểm tra product có tồn tại và tìm bằng tên
    let productExists = !!productInOrder;
    if (!productExists) {
      // Kiểm tra product có tồn tại không
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại" });
      }
      // Kiểm tra product có trong order items không (so sánh tên)
      const productInItems = order.items.find(
        (item) => item.name === product.name
      );
      productExists = !!productInItems;
    }

    if (!productExists) {
      return res.status(400).json({ message: "Sản phẩm không có trong đơn hàng này" });
    }

    // Kiểm tra user đã review sản phẩm này trong order này chưa
    const existingReview = await Review.findOne({
      userId,
      productId,
      orderId,
    });

    if (existingReview) {
      return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi" });
    }

    // Tạo review mới
    const newReview = new Review({
      userId,
      productId,
      orderId,
      rating,
      comment: comment || "",
      userName: userName || "Người dùng",
      userEmail: userEmail || "",
    });

    const savedReview = await newReview.save();

    res.status(201).json({
      message: "✅ Đánh giá thành công!",
      review: savedReview,
    });
  } catch (err) {
    console.error("❌ Error creating review:", err);
    res.status(500).json({
      message: "Lỗi khi tạo đánh giá",
      error: err.message,
    });
  }
};

// Lấy tất cả reviews của một sản phẩm
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    }

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .limit(100); // Giới hạn 100 reviews mới nhất

    res.json(reviews);
  } catch (err) {
    console.error("❌ Error fetching product reviews:", err);
    res.status(500).json({
      message: "Lỗi khi lấy đánh giá",
      error: err.message,
    });
  }
};

// Lấy reviews của một user
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const reviews = await Review.find({ userId })
      .populate("productId", "name image")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error("❌ Error fetching user reviews:", err);
    res.status(500).json({
      message: "Lỗi khi lấy đánh giá của người dùng",
      error: err.message,
    });
  }
};

// Lấy review của user cho một sản phẩm trong order
exports.getUserReviewForProduct = async (req, res) => {
  try {
    const { userId, productId, orderId } = req.query;

    if (!userId || !productId || !orderId) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const review = await Review.findOne({
      userId,
      productId,
      orderId,
    });

    if (!review) {
      return res.json({ review: null });
    }

    res.json({ review });
  } catch (err) {
    console.error("❌ Error fetching user review:", err);
    res.status(500).json({
      message: "Lỗi khi lấy đánh giá",
      error: err.message,
    });
  }
};

// Kiểm tra user đã review sản phẩm trong order chưa
exports.checkUserCanReview = async (req, res) => {
  try {
    const { userId, productId, orderId } = req.query;

    if (!userId || !productId || !orderId) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    // Kiểm tra order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.json({ canReview: false, reason: "Đơn hàng không tồn tại" });
    }

    if (order.userId !== userId) {
      return res.json({ canReview: false, reason: "Bạn không có quyền đánh giá đơn hàng này" });
    }

    // Kiểm tra order đã giao thành công chưa
    const statusLower = (order.status || "").toLowerCase();
    const isDelivered = 
      statusLower.includes("giao thành công") || 
      statusLower.includes("delivered") || 
      statusLower.includes("hoàn thành") || 
      statusLower.includes("completed");

    if (!isDelivered) {
      return res.json({ canReview: false, reason: "Chỉ có thể đánh giá sau khi đơn hàng đã giao thành công" });
    }

    // Kiểm tra đã review chưa
    const existingReview = await Review.findOne({
      userId,
      productId,
      orderId,
    });

    if (existingReview) {
      return res.json({
        canReview: false,
        reason: "Bạn đã đánh giá sản phẩm này",
        existingReview,
      });
    }

    res.json({ canReview: true });
  } catch (err) {
    console.error("❌ Error checking review permission:", err);
    res.status(500).json({
      message: "Lỗi khi kiểm tra quyền đánh giá",
      error: err.message,
    });
  }
};

// Cập nhật review (chỉ cho phép user sửa review của chính mình)
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "ID đánh giá không hợp lệ" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Đánh giá không tồn tại" });
    }

    if (review.userId !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền sửa đánh giá này" });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating phải từ 1 đến 5 sao" });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    const updatedReview = await review.save();

    res.json({
      message: "✅ Cập nhật đánh giá thành công",
      review: updatedReview,
    });
  } catch (err) {
    console.error("❌ Error updating review:", err);
    res.status(500).json({
      message: "Lỗi khi cập nhật đánh giá",
      error: err.message,
    });
  }
};

// Lấy tất cả reviews (admin)
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("productId", "name image brand")
      .populate("orderId", "items info createdAt")
      .sort({ createdAt: -1 });

    // Lấy thông tin user cho mỗi review (vì userId là String, không phải ObjectId)
    const User = require("../models/User");
    const reviewsWithUser = await Promise.all(
      reviews.map(async (review) => {
        const reviewObj = review.toObject();
        try {
          const user = await User.findById(review.userId).select("name email phone");
          if (user) {
            reviewObj.userInfo = {
              name: user.name,
              email: user.email,
              phone: user.phone,
            };
          }
        } catch (err) {
          console.error(`❌ Error fetching user for review ${review._id}:`, err);
        }
        return reviewObj;
      })
    );

    res.json(reviewsWithUser);
  } catch (err) {
    console.error("❌ Error fetching all reviews:", err);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách đánh giá",
      error: err.message,
    });
  }
};

// Xóa review (user xóa review của chính mình hoặc admin xóa bất kỳ)
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, isAdmin } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "ID đánh giá không hợp lệ" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Đánh giá không tồn tại" });
    }

    // Admin có thể xóa bất kỳ review nào, user chỉ xóa được review của mình
    if (!isAdmin && review.userId !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xóa đánh giá này" });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: "✅ Xóa đánh giá thành công" });
  } catch (err) {
    console.error("❌ Error deleting review:", err);
    res.status(500).json({
      message: "Lỗi khi xóa đánh giá",
      error: err.message,
    });
  }
};

