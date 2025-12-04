# Hướng dẫn Push Code lên GitHub

## Cách 1: Sử dụng Personal Access Token (Khuyến nghị)

### Bước 1: Tạo Token
1. Vào: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Đặt tên: "DoAnTotNghiep Push"
4. Chọn quyền: `repo` (full control)
5. Click "Generate token"
6. **Copy token ngay** (chỉ hiển thị 1 lần)

### Bước 2: Push với Token
```bash
cd D:\Coffee\Testhecooffee
git push https://YOUR_TOKEN@github.com/phanphuocloi/DoAnTotNghiep.git main
```
(Thay `YOUR_TOKEN` bằng token vừa copy)

## Cách 2: Sử dụng Git Credential Manager

### Windows:
```bash
# Xóa credentials cũ
git credential-manager-core erase
host=github.com
protocol=https

# Push lại (sẽ yêu cầu đăng nhập)
git push -u origin main
# Username: phanphuocloi
# Password: [Dán Personal Access Token]
```

## Cách 3: Sử dụng GitHub Desktop hoặc VS Code

1. Mở project trong VS Code
2. Mở Source Control panel (Ctrl+Shift+G)
3. Click "..." → "Push"
4. Đăng nhập với tài khoản `phanphuocloi`
5. Password: sử dụng Personal Access Token

## Lưu ý:
- Không commit file `.env` (đã có trong .gitignore)
- Không commit `node_modules/` (đã có trong .gitignore)
- Đảm bảo đã commit tất cả thay đổi trước khi push

