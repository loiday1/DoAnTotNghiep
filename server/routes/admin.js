const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

// Middleware kiểm tra admin
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Thiếu token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin")
      return res.status(403).json({ message: "Không có quyền" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token không hợp lệ", error: err.message });
  }
};

// ================== USER ==================

// Lấy danh sách user
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy user", error: err.message });
  }
});

// Cập nhật user
router.patch("/users/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, phone, role },
      { new: true, runValidators: true, context: "query" }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "Người dùng không tồn tại" });

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi cập nhật user", error: err.message });
  }
});

// Xóa user
router.delete("/users/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra ObjectId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }

    // Không cho admin xóa chính mình
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: "Không thể xóa chính bạn!" });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) return res.status(404).json({ message: "Người dùng không tồn tại" });

    res.status(200).json({ message: "Xóa người dùng thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi xóa user", error: err.message });
  }
});

// ================== PRODUCT ==================

// Lấy danh sách sản phẩm
router.get("/products", verifyAdmin, async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm", error: err.message });
  }
});

// Thêm sản phẩm
router.post("/products", verifyAdmin, async (req, res) => {
  try {
    const { name, price, category, description, image, productCode, brand, weight } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    const newProduct = new Product({
      productCode,
      name,
      brand,
      price,
      description,
      category,
      weight,
      image,
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi thêm sản phẩm", error: err.message });
  }
});

// Cập nhật sản phẩm
router.patch("/products/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi cập nhật sản phẩm", error: err.message });
  }
});

// Xóa sản phẩm
router.delete("/products/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    res.status(200).json({ message: "Đã xóa sản phẩm thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi xóa sản phẩm", error: err.message });
  }
});

module.exports = router;
