const mongoose = require("mongoose");

// 🔹 Sub-schema cho gợi ý sản phẩm
const suggestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true }, // id ổn định cho lọc
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0 },
    image: { type: String, default: "" },
    category: { type: String, default: "" },
    productCode: { type: String, default: "" },
  },
  { _id: false } // không tạo _id riêng cho từng suggestion
);

// 🔹 Schema chính cho lịch sử chat
const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    suggestions: { type: [suggestionSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

// 🔹 Chuyển _id thành id khi trả về JSON, và gán id cho suggestions
chatHistorySchema.method("toJSON", function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;

  obj.suggestions = (obj.suggestions || []).map((p, idx) => ({
    id: p.id || p.productCode || `suggestion_${idx}_${Date.now()}`,
    ...p,
  }));

  return obj;
});

module.exports = mongoose.model("ChatHistory", chatHistorySchema);
