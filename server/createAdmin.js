const mongoose = require('mongoose');
const User = require('./models/User'); // đường dẫn đến model User
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/TasteTheCoffee';

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Đã kết nối MongoDB");

    const email = 'admin@gmail.com';
    const password = 'Admin123!'; // mật khẩu admin
    const name = 'Admin';
    const phone = '0932495196';

    // Kiểm tra admin đã tồn tại chưa
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("⚠️ Admin đã tồn tại");
      process.exit();
    }

    // Tạo admin mới (không hash, pre('save') sẽ tự hash)
    const admin = new User({
      name,
      email,
      password, // để User schema hash tự động
      phone,
      role: 'admin',
      provider: 'local',
    });

    await admin.save();
    console.log("✅ Tạo admin thành công!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit();
  } catch (err) {
    console.error("❌ Lỗi tạo admin:", err.message);
    process.exit(1);
  }
}

createAdmin();
