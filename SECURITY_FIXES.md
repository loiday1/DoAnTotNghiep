# 🔧 Hướng Dẫn Sửa Các Lỗi Bảo Mật

## ✅ Đã Sửa

### 1. ✅ Authorization Bypass trong cancelOrder
**File:** `server/controllers/orderController.js`, `server/routes/orderRoutes.js`

**Đã sửa:**
- Thêm middleware `verifyToken` vào route `/api/orders/:orderId/cancel`
- Lấy `userId` từ JWT token (`req.user.id`) thay vì từ `req.body`
- Đảm bảo chỉ chủ đơn hàng mới có thể hủy đơn của mình

### 2. ✅ Undefined Variable Bug
**File:** `server/controllers/orderController.js`

**Đã sửa:**
- Thay `status` bằng `order.status` trong logic kiểm tra

### 3. ✅ Hardcoded MoMo Credentials
**File:** `server/controllers/paymentController.js`

**Đã sửa:**
- Xóa tất cả hardcoded credentials
- Bắt buộc phải có trong `.env`
- Trả về error nếu thiếu credentials

### 4. ✅ JWT Secret Fallback
**File:** `server/middleware/authMiddleware.js`, `server/routes/admin.js`

**Đã sửa:**
- Xóa fallback value "your_jwt_secret_here"
- Bắt buộc phải có JWT_SECRET trong `.env`
- Throw error khi khởi động nếu thiếu

---

## ⚠️ Cần Sửa Thêm

### 5. XSS Vulnerability (Đã có DOMPurify nhưng cần kiểm tra)
**File:** `client/src/components/AICoffeePage.jsx`

**Tình trạng:**
- ✅ Đã có DOMPurify import
- ✅ Đã sử dụng `DOMPurify.sanitize()` trong `formatAnswerHtml`
- ⚠️ Cần đảm bảo sanitize được gọi đúng cách

**Kiểm tra:**
```javascript
// Dòng 24: Đã có sanitize
return DOMPurify.sanitize(marked.parse(cleanedText));
```

**Khuyến nghị:**
- Đảm bảo tất cả HTML từ AI response đều được sanitize
- Có thể thêm sanitize một lần nữa trước khi render

---

## 📋 Checklist Bảo Mật

### Cần Thêm:
- [ ] Rate limiting cho API endpoints
- [ ] Input validation middleware (express-validator)
- [ ] Security headers (helmet.js)
- [ ] CSRF protection
- [ ] Logging và monitoring
- [ ] Error handling cải thiện (không lộ thông tin chi tiết trong production)

### Đã Có:
- [x] JWT authentication
- [x] Password hashing (bcryptjs)
- [x] CORS configuration
- [x] DOMPurify cho XSS protection
- [x] ObjectId validation
- [x] Admin authorization

---

## 🚀 Các Bước Tiếp Theo

1. **Cài đặt dependencies bảo mật:**
```bash
cd server
npm install express-validator helmet express-rate-limit
```

2. **Thêm rate limiting:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100 // giới hạn 100 requests
});

app.use('/api/', limiter);
```

3. **Thêm security headers:**
```javascript
const helmet = require('helmet');
app.use(helmet());
```

4. **Cải thiện error handling:**
```javascript
// Chỉ trả về error chi tiết trong development
if (process.env.NODE_ENV === 'development') {
  res.status(500).json({ error: err.message });
} else {
  res.status(500).json({ message: 'Internal server error' });
}
```

---

## 📝 Lưu Ý

- **Không commit file `.env`** lên Git
- **Đảm bảo `.env` có đầy đủ các biến cần thiết**
- **Review code trước khi deploy production**
- **Thường xuyên cập nhật dependencies**

