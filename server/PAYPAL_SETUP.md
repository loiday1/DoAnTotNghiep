# 💳 Hướng dẫn cấu hình PayPal Sandbox

## 📋 Bước 1: Tạo PayPal Sandbox Account

1. Truy cập: https://developer.paypal.com/
2. Đăng nhập hoặc đăng ký tài khoản PayPal
3. Vào **Dashboard** → **Sandbox** → **Accounts**

## 🔑 Bước 2: Tạo Sandbox App và lấy Credentials

1. Vào **Dashboard** → **My Apps & Credentials**
2. Click **Create App**
3. Đặt tên app (ví dụ: "TasteTheCoffee")
4. Chọn **Merchant** account type
5. Click **Create App**
6. Copy **Client ID** và **Secret**

## ⚙️ Bước 3: Cấu hình trong .env

Thêm vào file `.env` trong thư mục `server/`:

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your-client-id-here
PAYPAL_CLIENT_SECRET=your-client-secret-here
PAYPAL_ENVIRONMENT=sandbox
USD_TO_VND_RATE=25000
```

**Lưu ý:**
- `PAYPAL_CLIENT_ID`: Lấy từ PayPal Developer Dashboard
- `PAYPAL_CLIENT_SECRET`: Lấy từ PayPal Developer Dashboard
- `PAYPAL_ENVIRONMENT`: `sandbox` (cho test) hoặc `live` (cho production)
- `USD_TO_VND_RATE`: Tỷ giá USD sang VND (mặc định 25,000)

## 🧪 Bước 4: Tạo Sandbox Test Accounts

1. Vào **Dashboard** → **Sandbox** → **Accounts**
2. Click **Create Account**
3. Chọn **Personal** hoặc **Business**
4. Tạo 2 accounts:
   - **Buyer Account**: Để test thanh toán
   - **Merchant Account**: Để nhận tiền

## 🚀 Bước 5: Test thanh toán

1. **Khởi động server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Test thanh toán:**
   - Vào checkout page
   - Chọn "Thanh toán qua PayPal"
   - Điền thông tin và click "Xác nhận thanh toán"
   - Sẽ redirect đến PayPal Sandbox
   - Đăng nhập bằng Sandbox Buyer Account
   - Approve payment

## 📝 Bước 6: Kiểm tra Order

Sau khi thanh toán thành công:
- Order sẽ được cập nhật với `paymentStatus: "paid"`
- `paypalOrderId`: PayPal Order ID
- `paypalTransactionId`: PayPal Transaction ID

## 🔍 Debug

### Kiểm tra logs:
- `[PayPal] ===== Bắt đầu tạo PayPal payment ======`
- `[PayPal] Currency conversion:` - Kiểm tra chuyển đổi tiền tệ
- `[PayPal] Order created:` - PayPal Order ID
- `[PayPal Return] Capture result:` - Kết quả capture

### Lỗi thường gặp:

1. **"PayPal Client ID và Client Secret chưa được cấu hình"**
   - Kiểm tra `.env` có `PAYPAL_CLIENT_ID` và `PAYPAL_CLIENT_SECRET`
   - Restart server sau khi thêm

2. **"Invalid credentials"**
   - Kiểm tra Client ID và Secret có đúng không
   - Đảm bảo đang dùng Sandbox credentials (không phải Live)

3. **"Currency conversion error"**
   - Kiểm tra `USD_TO_VND_RATE` trong `.env`
   - Đảm bảo là số hợp lệ

## 💡 Lưu ý

- **Sandbox**: Dùng để test, không cần thẻ thật
- **Live**: Dùng cho production, cần verify business account
- **Tỷ giá**: Có thể cập nhật `USD_TO_VND_RATE` theo tỷ giá thực tế
- **Return URL**: Tự động dùng ngrok URL nếu có

## 📚 Tài liệu tham khảo

- PayPal Developer: https://developer.paypal.com/
- PayPal Sandbox: https://developer.paypal.com/dashboard/
- PayPal API Docs: https://developer.paypal.com/docs/api/orders/v2/

