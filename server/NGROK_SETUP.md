# 🔧 Hướng dẫn cấu hình Ngrok Account để có URL cố định

## 🎯 Tại sao cần URL cố định?

- ✅ **PayPal yêu cầu Return URL cố định** - Không phải cập nhật lại mỗi lần restart
- ✅ **Tiện lợi hơn** - Không cần cập nhật PayPal Developer Portal liên tục
- ✅ **Ổn định hơn** - URL không thay đổi khi restart server

## 📋 Bước 1: Đăng ký Ngrok Account (Miễn phí)

1. Truy cập: https://dashboard.ngrok.com/signup
2. Đăng ký tài khoản (có thể dùng Google/GitHub)
3. Xác nhận email

## 🔑 Bước 2: Lấy Authtoken

1. Đăng nhập vào: https://dashboard.ngrok.com/
2. Vào **Your Authtoken**: https://dashboard.ngrok.com/get-started/your-authtoken
3. Copy authtoken (dạng: `2abc123def456ghi789jkl012mno345pqr678stu901vwx234yz_5A6B7C8D9E0F1G2H3I4J5K`)
4. Thêm vào file `.env`:
   ```env
   NGROK_AUTH_TOKEN=your-authtoken-here
   ```

## 🌐 Bước 3: Tạo Reserved Domain (Miễn phí - 1 domain)

### Cách 1: Dùng Free Domain (Khuyến nghị)

1. Vào **Cloud Edge** → **Domains**: https://dashboard.ngrok.com/cloud-edge/domains
2. Click **Create Domain**
3. Chọn **Free Static Domain** (miễn phí)
4. Nhập tên domain (ví dụ: `my-coffee-shop`)
5. Domain sẽ có dạng: `https://my-coffee-shop.ngrok-free.app`
6. Copy domain name

### Cách 2: Dùng Custom Domain (Có phí)

Nếu bạn có domain riêng, có thể dùng custom domain (cần trả phí).

## ⚙️ Bước 4: Cấu hình trong .env

Thêm vào file `.env` trong thư mục `server/`:

```env
# Ngrok Configuration
NGROK_AUTH_TOKEN=your-authtoken-here
NGROK_DOMAIN=my-coffee-shop.ngrok-free.app
```

**Lưu ý:**
- Chỉ cần domain name, không cần `https://`
- Ví dụ: `my-coffee-shop.ngrok-free.app` (không phải `https://my-coffee-shop.ngrok-free.app`)

## 🚀 Bước 5: Khởi động lại Server

```bash
cd server
npm run dev
```

Server sẽ tự động:
- ✅ Sử dụng authtoken
- ✅ Kết nối với reserved domain
- ✅ URL sẽ cố định: `https://my-coffee-shop.ngrok-free.app`
- ✅ Tự động cập nhật `.env` với URL cố định

## 📝 Bước 6: Cấu hình PayPal Developer Portal (Tùy chọn)

Nếu bạn muốn sử dụng PayPal Webhooks, có thể cấu hình:

1. Đăng nhập: https://developer.paypal.com/
2. Vào **My Apps & Credentials** → Chọn app của bạn
3. Cập nhật Webhook URL (nếu cần):
   - **Webhook URL**: `https://my-coffee-shop.ngrok-free.app/api/payment/paypal_webhook`
4. **Lưu** - Bây giờ URL sẽ không thay đổi nữa! 🎉

**Lưu ý:** PayPal Return URL và Cancel URL được cấu hình tự động trong code, không cần cấu hình trong PayPal Portal.

## ✅ Kiểm tra

1. Kiểm tra ngrok status:
   ```bash
   # Trong browser
   GET http://localhost:5000/api/payment/ngrok-status
   ```

2. Xem console backend:
   ```
   ✅ Sử dụng ngrok authtoken
   ✅ Sử dụng reserved domain: my-coffee-shop.ngrok-free.app
   ✅ Ngrok đã khởi động thành công!
   📡 Public URL: https://my-coffee-shop.ngrok-free.app
   ```

## 🔍 Troubleshooting

### Lỗi: "authtoken is required"
- ✅ Kiểm tra `NGROK_AUTH_TOKEN` trong `.env`
- ✅ Đảm bảo không có khoảng trắng thừa

### Lỗi: "domain not found"
- ✅ Kiểm tra `NGROK_DOMAIN` trong `.env`
- ✅ Đảm bảo domain đã được tạo trong ngrok dashboard
- ✅ Chỉ dùng domain name, không có `https://`

### URL vẫn thay đổi
- ✅ Kiểm tra có `NGROK_DOMAIN` trong `.env` không
- ✅ Kiểm tra domain có tồn tại trong ngrok dashboard không
- ✅ Restart server sau khi thêm `NGROK_DOMAIN`

## 💡 Lưu ý

- **Free plan**: 1 reserved domain miễn phí
- **URL cố định**: Chỉ hoạt động khi có authtoken + reserved domain
- **Không cần restart**: URL sẽ giữ nguyên mỗi lần restart server
- **PayPal**: Return URL và Cancel URL được cấu hình tự động trong code

## 📚 Tài liệu tham khảo

- Ngrok Dashboard: https://dashboard.ngrok.com/
- Ngrok Docs: https://ngrok.com/docs
- Reserved Domains: https://ngrok.com/docs/cloud-edge/domains/

