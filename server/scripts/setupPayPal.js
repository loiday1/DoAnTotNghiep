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

async function setupPayPal() {
  console.log("💳 ===== Cấu hình PayPal Sandbox =====\n");
  
  const envPath = path.join(__dirname, "../.env");
  let envContent = "";
  
  // Đọc file .env nếu tồn tại
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    console.log("✅ Đã đọc file .env hiện tại\n");
  } else {
    console.log("ℹ️  File .env chưa tồn tại, sẽ tạo mới\n");
  }

  // Hỏi Client ID
  console.log("📝 Bước 1: PayPal Client ID");
  console.log("💡 Lấy từ: https://developer.paypal.com/dashboard/applications/sandbox\n");
  const clientId = await question("Nhập PayPal Client ID (hoặc Enter để bỏ qua): ");
  
  if (clientId.trim()) {
    const regex = /^PAYPAL_CLIENT_ID=.*$/m;
    const newLine = `PAYPAL_CLIENT_ID=${clientId.trim()}`;
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine);
      console.log("✅ Đã cập nhật PAYPAL_CLIENT_ID\n");
    } else {
      envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + newLine + "\n";
      console.log("✅ Đã thêm PAYPAL_CLIENT_ID\n");
    }
  } else {
    console.log("ℹ️  Bỏ qua Client ID\n");
  }

  // Hỏi Client Secret
  console.log("📝 Bước 2: PayPal Client Secret");
  console.log("💡 Lấy từ: https://developer.paypal.com/dashboard/applications/sandbox\n");
  const clientSecret = await question("Nhập PayPal Client Secret (hoặc Enter để bỏ qua): ");
  
  if (clientSecret.trim()) {
    const regex = /^PAYPAL_CLIENT_SECRET=.*$/m;
    const newLine = `PAYPAL_CLIENT_SECRET=${clientSecret.trim()}`;
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine);
      console.log("✅ Đã cập nhật PAYPAL_CLIENT_SECRET\n");
    } else {
      envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + newLine + "\n";
      console.log("✅ Đã thêm PAYPAL_CLIENT_SECRET\n");
    }
  } else {
    console.log("ℹ️  Bỏ qua Client Secret\n");
  }

  // Hỏi Environment
  console.log("📝 Bước 3: PayPal Environment");
  const environment = await question("Chọn environment (sandbox/live) [sandbox]: ");
  const env = (environment.trim() || "sandbox").toLowerCase();
  
  const envRegex = /^PAYPAL_ENVIRONMENT=.*$/m;
  const envLine = `PAYPAL_ENVIRONMENT=${env}`;
  
  if (envRegex.test(envContent)) {
    envContent = envContent.replace(envRegex, envLine);
    console.log(`✅ Đã cập nhật PAYPAL_ENVIRONMENT: ${env}\n`);
  } else {
    envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + envLine + "\n";
    console.log(`✅ Đã thêm PAYPAL_ENVIRONMENT: ${env}\n`);
  }

  // Hỏi Exchange Rate
  console.log("📝 Bước 4: Tỷ giá USD sang VND");
  const exchangeRate = await question("Nhập tỷ giá USD/VND [25000]: ");
  const rate = exchangeRate.trim() || "25000";
  
  const rateRegex = /^USD_TO_VND_RATE=.*$/m;
  const rateLine = `USD_TO_VND_RATE=${rate}`;
  
  if (rateRegex.test(envContent)) {
    envContent = envContent.replace(rateRegex, rateLine);
    console.log(`✅ Đã cập nhật USD_TO_VND_RATE: ${rate}\n`);
  } else {
    envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + rateLine + "\n";
    console.log(`✅ Đã thêm USD_TO_VND_RATE: ${rate}\n`);
  }

  // Ghi file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Đã cập nhật file .env thành công!\n");
    
    if (clientId.trim() && clientSecret.trim()) {
      console.log("🎉 Hoàn tất! Bây giờ bạn có:");
      console.log("   ✅ PayPal Client ID");
      console.log("   ✅ PayPal Client Secret");
      console.log("   ✅ PayPal Environment");
      console.log("   ✅ Exchange Rate");
      console.log("\n💡 Khởi động lại server để áp dụng:");
      console.log("   npm run dev\n");
    } else {
      console.log("⚠️  Bạn chưa thêm đầy đủ thông tin PayPal");
      console.log("💡 Xem hướng dẫn: PAYPAL_SETUP.md\n");
    }
  } catch (err) {
    console.error("❌ Lỗi khi ghi file .env:", err.message);
    process.exit(1);
  }

  rl.close();
}

setupPayPal().catch(err => {
  console.error("❌ Lỗi:", err);
  rl.close();
  process.exit(1);
});

