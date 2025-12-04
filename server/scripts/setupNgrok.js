const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupNgrok() {
  console.log("🔧 ===== Cấu hình Ngrok Account =====\n");
  
  const envPath = path.join(__dirname, "../.env");
  let envContent = "";
  
  // Đọc file .env nếu tồn tại
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    console.log("✅ Đã đọc file .env hiện tại\n");
  } else {
    console.log("ℹ️  File .env chưa tồn tại, sẽ tạo mới\n");
  }

  // Hỏi authtoken
  console.log("📝 Bước 1: Ngrok Authtoken");
  console.log("💡 Lấy authtoken từ: https://dashboard.ngrok.com/get-started/your-authtoken\n");
  const authtoken = await question("Nhập Ngrok Authtoken (hoặc Enter để bỏ qua): ");
  
  if (authtoken.trim()) {
    const regex = /^NGROK_AUTH_TOKEN=.*$/m;
    const newLine = `NGROK_AUTH_TOKEN=${authtoken.trim()}`;
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine);
      console.log("✅ Đã cập nhật NGROK_AUTH_TOKEN\n");
    } else {
      envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + newLine + "\n";
      console.log("✅ Đã thêm NGROK_AUTH_TOKEN\n");
    }
  } else {
    console.log("ℹ️  Bỏ qua authtoken\n");
  }

  // Hỏi reserved domain
  console.log("📝 Bước 2: Reserved Domain (URL cố định)");
  console.log("💡 Tạo domain tại: https://dashboard.ngrok.com/cloud-edge/domains");
  console.log("💡 Ví dụ: my-coffee-shop.ngrok-free.app (không có https://)\n");
  const domain = await question("Nhập Reserved Domain (hoặc Enter để bỏ qua): ");
  
  if (domain.trim()) {
    // Loại bỏ https:// nếu có
    const cleanDomain = domain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    
    const regex = /^NGROK_DOMAIN=.*$/m;
    const newLine = `NGROK_DOMAIN=${cleanDomain}`;
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine);
      console.log(`✅ Đã cập nhật NGROK_DOMAIN: ${cleanDomain}\n`);
    } else {
      envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + newLine + "\n";
      console.log(`✅ Đã thêm NGROK_DOMAIN: ${cleanDomain}\n`);
    }
  } else {
    console.log("ℹ️  Bỏ qua reserved domain (URL sẽ thay đổi mỗi lần khởi động)\n");
  }

  // Ghi file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Đã cập nhật file .env thành công!\n");
    
    if (authtoken.trim() && domain.trim()) {
      console.log("🎉 Hoàn tất! Bây giờ bạn có:");
      console.log("   ✅ Ngrok authtoken");
      console.log("   ✅ Reserved domain (URL cố định)");
      console.log("\n💡 Khởi động lại server để áp dụng:");
      console.log("   npm run dev\n");
    } else if (authtoken.trim()) {
      console.log("⚠️  Bạn đã thêm authtoken nhưng chưa có reserved domain");
      console.log("💡 URL vẫn sẽ thay đổi mỗi lần khởi động");
      console.log("💡 Để có URL cố định, tạo reserved domain và chạy lại script này\n");
    } else {
      console.log("⚠️  Bạn chưa thêm authtoken");
      console.log("💡 URL sẽ thay đổi mỗi lần khởi động");
      console.log("💡 Xem hướng dẫn: NGROK_SETUP.md\n");
    }
  } catch (err) {
    console.error("❌ Lỗi khi ghi file .env:", err.message);
    process.exit(1);
  }

  rl.close();
}

setupNgrok().catch(err => {
  console.error("❌ Lỗi:", err);
  rl.close();
  process.exit(1);
});

