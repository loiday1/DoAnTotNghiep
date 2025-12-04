const Blog = require("../models/Blog");
const mongoose = require("mongoose");

// Lấy tất cả blog (public - chỉ lấy published)
exports.getAllBlogs = async (req, res) => {
  try {
    const { category, featured, limit, page } = req.query;
    const query = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (featured === "true") {
      query.featured = true;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("-content"); // Không trả về content đầy đủ trong danh sách

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("❌ Error getting blogs:", err);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách blog",
      error: err.message,
    });
  }
};

// Lấy blog theo ID hoặc slug (public)
exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      // Nếu không phải ObjectId, thử tìm theo slug
      const blog = await Blog.findOne({ slug: id, isPublished: true });
      if (!blog) {
        return res.status(404).json({ message: "Blog không tồn tại" });
      }
      // Tăng view
      blog.views += 1;
      await blog.save();
      return res.json(blog);
    }

    const blog = await Blog.findById(id);
    if (!blog || !blog.isPublished) {
      return res.status(404).json({ message: "Blog không tồn tại hoặc chưa được publish" });
    }

    // Tăng view
    blog.views += 1;
    await blog.save();

    res.json(blog);
  } catch (err) {
    console.error("❌ Error getting blog:", err);
    res.status(500).json({
      message: "Lỗi khi lấy blog",
      error: err.message,
    });
  }
};

// ================== ADMIN ROUTES ==================

// Lấy tất cả blog (admin - bao gồm cả unpublished)
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    console.log("📋 [BlogController] getAllBlogsAdmin called");
    const blogs = await Blog.find().sort({ createdAt: -1 });
    console.log(`✅ [BlogController] Found ${blogs.length} blogs`);
    res.json(blogs);
  } catch (err) {
    console.error("❌ Error getting blogs (admin):", err);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách blog",
      error: err.message,
    });
  }
};

// Tạo blog mới (admin)
exports.createBlog = async (req, res) => {
  try {
    console.log("➕ [BlogController] createBlog called");
    const {
      title,
      content,
      excerpt,
      author,
      image,
      category,
      tags,
      isPublished,
      featured,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Tiêu đề và nội dung là bắt buộc",
      });
    }

    const newBlog = new Blog({
      title,
      content,
      excerpt,
      author: author || "Admin",
      image: image || "",
      category: category || "tin-tuc",
      tags: Array.isArray(tags) ? tags : [],
      isPublished: isPublished === true,
      featured: featured === true,
    });

    await newBlog.save();
    console.log(`✅ [BlogController] Blog created: ${newBlog._id}`);
    res.status(201).json(newBlog);
  } catch (err) {
    console.error("❌ Error creating blog:", err);
    res.status(500).json({
      message: "Lỗi khi tạo blog",
      error: err.message,
    });
  }
};

// Cập nhật blog (admin)
exports.updateBlog = async (req, res) => {
  try {
    console.log(`✏️ [BlogController] updateBlog called for: ${req.params.id}`);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID blog không hợp lệ" });
    }

    const {
      title,
      content,
      excerpt,
      author,
      image,
      category,
      tags,
      isPublished,
      featured,
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (author !== undefined) updateData.author = author;
    if (image !== undefined) updateData.image = image;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (isPublished !== undefined) updateData.isPublished = isPublished === true;
    if (featured !== undefined) updateData.featured = featured === true;

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog không tồn tại" });
    }

    console.log(`✅ [BlogController] Blog updated: ${id}`);
    res.json(updatedBlog);
  } catch (err) {
    console.error("❌ Error updating blog:", err);
    res.status(500).json({
      message: "Lỗi khi cập nhật blog",
      error: err.message,
    });
  }
};

// Xóa blog (admin)
exports.deleteBlog = async (req, res) => {
  try {
    console.log(`🗑️ [BlogController] deleteBlog called for: ${req.params.id}`);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID blog không hợp lệ" });
    }

    const deletedBlog = await Blog.findByIdAndDelete(id);

    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog không tồn tại" });
    }

    console.log(`✅ [BlogController] Blog deleted: ${id}`);
    res.json({ message: "✅ Xóa blog thành công" });
  } catch (err) {
    console.error("❌ Error deleting blog:", err);
    res.status(500).json({
      message: "Lỗi khi xóa blog",
      error: err.message,
    });
  }
};

