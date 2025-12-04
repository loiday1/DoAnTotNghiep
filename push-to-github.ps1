# Script để push code lên GitHub với Personal Access Token
# Sử dụng: .\push-to-github.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Push Code lên GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra xem đã có token chưa
$token = Read-Host "Nhập Personal Access Token (hoặc Enter để bỏ qua)"

if ($token -eq "") {
    Write-Host ""
    Write-Host "⚠️  Bạn cần Personal Access Token để push!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Cách tạo token:" -ForegroundColor Cyan
    Write-Host "1. Vào: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "2. Click 'Generate new token (classic)'" -ForegroundColor White
    Write-Host "3. Chọn quyền 'repo' (full control)" -ForegroundColor White
    Write-Host "4. Copy token và chạy lại script này" -ForegroundColor White
    Write-Host ""
    exit
}

Write-Host ""
Write-Host "🔄 Đang push code lên GitHub..." -ForegroundColor Yellow
Write-Host ""

# Push với token
$remoteUrl = "https://$token@github.com/phanphuocloi/DoAnTotNghiep.git"
git push $remoteUrl main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Push thành công!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Repository: https://github.com/phanphuocloi/DoAnTotNghiep" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Push thất bại!" -ForegroundColor Red
    Write-Host "Kiểm tra lại token hoặc quyền truy cập." -ForegroundColor Yellow
}

