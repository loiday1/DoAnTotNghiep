const Purchase = require("../models/Purchase");

// ================== Lấy tất cả purchases ==================
exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 });
    res.status(200).json(purchases);
  } catch (err) {
    res.status(500).json({
      message: "❌ Lỗi khi lấy danh sách thu mua",
      error: err.message,
    });
  }
};

// ================== Thêm mới purchase ==================
exports.createPurchase = async (req, res) => {
  try {
    const { name, type, weight, price, quality } = req.body;

    // Validate cơ bản
    if (!name || !weight || !price || !quality) {
      return res.status(400).json({ message: "⚠️ Vui lòng điền đầy đủ thông tin" });
    }

    // Validate weight: số hoặc khoảng "min-max"
    if (!/^(\d+)(\s*-\s*\d+)?$/.test(weight.trim())) {
      return res.status(400).json({
        message: "⚠️ Trọng lượng phải là số hoặc khoảng 'min-max' (min ≤ max)",
      });
    }

    const newPurchase = new Purchase({
      name: name.trim(),
      type: type?.toLowerCase() || "tươi",
      weight: weight.trim(),
      price: Number(price),
      quality: quality.toLowerCase(),
    });

    const saved = await newPurchase.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({
      message: "❌ Lỗi khi thêm thu mua",
      error: err.message,
    });
  }
};

// ================== Cập nhật purchase ==================
exports.updatePurchase = async (req, res) => {
  try {
    const { name, type, weight, price, quality } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (type) updateData.type = type.toLowerCase();

    if (weight !== undefined) {
      if (!/^(\d+)(\s*-\s*\d+)?$/.test(weight.trim())) {
        return res.status(400).json({
          message: "⚠️ Trọng lượng phải là số hoặc khoảng 'min-max' (min ≤ max)",
        });
      }
      updateData.weight = weight.trim();
    }

    if (price !== undefined) updateData.price = Number(price);
    if (quality) updateData.quality = quality.toLowerCase();

    const updated = await Purchase.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "⚠️ Không tìm thấy thu mua" });
    }

    res.status(200).json(updated);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({
      message: "❌ Lỗi khi cập nhật",
      error: err.message,
    });
  }
};

// ================== Xóa purchase ==================
exports.deletePurchase = async (req, res) => {
  try {
    const deleted = await Purchase.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "⚠️ Không tìm thấy thu mua" });
    }
    res.status(200).json({ message: "🗑️ Xóa thu mua thành công", deleted });
  } catch (err) {
    res.status(500).json({
      message: "❌ Lỗi khi xóa thu mua",
      error: err.message,
    });
  }
};
