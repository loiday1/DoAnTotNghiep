const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Tên sản phẩm không được để trống"], 
      trim: true 
    },

    type: { 
      type: String, 
      enum: ["tươi", "khô"], 
      default: "tươi", 
      lowercase: true, 
      trim: true 
    },

    weight: { 
      type: String, 
      required: [true, "Trọng lượng là bắt buộc"], 
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return false;

          const val = v.trim();

          // Nếu chỉ 1 số, hợp lệ
          if (/^\d+$/.test(val)) return true;

          // Nếu là khoảng dạng "min-max" (có thể có khoảng trắng)
          const match = val.match(/^(\d+)\s*-\s*(\d+)$/);
          if (!match) return false;

          const min = parseInt(match[1], 10);
          const max = parseInt(match[2], 10);

          return min <= max; // đảm bảo min <= max
        },
        message: props => `${props.value} không phải là trọng lượng hợp lệ. Nhập số hoặc khoảng "min-max" (min ≤ max).`
      }
    },

    price: { 
      type: Number, 
      required: [true, "Giá thu mua là bắt buộc"], 
      min: [0, "Giá không hợp lệ"] 
    },

    quality: { 
      type: String, 
      required: [true, "Chất lượng là bắt buộc"], 
      enum: ["loại 1", "loại 2", "đặc biệt"], 
      trim: true, 
      lowercase: true,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false }
  }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
