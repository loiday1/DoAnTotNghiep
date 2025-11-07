const Processing = require("../models/Processing");
const mongoose = require("mongoose");

// --- GET tất cả processings (public & admin) ---
const getAllProcessings = async (req, res) => {
  try {
    const processings = await Processing.find()
      .select("name method description") // chỉ lấy 3 trường
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: processings });
  } catch (err) {
    console.error("Lỗi khi lấy processings:", err.message);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy dữ liệu",
      error: err.message,
    });
  }
};

// --- POST thêm mới (admin) ---
const createProcessing = async (req, res) => {
  try {
    const { name, method, description } = req.body;

    if (!name || !method) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu bắt buộc: name hoặc method",
      });
    }

    const newProcessing = new Processing({ name, method, description });
    await newProcessing.save();

    res.status(201).json({
      success: true,
      message: "Tạo mới thành công",
      data: newProcessing,
    });
  } catch (err) {
    console.error("Lỗi khi thêm mới Processing:", err.message);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm mới",
      error: err.message,
    });
  }
};

// --- PATCH cập nhật (admin) ---
const updateProcessing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID không hợp lệ" });
    }

    const updateData = { ...req.body };
    delete updateData._id;
    // chỉ giữ các trường cần cập nhật
    const allowedFields = ["name", "method", "description"];
    Object.keys(updateData).forEach(key => {
      if (!allowedFields.includes(key)) delete updateData[key];
    });

    const updatedProcessing = await Processing.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProcessing) {
      return res.status(404).json({ success: false, message: "Dữ liệu không tồn tại" });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
      data: updatedProcessing,
    });
  } catch (err) {
    console.error("Lỗi khi cập nhật Processing:", err.message);
    res.status(500).json({ success: false, message: "Lỗi server khi cập nhật", error: err.message });
  }
};

// --- DELETE xóa (admin) ---
const deleteProcessing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID không hợp lệ" });
    }

    const deletedProcessing = await Processing.findByIdAndDelete(id);
    if (!deletedProcessing) {
      return res.status(404).json({ success: false, message: "Dữ liệu không tồn tại" });
    }

    res.status(200).json({ success: true, message: "Xóa thành công", data: deletedProcessing });
  } catch (err) {
    console.error("Lỗi khi xóa Processing:", err.message);
    res.status(500).json({ success: false, message: "Lỗi server khi xóa", error: err.message });
  }
};

module.exports = {
  getAllProcessings,
  createProcessing,
  updateProcessing,
  deleteProcessing,
};
