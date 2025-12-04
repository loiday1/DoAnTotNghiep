# 🔧 Hướng dẫn Khởi động MongoDB

## ❌ Lỗi: `ECONNREFUSED 127.0.0.1:27017`

Lỗi này xảy ra khi **MongoDB server chưa được khởi động**.

---

## ✅ CÁCH KHẮC PHỤC

### 🔹 CÁCH 1: Khởi động MongoDB Service (Windows)

1. **Mở PowerShell/CMD với quyền Administrator**
   - Click chuột phải vào PowerShell/CMD
   - Chọn "Run as administrator"

2. **Khởi động MongoDB service:**
   ```powershell
   net start MongoDB
   ```

3. **Kiểm tra service đã chạy:**
   ```powershell
   Get-Service -Name MongoDB
   ```

---

### 🔹 CÁCH 2: Chạy MongoDB thủ công

1. **Tìm thư mục cài đặt MongoDB:**
   - Thường là: `C:\Program Files\MongoDB\Server\x.x\bin`
   - Hoặc: `C:\mongodb\bin`

2. **Tạo thư mục data (nếu chưa có):**
   ```powershell
   mkdir C:\data\db
   ```

3. **Chạy MongoDB:**
   ```powershell
   cd "C:\Program Files\MongoDB\Server\x.x\bin"
   .\mongod.exe --dbpath "C:\data\db"
   ```

4. **Giữ cửa sổ này mở** - MongoDB sẽ chạy trong cửa sổ này.

---

### 🔹 CÁCH 3: Dùng MongoDB Compass

1. **Mở MongoDB Compass**
2. **Click nút "Connect"** (hoặc "Connect to" nếu chưa có connection)
3. Compass sẽ tự động khởi động MongoDB nếu có thể
4. Connection string: `mongodb://localhost:27017`

---

### 🔹 CÁCH 4: Dùng MongoDB Atlas (Cloud - Khuyến nghị) ⭐

**Ưu điểm:** Không cần cài đặt, luôn sẵn sàng, miễn phí 512MB

1. **Đăng ký MongoDB Atlas:**
   - Truy cập: https://www.mongodb.com/cloud/atlas
   - Đăng ký tài khoản miễn phí

2. **Tạo Cluster:**
   - Chọn "Build a Database" → "Free" (M0)
   - Chọn Cloud Provider và Region (gần Việt Nam nhất)
   - Click "Create"

3. **Tạo Database User:**
   - Username: `admin` (hoặc tên bạn muốn)
   - Password: Tạo mật khẩu mạnh
   - Click "Create Database User"

4. **Cấu hình Network Access:**
   - Click "Add IP Address"
   - Chọn "Allow Access from Anywhere" (0.0.0.0/0) hoặc thêm IP của bạn
   - Click "Confirm"

5. **Lấy Connection String:**
   - Click "Connect" → "Connect your application"
   - Copy connection string, ví dụ:
     ```
     mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/TasteTheCoffee?retryWrites=true&w=majority
     ```

6. **Cập nhật file `.env`:**
   ```env
   MONGO_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/TasteTheCoffee?retryWrites=true&w=majority
   ```
   (Thay `YOUR_PASSWORD` bằng mật khẩu bạn đã tạo)

---

## 🛠️ Script Tự động Kiểm tra

### Sử dụng Node.js script:
```bash
cd Testhecooffee/server
npm run check-mongo
```

### Sử dụng PowerShell script:
```powershell
cd Testhecooffee/scripts
.\check-mongodb.ps1
```

Script sẽ:
- ✅ Kiểm tra MongoDB có đang chạy không
- 🔄 Tự động khởi động service nếu có thể
- 📝 Hiển thị hướng dẫn nếu cần thiết

---

## 🔍 Kiểm tra MongoDB đã chạy

### Kiểm tra port:
```powershell
Test-NetConnection -ComputerName localhost -Port 27017
```

### Kiểm tra process:
```powershell
Get-Process -Name mongod -ErrorAction SilentlyContinue
```

### Kiểm tra service:
```powershell
Get-Service -Name MongoDB
```

---

## 📝 Lưu ý

1. **MongoDB phải chạy trước khi khởi động server**
2. **Giữ cửa sổ MongoDB mở** nếu chạy thủ công (Cách 2)
3. **MongoDB Atlas** là lựa chọn tốt nhất cho development (miễn phí, không cần cài đặt)
4. **Connection string** trong `.env` phải đúng format

---

## 🆘 Vẫn không kết nối được?

1. Kiểm tra firewall có chặn port 27017 không
2. Kiểm tra MongoDB đã được cài đặt đúng chưa
3. Thử dùng MongoDB Atlas (Cách 4) - đơn giản nhất
4. Kiểm tra file `.env` có đúng connection string không

---

## 📞 Liên hệ

Nếu vẫn gặp vấn đề, vui lòng cung cấp:
- Hệ điều hành (Windows/Mac/Linux)
- Phiên bản MongoDB (nếu có)
- Thông báo lỗi đầy đủ

