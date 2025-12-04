require("dotenv").config();
const mongoose = require("mongoose");
const PromoCode = require("./models/PromoCode");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/tastethecoffee";

async function seedPromoCodes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Xóa các mã cũ (optional)
    // await PromoCode.deleteMany({});

    const promoCodes = [
      {
        code: "WELCOME10",
        description: "Giảm 10% cho khách hàng mới",
        discountType: "percentage",
        discountValue: 10,
        minOrderAmount: 100000,
        maxDiscountAmount: 50000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 năm
        usageLimit: null, // Không giới hạn
        isActive: true,
      },
      {
        code: "SAVE50K",
        description: "Giảm 50.000₫ cho đơn hàng từ 300.000₫",
        discountType: "fixed",
        discountValue: 50000,
        minOrderAmount: 300000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: 1000,
        isActive: true,
      },
      {
        code: "VIP20",
        description: "Giảm 20% cho khách VIP",
        discountType: "percentage",
        discountValue: 20,
        minOrderAmount: 200000,
        maxDiscountAmount: 100000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 tháng
        usageLimit: null,
        isActive: true,
      },
      {
        code: "FREESHIP",
        description: "Miễn phí vận chuyển (giảm 30.000₫)",
        discountType: "fixed",
        discountValue: 30000,
        minOrderAmount: 150000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 tháng
        usageLimit: 500,
        isActive: true,
      },
    ];

    for (const promo of promoCodes) {
      const existing = await PromoCode.findOne({ code: promo.code });
      if (existing) {
        console.log(`⚠️  Mã ${promo.code} đã tồn tại, bỏ qua...`);
      } else {
        await PromoCode.create(promo);
        console.log(`✅ Đã tạo mã khuyến mãi: ${promo.code}`);
      }
    }

    console.log("\n✅ Hoàn tất seed mã khuyến mãi!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi seed mã khuyến mãi:", err);
    process.exit(1);
  }
}

seedPromoCodes();

