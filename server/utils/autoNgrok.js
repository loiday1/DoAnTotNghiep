const ngrok = require("ngrok");
const fs = require("fs");
const path = require("path");

let ngrokUrl = null;
let ngrokInstance = null;

/**
 * Cập nhật file .env với ngrok URL
 */
function updateEnvFile(ngrokUrl) {
  const envPath = path.join(__dirname, "../.env");
  
  try {
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }

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
    
    // Reload .env file
    delete require.cache[require.resolve("dotenv")];
    require("dotenv").config();
    
    return true;
  } catch (err) {
    console.error("⚠️  Không thể cập nhật .env:", err.message);
    return false;
  }
}

/**
 * Tự động khởi động ngrok
 */
async function startAutoNgrok(port = 5000) {
  try {
    // Kiểm tra xem có đang ở production không (không cần ngrok)
    if (process.env.NODE_ENV === "production") {
      console.log("ℹ️  Production mode - Bỏ qua ngrok");
      return null;
    }

    // Kiểm tra xem đã có ngrok URL trong .env chưa (có thể từ lần chạy trước)
    // Nếu có reserved domain, luôn tạo kết nối mới
    // Nếu không có reserved domain, URL sẽ thay đổi mỗi lần nên luôn tạo mới
    const existingNgrokUrl = process.env.BACKEND_URL;
    const hasReservedDomain = process.env.NGROK_DOMAIN;
    
    if (existingNgrokUrl && existingNgrokUrl.includes("ngrok") && hasReservedDomain) {
      console.log(`ℹ️  Đã có ngrok URL trong .env: ${existingNgrokUrl}`);
      console.log("💡 Có reserved domain, sẽ kết nối lại với domain này...");
      // Tiếp tục tạo kết nối với reserved domain
    } else if (existingNgrokUrl && existingNgrokUrl.includes("ngrok") && !hasReservedDomain) {
      console.log(`ℹ️  Đã có ngrok URL trong .env: ${existingNgrokUrl}`);
      console.log("⚠️  URL cũ có thể đã offline (free ngrok URLs thay đổi mỗi lần restart)");
      console.log("💡 Đang tạo URL mới...");
      // Tiếp tục tạo URL mới
    }

    console.log("🚀 Đang khởi động ngrok tự động...");
    
    // Cấu hình ngrok với authtoken và reserved domain (nếu có)
    const ngrokConfig = {
      proto: "http",
      addr: port,
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
    
    // Khởi động ngrok
    const url = await ngrok.connect(ngrokConfig);

    ngrokUrl = url;
    ngrokInstance = ngrok;

    // Cập nhật process.env ngay lập tức để các module khác có thể sử dụng
    process.env.BACKEND_URL = url;

    console.log("✅ Ngrok đã khởi động thành công!");
    console.log("📡 Public URL:", url);
    console.log("🔗 PayPal Return URL:", `${url}/api/payment/paypal_return`);
    console.log("🔗 PayPal Cancel URL:", `${url}/api/payment/paypal_cancel`);

    // Tự động cập nhật .env
    if (updateEnvFile(url)) {
      console.log("✅ Đã tự động cập nhật file .env với ngrok URL");
    }

    // Lưu thông tin vào file
    const ngrokInfo = {
      url: url,
      paypalReturnUrl: `${url}/api/payment/paypal_return`,
      paypalCancelUrl: `${url}/api/payment/paypal_cancel`,
      timestamp: new Date().toISOString()
    };
    
    const ngrokPath = path.join(__dirname, "../ngrok-url.json");
    fs.writeFileSync(ngrokPath, JSON.stringify(ngrokInfo, null, 2));

    return url;
  } catch (err) {
    console.error("❌ Lỗi khi khởi động ngrok:", err.message);
    
    // Nếu lỗi do URL cũ offline, thử xóa URL cũ và tạo mới
    if (err.message.includes("offline") || err.message.includes("3200") || err.code === "ERR_NGROK_3200") {
      console.log("💡 URL ngrok cũ đã offline, đang thử tạo URL mới...");
      
      // Xóa URL cũ khỏi .env
      try {
        const envPath = path.join(__dirname, "../.env");
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, "utf8");
          envContent = envContent.replace(/^BACKEND_URL=.*$/m, "");
          fs.writeFileSync(envPath, envContent);
          console.log("✅ Đã xóa URL cũ khỏi .env");
        }
      } catch (cleanErr) {
        console.warn("⚠️  Không thể xóa URL cũ:", cleanErr.message);
      }
      
      // Thử lại một lần nữa (chỉ nếu không có reserved domain)
      if (!process.env.NGROK_DOMAIN) {
        try {
          console.log("🔄 Đang thử tạo ngrok URL mới...");
          const simpleConfig = {
            proto: "http",
            addr: port,
            authtoken: process.env.NGROK_AUTH_TOKEN || undefined,
          };
          const url = await ngrok.connect(simpleConfig);
          
          ngrokUrl = url;
          ngrokInstance = ngrok;
          process.env.BACKEND_URL = url;
          
          updateEnvFile(url);
          console.log("✅ Đã tạo ngrok URL mới:", url);
          console.log("💡 PayPal sẽ tự động sử dụng URL mới này!");
          return url;
        } catch (retryErr) {
          console.error("❌ Vẫn lỗi khi tạo URL mới:", retryErr.message);
        }
      }
    }
    
    console.log("💡 Ngrok không bắt buộc - Server vẫn chạy bình thường");
    console.log("💡 Nếu cần ngrok, hãy chạy: npm run ngrok");
    return null;
  }
}

/**
 * Dừng ngrok
 */
async function stopAutoNgrok() {
  try {
    if (ngrokInstance) {
      await ngrok.disconnect();
      await ngrok.kill();
      console.log("✅ Đã dừng ngrok");
    }
  } catch (err) {
    console.error("⚠️  Lỗi khi dừng ngrok:", err.message);
  }
}

/**
 * Lấy ngrok URL hiện tại
 */
function getNgrokUrl() {
  return ngrokUrl || process.env.BACKEND_URL;
}

// Xử lý khi process exit
process.on("SIGINT", async () => {
  await stopAutoNgrok();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await stopAutoNgrok();
  process.exit(0);
});

module.exports = {
  startAutoNgrok,
  stopAutoNgrok,
  getNgrokUrl,
  updateEnvFile
};

