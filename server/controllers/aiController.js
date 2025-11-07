const mongoose = require("mongoose");
const ChatHistory = require("../models/ChatHistory");
const Product = require("../models/Product");
require("dotenv").config();

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// 🔹 Shuffle mảng
const shuffleArray = (array) =>
  array
    .map((v) => ({ v, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ v }) => v);

// 🔹 Loại trùng sản phẩm theo id
const uniqueProducts = (products) => {
  const seen = new Set();
  return products.filter((p) => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
};

// ✅ POST /api/ai/make-coffee
const makeCoffee = async (req, res) => {
  try {
    const { prompt, categorySlug } = req.body;
    const userId = req.user?._id;

    if (!prompt?.trim())
      return res
        .status(400)
        .json({ success: false, message: "⚠️ Vui lòng nhập yêu cầu pha cà phê." });

    if (!userId || !mongoose.Types.ObjectId.isValid(userId))
      return res
        .status(401)
        .json({ success: false, message: "⚠️ Người dùng chưa được xác thực." });

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey)
      return res
        .status(500)
        .json({ success: false, message: "❌ Thiếu GOOGLE_API_KEY trong file .env." });

    const MODEL_NAME = "gemini-2.0-flash";

    // 🧠 Prompt gửi đến AI
    const fullPrompt = `
Bạn là **Barista AI chuyên nghiệp** tại **TasteTheCoffee**, có hơn 10 năm kinh nghiệm.  
Khách hàng hỏi: **"${prompt}"**

🧠 Nhiệm vụ của bạn:
- Trả lời **bằng tiếng Việt**, **rõ ràng và chi tiết nhất có thể**.  
- Giữ nguyên **định dạng Markdown** để dễ hiển thị.
- Tránh tự động thêm phần "💡 Gợi ý sản phẩm phù hợp", chỉ tập trung vào mô tả và hướng dẫn pha chế.
`;

    // 🔸 Gọi API Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!data?.candidates?.length)
      throw new Error("Không nhận được phản hồi hợp lệ từ API Google Gemini.");

    let aiText =
      data.candidates[0].content?.parts?.[0]?.text?.trim() ||
      "❌ Không nhận được phản hồi từ AI.";
    aiText = aiText.split("💡 Gợi ý sản phẩm phù hợp")[0].trim();

    // 🔎 Tạo từ khóa tìm kiếm
    const normalizedPrompt = prompt
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const keywords = normalizedPrompt.split(/\s+/).filter((w) => w.length > 1);

    // 1️⃣ Tìm sản phẩm theo prompt/keywords
    let suggestedProducts = [];
    try {
      const directQuery = {
        $or: [
          { name: { $regex: prompt, $options: "i" } },
          { productCode: { $regex: prompt, $options: "i" } },
          ...keywords.map((w) => ({ name: { $regex: w, $options: "i" } })),
        ],
      };
      suggestedProducts = await Product.find(directQuery)
        .select("name slug price image category productCode")
        .lean();
    } catch (err) {
      console.error("⚠️ Lỗi tìm sản phẩm theo prompt:", err);
    }

    // 2️⃣ Fallback nếu chưa đủ 3 sản phẩm
    if (suggestedProducts.length < 3) {
      let categoryFilter = {};
      if (categorySlug) categoryFilter = { category: categorySlug };
      else if (keywords.some((w) => ["tienloi", "hoatan", "goi", "nhanh"].includes(w)))
        categoryFilter = { category: "ca-phe-tien-loi" };
      else if (keywords.some((w) => ["truyenthong", "phin", "sua", "da"].includes(w)))
        categoryFilter = { category: "ca-phe-truyen-thong" };
      else if (keywords.some((w) => ["nguyenchat", "hat", "rangxay"].includes(w)))
        categoryFilter = { category: "ca-phe-nguyen-chat" };

      try {
        const fallbackProducts = await Product.find(categoryFilter)
          .select("name slug price image category productCode")
          .lean();
        suggestedProducts = [...suggestedProducts, ...fallbackProducts];
        suggestedProducts = uniqueProducts(suggestedProducts);
      } catch (err) {
        console.error("⚠️ Lỗi fallback theo category:", err);
      }
    }

    // 3️⃣ Lấy tất cả id gợi ý đã dùng trong lịch sử
    const allSuggestedIds = await ChatHistory.find({ userId }).distinct(
      "suggestions.id"
    );
    suggestedProducts = suggestedProducts.filter((p) => {
      const id = p._id?.toString() || p.slug;
      return !allSuggestedIds.includes(id);
    });

    // 4️⃣ Shuffle và lấy tối đa 3 sản phẩm
    suggestedProducts = shuffleArray(suggestedProducts).slice(0, 3);

    // ✅ 5️⃣ Gán id ổn định + thêm slug (sửa lỗi hiển thị frontend)
    const mappedSuggestions = suggestedProducts.map((item, idx) => ({
      id: item._id?.toString() || item.slug || `suggestion_${Date.now()}_${idx}`,
      name: item.name,
      slug: item.slug || "", // ✅ thêm dòng này
      price: item.price,
      image: item.image,
      category: item.category,
      productCode: item.productCode,
      categorySlug:
        item.category === "ca-phe-nguyen-chat"
          ? "ca-phe-nguyen-chat"
          : item.category === "ca-phe-truyen-thong"
          ? "ca-phe-truyen-thong"
          : item.category === "ca-phe-tien-loi"
          ? "ca-phe-tien-loi"
          : "ca-phe-khac",
    }));

    // 💾 Lưu lịch sử chat
    const newChat = await ChatHistory.create({
      userId,
      question: prompt.trim(),
      answer: aiText,
      suggestions: mappedSuggestions,
    });

    return res.json({
      success: true,
      chat: newChat,
      suggestions: mappedSuggestions,
    });
  } catch (err) {
    console.error("❌ Lỗi xử lý AI:", err);
    return res.status(500).json({
      success: false,
      message: "❌ Đã xảy ra lỗi khi xử lý yêu cầu AI.",
      error: err.message,
    });
  }
};

// ✅ GET /api/ai/history
const getHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "⚠️ Người dùng chưa được xác thực." });

    const chats = await ChatHistory.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, history: chats });
  } catch (err) {
    console.error("❌ Lỗi lấy lịch sử:", err);
    return res.status(500).json({
      success: false,
      message: "❌ Lỗi khi lấy lịch sử chat.",
      error: err.message,
    });
  }
};

// ✅ DELETE /api/ai/history
const clearHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "⚠️ Người dùng chưa được xác thực." });

    await ChatHistory.deleteMany({ userId });
    return res.json({
      success: true,
      message: "✅ Đã xóa toàn bộ lịch sử chat.",
    });
  } catch (err) {
    console.error("❌ Lỗi xóa lịch sử:", err);
    return res.status(500).json({
      success: false,
      message: "❌ Lỗi server khi xóa lịch sử.",
      error: err.message,
    });
  }
};

module.exports = { makeCoffee, getHistory, clearHistory };
