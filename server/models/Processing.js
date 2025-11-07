const mongoose = require("mongoose");

const ProcessingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên gia công là bắt buộc"],
      trim: true,
    },
    method: {
      type: String,
      required: [true, "Giá gia công là bắt buộc"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Processing", ProcessingSchema);
