const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

/** 🟤 Lấy tất cả sản phẩm (Public) */
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm", error: err.message });
  }
});

/** 🟠 Lấy sản phẩm theo category slug */
router.get("/products/category/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const products = await Product.find({ category: slug }).lean();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy sản phẩm theo category", error: err.message });
  }
});

/** 🟢 Lấy chi tiết sản phẩm theo ID */
router.get("/products/detail/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy chi tiết sản phẩm", error: err.message });
  }
});

/** 🔵 Tìm sản phẩm theo tên (dành cho phần gợi ý AI) */
router.get("/products/search/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const products = await Product.find({ name: { $regex: name, $options: "i" } }).lean();

    const seen = new Set();
    const uniqueProducts = products.filter((p) => {
      if (seen.has(p._id.toString())) return false;
      seen.add(p._id.toString());
      return true;
    });

    if (!uniqueProducts.length)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm phù hợp" });

    res.status(200).json(uniqueProducts);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi tìm sản phẩm theo tên", error: err.message });
  }
});

module.exports = router;
