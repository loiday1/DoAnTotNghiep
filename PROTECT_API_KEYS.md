# 🔒 Hướng Dẫn Bảo Vệ API Keys Khi Push Lên GitHub

## ✅ Đã Thực Hiện

1. ✅ File `.env` đã được thêm vào `.gitignore`
2. ✅ File `server/.env` đã được xóa khỏi Git tracking
3. ✅ Tạo file `.env.example` làm mẫu (không chứa keys thật)
4. ✅ Đã xóa tất cả hardcoded credentials trong code

---

## 📋 Checklist Trước Khi Push

### ✅ Đảm bảo các file sau KHÔNG được commit:
- [x] `server/.env`
- [x] `client/.env`
- [x] `.env` (root)
- [x] Bất kỳ file `.env.*` nào (trừ `.env.example`)

### ✅ Kiểm tra không có keys trong code:
- [x] Không có API keys hardcoded
- [x] Không có secrets trong comments
- [x] Không có credentials trong code

---

## 🚀 Cách Sử Dụng

### 1. Sau khi clone repository:

```bash
# Copy file mẫu
cp server/.env.example server/.env

# Chỉnh sửa file .env với keys thật của bạn
# KHÔNG commit file .env này!
```

### 2. Tạo JWT Secret mạnh:

```bash
# Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Hoặc Linux/Mac:
openssl rand -base64 32
```

### 3. Lấy các API Keys:

- **Google Gemini AI**: https://makersuite.google.com/app/apikey
- **PayPal**: https://developer.paypal.com/
- **MoMo**: https://developers.momo.vn/
- **Google OAuth**: https://console.cloud.google.com/

---

## ⚠️ Nếu Đã Vô Tình Commit .env

Nếu bạn đã commit file `.env` lên GitHub trước đó:

### Bước 1: Xóa khỏi Git history
```bash
git rm --cached server/.env
git commit -m "Remove .env from tracking"
```

### Bước 2: Xóa khỏi Git history (nếu cần)
```bash
# CẢNH BÁO: Chỉ làm nếu thực sự cần thiết
# Sẽ thay đổi toàn bộ Git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch server/.env" \
  --prune-empty --tag-name-filter cat -- --all
```

### Bước 3: Đổi tất cả keys đã bị lộ
- Tạo JWT_SECRET mới
- Tạo lại PayPal credentials
- Tạo lại MoMo credentials
- Tạo lại Google API keys

---

## 🔍 Kiểm Tra Trước Khi Push

```bash
# Kiểm tra xem có file .env nào được track không
git ls-files | grep "\.env"

# Nếu có output, cần xóa khỏi tracking:
git rm --cached <file-path>

# Kiểm tra xem có keys nào trong code không
git grep -i "api.*key\|secret\|password" -- "*.js" "*.jsx" "*.ts" "*.tsx"
```

---

## 📝 Lưu Ý Quan Trọng

1. **KHÔNG BAO GIỜ** commit file `.env`
2. **KHÔNG BAO GIỜ** hardcode keys trong code
3. **LUÔN** sử dụng `process.env.VARIABLE_NAME`
4. **ĐỔI** tất cả keys nếu vô tình commit
5. **SỬ DỤNG** `.env.example` để làm mẫu

---

## 🛡️ Bảo Vệ Thêm

### GitHub Secrets (cho CI/CD):
Nếu sử dụng GitHub Actions, thêm secrets vào:
- Settings → Secrets and variables → Actions
- Thêm các biến môi trường cần thiết

### Environment Variables trong Production:
- Sử dụng hosting platform's environment variables
- Không lưu trong code hoặc config files
- Sử dụng secret management services (AWS Secrets Manager, etc.)

---

## ✅ Kết Quả

Sau khi thực hiện:
- ✅ File `.env` không được track bởi Git
- ✅ File `.env.example` được commit (không có keys thật)
- ✅ Không có keys hardcoded trong code
- ✅ An toàn để push lên GitHub

