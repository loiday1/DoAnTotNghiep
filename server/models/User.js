const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // null nếu đăng nhập bằng Google OAuth
    phone: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    providerId: { type: String }, // lưu Google sub ID nếu đăng nhập OAuth
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

// 🔒 Hash password trước khi lưu
userSchema.pre("save", async function (next) {
  if (this.provider !== "local") return next();
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔑 So sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // OAuth user không có password
  return bcrypt.compare(candidatePassword, this.password);
};

// 🛡️ Ẩn thông tin nhạy cảm khi trả về JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
