const ngrok = require("ngrok");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function updateEnvFile(ngrokUrl) {
  const envPath = path.join(__dirname, "../.env");
  
  try {
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }

    const paypalReturnUrl = `${ngrokUrl}/api/payment/paypal_return`;
    const paypalCancelUrl = `${ngrokUrl}/api/payment/paypal_cancel`;

    // Cập nhật hoặc thêm các biến môi trường
    const envVars = {
      BACKEND_URL: ngrokUrl
    };

    // Xử lý từng biến
    Object.keys(envVars).forEach(key => {
      const regex = new RegExp(`^${key}=.*$`, "m");
      const newLine = `${key}=${envVars[key]}`;
      
      if (regex.test(envContent)) {
        // Cập nhật giá trị hiện có
        envContent = envContent.replace(regex, newLine);
      } else {
        // Thêm mới nếu chưa có
        envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + newLine + "\n";
      }
    });

    fs.writeFileSync(envPath, envContent);
    console.log("✅ Đã tự động cập nhật file .env với ngrok URL");
  } catch (err) {
    console.warn("⚠️  Không thể tự động cập nhật .env:", err.message);
    console.log("📝 Vui lòng cập nhật thủ công:");
    console.log(`   BACKEND_URL=${ngrokUrl}`);
  }
}

async function startNgrok() {
  try {
    console.log("🚀 Đang khởi động ngrok cho backend (port 5000)...");
    
    // Cấu hình ngrok với authtoken và reserved domain (nếu có)
    const ngrokConfig = {
      proto: "http",
      addr: 5000,
    };
    
    // Thêm authtoken nếu có (bắt buộc để dùng reserved domain)
    if (process.env.NGROK_AUTH_TOKEN) {
      ngrokConfig.authtoken = process.env.NGROK_AUTH_TOKEN;
      console.log("✅ Sử dụng ngrok authtoken");
    } else {
      console.warn("⚠️  Không có NGROK_AUTH_TOKEN - URL sẽ thay đổi mỗi lần khởi động");
      console.warn("💡 Để có URL cố định, hãy:");
      console.warn("   1. Đăng ký ngrok account tại: https://dashboard.ngrok.com/signup");
      console.warn("   2. Lấy authtoken từ: https://dashboard.ngrok.com/get-started/your-authtoken");
      console.warn("   3. Thêm NGROK_AUTH_TOKEN vào file .env");
    }
    
    // Thêm reserved domain nếu có (URL cố định)
    if (process.env.NGROK_DOMAIN) {
      ngrokConfig.domain = process.env.NGROK_DOMAIN;
      console.log(`✅ Sử dụng reserved domain: ${process.env.NGROK_DOMAIN}`);
      console.log("💡 URL sẽ cố định và không thay đổi!");
    } else {
      console.log("ℹ️  Không có NGROK_DOMAIN - URL sẽ thay đổi mỗi lần khởi động");
      console.log("💡 Để có URL cố định:");
      console.log("   1. Mua reserved domain tại: https://dashboard.ngrok.com/cloud-edge/domains");
      console.log("   2. Thêm NGROK_DOMAIN vào file .env");
    }
    
    // Khởi động ngrok cho backend
    const url = await ngrok.connect(ngrokConfig);

    console.log("\n✅ Ngrok đã khởi động thành công!");
    console.log("📡 Public URL:", url);
    console.log("\n🔗 Các URL đã được cấu hình:");
    console.log(`   PayPal Return URL: ${url}/api/payment/paypal_return`);
    console.log(`   PayPal Cancel URL: ${url}/api/payment/paypal_cancel`);
    console.log(`   Backend URL: ${url}`);

    // Tự động cập nhật .env
    await updateEnvFile(url);

    // Lưu URL vào file để dễ copy
    const ngrokInfo = {
      url: url,
      paypalReturnUrl: `${url}/api/payment/paypal_return`,
      paypalCancelUrl: `${url}/api/payment/paypal_cancel`,
      timestamp: new Date().toISOString()
    };
    
    const ngrokPath = path.join(__dirname, "../ngrok-url.json");
    fs.writeFileSync(ngrokPath, JSON.stringify(ngrokInfo, null, 2));
    console.log("📝 Đã lưu thông tin vào: " + ngrokPath);
    console.log("\n💡 Nhấn Ctrl+C để dừng ngrok\n");

    // Giữ process chạy
    process.on("SIGINT", async () => {
      console.log("\n🛑 Đang dừng ngrok...");
      await ngrok.disconnect();
      await ngrok.kill();
      console.log("✅ Đã dừng ngrok");
      process.exit(0);
    });

  } catch (err) {
    console.error("❌ Lỗi khi khởi động ngrok:", err.message);
    console.log("\n💡 Hướng dẫn:");
    console.log("   1. Cài đặt ngrok: npm install -g ngrok");
    console.log("   2. Hoặc dùng ngrok từ package: npx ngrok http 5000");
    process.exit(1);
  }
}

startNgrok();

