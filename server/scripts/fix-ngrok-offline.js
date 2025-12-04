const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env");

console.log("🔧 Đang xóa ngrok URL cũ khỏi .env...");

try {
  if (!fs.existsSync(envPath)) {
    console.log("ℹ️  File .env không tồn tại");
    process.exit(0);
  }

  let envContent = fs.readFileSync(envPath, "utf8");
  let updated = false;

  // Xóa các dòng chứa ngrok URL cũ
  const linesToRemove = [
    /^BACKEND_URL=.*ngrok.*$/m,
  ];

  linesToRemove.forEach(regex => {
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, "");
      updated = true;
      console.log(`✅ Đã xóa dòng khỏi .env`);
    }
  });

  // Xóa các dòng trống thừa
  envContent = envContent.replace(/\n{3,}/g, "\n\n");

  if (updated) {
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Đã xóa ngrok URL cũ khỏi .env");
    console.log("💡 Bây giờ hãy restart server để ngrok tự động tạo URL mới");
  } else {
    console.log("ℹ️  Không tìm thấy ngrok URL cũ trong .env");
  }
} catch (err) {
  console.error("❌ Lỗi:", err.message);
  process.exit(1);
}

