const fs = require("fs");
const path = require("path");

// PayPal credentials từ user
const PAYPAL_CLIENT_ID = "ASy4J_HtcGL4-bBvZ41A1AhEekeAEzWZO3Fe4RRp95tkqgT9YQ_RUFWDolJeFH_5CCda983ykcycraoQ";
const PAYPAL_CLIENT_SECRET = "ASy4J_HtcGL4-bBvZ41A1AhEekeAEzWZO3Fe4RRp95tkqgT9YQ_RUFWDolJeFH_5CCda983ykcycraoQ";

const envPath = path.join(__dirname, "../.env");

console.log("💳 ===== Cập nhật PayPal Credentials =====\n");

// Đọc file .env nếu tồn tại
let envContent = "";
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, "utf8");
  console.log("✅ Đã đọc file .env hiện tại\n");
} else {
  console.log("ℹ️  File .env chưa tồn tại, sẽ tạo mới\n");
}

// Cập nhật PAYPAL_CLIENT_ID
const clientIdRegex = /^PAYPAL_CLIENT_ID=.*$/m;
const clientIdLine = `PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID}`;

if (clientIdRegex.test(envContent)) {
  envContent = envContent.replace(clientIdRegex, clientIdLine);
  console.log("✅ Đã cập nhật PAYPAL_CLIENT_ID");
} else {
  envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + clientIdLine + "\n";
  console.log("✅ Đã thêm PAYPAL_CLIENT_ID");
}

// Cập nhật PAYPAL_CLIENT_SECRET
const clientSecretRegex = /^PAYPAL_CLIENT_SECRET=.*$/m;
const clientSecretLine = `PAYPAL_CLIENT_SECRET=${PAYPAL_CLIENT_SECRET}`;

if (clientSecretRegex.test(envContent)) {
  envContent = envContent.replace(clientSecretRegex, clientSecretLine);
  console.log("✅ Đã cập nhật PAYPAL_CLIENT_SECRET");
} else {
  envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + clientSecretLine + "\n";
  console.log("✅ Đã thêm PAYPAL_CLIENT_SECRET");
}

// Đảm bảo có PAYPAL_ENVIRONMENT
const envRegex = /^PAYPAL_ENVIRONMENT=.*$/m;
const envLine = `PAYPAL_ENVIRONMENT=sandbox`;

if (!envRegex.test(envContent)) {
  envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + envLine + "\n";
  console.log("✅ Đã thêm PAYPAL_ENVIRONMENT=sandbox");
}

// Đảm bảo có USD_TO_VND_RATE
const rateRegex = /^USD_TO_VND_RATE=.*$/m;
const rateLine = `USD_TO_VND_RATE=25000`;

if (!rateRegex.test(envContent)) {
  envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + rateLine + "\n";
  console.log("✅ Đã thêm USD_TO_VND_RATE=25000");
}

// Ghi file
try {
  fs.writeFileSync(envPath, envContent);
  console.log("\n✅ Đã cập nhật file .env thành công!");
  console.log("\n📝 PayPal Configuration:");
  console.log(`   Client ID: ${PAYPAL_CLIENT_ID.substring(0, 20)}...`);
  console.log(`   Client Secret: ${PAYPAL_CLIENT_SECRET.substring(0, 20)}...`);
  console.log(`   Environment: sandbox`);
  console.log("\n💡 Khởi động lại server để áp dụng:");
  console.log("   cd server");
  console.log("   npm run dev\n");
} catch (err) {
  console.error("❌ Lỗi khi ghi file .env:", err.message);
  process.exit(1);
}

