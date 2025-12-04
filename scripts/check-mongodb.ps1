# PowerShell script để kiểm tra và khởi động MongoDB trên Windows

Write-Host "`n🔍 Kiểm tra MongoDB...`n" -ForegroundColor Cyan

# Kiểm tra port 27017
$port = 27017
$connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue

if ($connection) {
    Write-Host "✅ MongoDB đang chạy trên port $port!" -ForegroundColor Green
    Write-Host "✅ Bạn có thể khởi động server ngay bây giờ.`n" -ForegroundColor Green
    exit 0
}

Write-Host "❌ MongoDB không chạy trên port $port`n" -ForegroundColor Red

# Kiểm tra MongoDB service
$service = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue

if ($service) {
    if ($service.Status -eq "Running") {
        Write-Host "⚠️  MongoDB service đang chạy nhưng port không mở." -ForegroundColor Yellow
        Write-Host "📝 Có thể MongoDB đang chạy trên port khác hoặc có vấn đề cấu hình.`n" -ForegroundColor Yellow
        exit 1
    } elseif ($service.Status -eq "Stopped") {
        Write-Host "📋 MongoDB service đã được cài đặt nhưng chưa chạy." -ForegroundColor Yellow
        Write-Host "🔄 Đang thử khởi động service...`n" -ForegroundColor Cyan
        
        try {
            Start-Service -Name "MongoDB" -ErrorAction Stop
            Write-Host "✅ MongoDB service đã được khởi động!`n" -ForegroundColor Green
            Start-Sleep -Seconds 3
            
            # Kiểm tra lại port
            $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($connection) {
                Write-Host "✅ MongoDB đã sẵn sàng! Bạn có thể khởi động server.`n" -ForegroundColor Green
                exit 0
            } else {
                Write-Host "⚠️  Service đã khởi động nhưng port vẫn chưa mở." -ForegroundColor Yellow
                Write-Host "📝 Vui lòng kiểm tra lại cấu hình MongoDB.`n" -ForegroundColor Yellow
                exit 1
            }
        } catch {
            Write-Host "❌ Không thể khởi động MongoDB service: $_" -ForegroundColor Red
            Write-Host "📝 Cần chạy PowerShell với quyền Administrator để khởi động service.`n" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "📋 MongoDB service chưa được cài đặt.`n" -ForegroundColor Yellow
}

# Hiển thị hướng dẫn
Write-Host "📝 ========================================" -ForegroundColor Cyan
Write-Host "📝 HƯỚNG DẪN KHỞI ĐỘNG MONGODB" -ForegroundColor Cyan
Write-Host "📝 ========================================`n" -ForegroundColor Cyan

Write-Host "🔹 CÁCH 1: Khởi động MongoDB Service" -ForegroundColor Yellow
Write-Host "   Mở PowerShell với quyền Administrator và chạy:" -ForegroundColor White
Write-Host "   > net start MongoDB`n" -ForegroundColor Gray

Write-Host "🔹 CÁCH 2: Chạy MongoDB thủ công" -ForegroundColor Yellow
Write-Host "   Tìm thư mục cài đặt MongoDB và chạy:" -ForegroundColor White
Write-Host "   > mongod --dbpath `"C:\data\db`"`n" -ForegroundColor Gray

Write-Host "🔹 CÁCH 3: Dùng MongoDB Compass" -ForegroundColor Yellow
Write-Host "   1. Mở MongoDB Compass" -ForegroundColor White
Write-Host "   2. Click `"Connect`" để kết nối`n" -ForegroundColor White

Write-Host "🔹 CÁCH 4: Dùng MongoDB Atlas (Cloud - Khuyến nghị)" -ForegroundColor Yellow
Write-Host "   1. Đăng ký tại https://www.mongodb.com/cloud/atlas" -ForegroundColor White
Write-Host "   2. Tạo cluster miễn phí" -ForegroundColor White
Write-Host "   3. Cập nhật MONGO_URI trong file .env`n" -ForegroundColor White

Write-Host "📝 ========================================`n" -ForegroundColor Cyan

exit 1

