const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề blog là bắt buộc"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: [true, "Nội dung blog là bắt buộc"],
      trim: true,
    },
    excerpt: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300, // Tóm tắt ngắn gọn
    },
    author: {
      type: String,
      default: "Admin",
      trim: true,
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "tin-tuc",
        "huong-dan",
        "cong-thuc",
        "kinh-nghiem",
        "san-pham",
        "khac",
      ],
      default: "tin-tuc",
    },
    tags: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false, // Mặc định chưa publish, admin phải publish thủ công
    },
    views: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false, // Blog nổi bật
    },
  },
  { timestamps: true }
);

// Tạo slug tự động từ title trước khi lưu
blogSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
      .replace(/[^a-z0-9\s-]/g, "") // Xóa ký tự đặc biệt
      .replace(/\s+/g, "-") // Thay khoảng trắng bằng dấu gạch ngang
      .replace(/-+/g, "-") // Xóa nhiều dấu gạch ngang liên tiếp
      .trim();
  }
  next();
});

// Index để tìm kiếm nhanh
blogSchema.index({ slug: 1, isPublished: 1 });
blogSchema.index({ category: 1, isPublished: 1 });
blogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Blog", blogSchema);

