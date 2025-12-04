/**
 * Script kiểm tra và hướng dẫn khởi động MongoDB
 */

const { exec } = require('child_process');
const net = require('net');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/TasteTheCoffee';
const PORT = 27017;

// Kiểm tra port 27017 có đang mở không
function checkMongoDBPort(callback) {
  const socket = new net.Socket();
  socket.setTimeout(2000);
  
  socket.on('connect', () => {
    socket.destroy();
    callback(true);
  });
  
  socket.on('timeout', () => {
    socket.destroy();
    callback(false);
  });
  
  socket.on('error', () => {
    callback(false);
  });
  
  socket.connect(PORT, 'localhost');
}

// Kiểm tra MongoDB service trên Windows
function checkWindowsService(callback) {
  exec('sc query MongoDB', (error, stdout) => {
    if (error) {
      callback(null); // Service không tồn tại
      return;
    }
    
    if (stdout.includes('RUNNING')) {
      callback(true);
    } else if (stdout.includes('STOPPED')) {
      callback(false);
    } else {
      callback(null);
    }
  });
}

// Khởi động MongoDB service trên Windows
function startWindowsService(callback) {
  console.log('🔄 Đang khởi động MongoDB service...');
  exec('net start MongoDB', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Không thể khởi động MongoDB service:', error.message);
      callback(false);
      return;
    }
    console.log('✅ MongoDB service đã được khởi động!');
    callback(true);
  });
}

// Main function
async function main() {
  console.log('\n🔍 Kiểm tra MongoDB...\n');
  
  // Kiểm tra port
  checkMongoDBPort((isPortOpen) => {
    if (isPortOpen) {
      console.log('✅ MongoDB đang chạy trên port 27017!');
      console.log('✅ Bạn có thể khởi động server ngay bây giờ.\n');
      process.exit(0);
      return;
    }
    
    console.log('❌ MongoDB không chạy trên port 27017\n');
    
    // Kiểm tra service trên Windows
    checkWindowsService((serviceStatus) => {
      if (serviceStatus === true) {
        console.log('⚠️  MongoDB service đang chạy nhưng port không mở.');
        console.log('📝 Có thể MongoDB đang chạy trên port khác hoặc có vấn đề cấu hình.\n');
        process.exit(1);
      } else if (serviceStatus === false) {
        console.log('📋 MongoDB service đã được cài đặt nhưng chưa chạy.');
        console.log('🔄 Đang thử khởi động service...\n');
        
        startWindowsService((success) => {
          if (success) {
            // Đợi 3 giây rồi kiểm tra lại
            setTimeout(() => {
              checkMongoDBPort((isOpen) => {
                if (isOpen) {
                  console.log('\n✅ MongoDB đã được khởi động thành công!');
                  console.log('✅ Bạn có thể khởi động server ngay bây giờ.\n');
                  process.exit(0);
                } else {
                  console.log('\n⚠️  Service đã khởi động nhưng port vẫn chưa mở.');
                  console.log('📝 Vui lòng kiểm tra lại cấu hình MongoDB.\n');
                  process.exit(1);
                }
              });
            }, 3000);
          } else {
            showManualInstructions();
          }
        });
      } else {
        showManualInstructions();
      }
    });
  });
}

function showManualInstructions() {
  console.log('\n📝 ========================================');
  console.log('📝 HƯỚNG DẪN KHỞI ĐỘNG MONGODB');
  console.log('📝 ========================================\n');
  
  console.log('🔹 CÁCH 1: Khởi động MongoDB Service (Windows)');
  console.log('   Mở PowerShell/CMD với quyền Administrator và chạy:');
  console.log('   > net start MongoDB\n');
  
  console.log('🔹 CÁCH 2: Chạy MongoDB thủ công');
  console.log('   Tìm thư mục cài đặt MongoDB (thường là C:\\Program Files\\MongoDB\\Server\\x.x\\bin)');
  console.log('   Mở CMD/PowerShell và chạy:');
  console.log('   > mongod --dbpath "C:\\data\\db"\n');
  console.log('   (Tạo thư mục C:\\data\\db nếu chưa có)\n');
  
  console.log('🔹 CÁCH 3: Dùng MongoDB Compass');
  console.log('   1. Mở MongoDB Compass');
  console.log('   2. Click "Connect" để kết nối');
  console.log('   3. Compass sẽ tự động khởi động MongoDB nếu có thể\n');
  
  console.log('🔹 CÁCH 4: Dùng MongoDB Atlas (Cloud - Khuyến nghị)');
  console.log('   1. Đăng ký tại https://www.mongodb.com/cloud/atlas');
  console.log('   2. Tạo cluster miễn phí');
  console.log('   3. Lấy connection string và cập nhật trong file .env:');
  console.log(`      MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/TasteTheCoffee\n`);
  
  console.log('📝 ========================================\n');
  console.log(`🔗 Connection URI hiện tại: ${MONGO_URI}\n`);
  
  process.exit(1);
}

// Chạy script
main();

