const crypto = require("crypto");
const moment = require("moment");

/**
 * Tạo thanh toán (VNPay hoặc COD)
 */
exports.createPayment = async (req, res) => {
  try {
    const { amount, method, userId, info, items } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Số tiền không hợp lệ!" });
    }

    if (method === "cod") {
      return res.json({ message: "✅ Đặt hàng thành công (COD)!", payUrl: null });
    }

    if (method === "vnpay") {
      const payUrl = createVNPayUrl({ amount, userId, info, items });
      return res.json({ payUrl });
    }

    return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ!" });
  } catch (error) {
    console.error("❌ Payment error:", error.message);
    res.status(500).json({ message: "Lỗi khi tạo thanh toán!" });
  }
};

/**
 * Tạo URL VNPay sandbox
 */
function createVNPayUrl({ amount, userId, info, items }) {
  const date = new Date();
  const createDate = moment(date).format("YYYYMMDDHHmmss");
  const vnp_TxnRef = date.getTime().toString(); // mã giao dịch duy nhất
  const vnp_OrderInfo = `Thanh toán đơn hàng #${vnp_TxnRef}`;

  const vnp_TmnCode = process.env.VNP_TMNCODE;
  const vnp_HashSecret = process.env.VNP_HASHSECRET;
  const vnp_Url = process.env.VNP_URL;
  const vnp_ReturnUrl = process.env.VNP_RETURN_URL;

  const vnp_Amount = (amount * 100).toString(); // VNPay nhân 100
  const vnp_IpAddr = "127.0.0.1";

  // Các tham số VNPay bắt buộc
  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode,
    vnp_Amount,
    vnp_CurrCode: "VND",
    vnp_TxnRef,
    vnp_OrderInfo,
    vnp_OrderType: "billpayment",
    vnp_Locale: "vn",
    vnp_ReturnUrl,
    vnp_IpAddr,
    vnp_CreateDate: createDate,
  };

  vnp_Params = sortObject(vnp_Params);

  // Tạo chữ ký
  const signData = Object.keys(vnp_Params)
    .map((key) => `${key}=${vnp_Params[key]}`)
    .join("&");

  const hmac = crypto.createHmac("sha512", vnp_HashSecret);
  const signed = hmac.update(signData, "utf-8").digest("hex");

  vnp_Params["vnp_SecureHash"] = signed;

  const paymentUrl = `${vnp_Url}?${new URLSearchParams(vnp_Params).toString()}`;
  console.log("🔗 VNPay Payment URL:", paymentUrl);
  return paymentUrl;
}

/**
 * Callback VNPay sau khi thanh toán
 */
exports.vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = { ...req.query };
    const secureHash = vnp_Params["vnp_SecureHash"];

    // Xoá chữ ký để tính lại
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const sortedParams = sortObject(vnp_Params);

    const signData = Object.keys(sortedParams)
      .map((key) => `${key}=${sortedParams[key]}`)
      .join("&");

    const hmac = crypto.createHmac("sha512", process.env.VNP_HASHSECRET);
    const signed = hmac.update(signData, "utf-8").digest("hex");

    console.log("✅ VNPay callback params:", vnp_Params);
    console.log("✅ SecureHash VNPay:", secureHash);
    console.log("✅ SecureHash server:", signed);

    if (secureHash === signed) {
      const responseCode = vnp_Params["vnp_ResponseCode"];
      if (responseCode === "00") {
        console.log("🎉 Thanh toán thành công!");
        return res.redirect(
          "https://bionomical-dortha-connectively.ngrok-free.dev/payment-success?status=success"
        );
      } else {
        console.log("⚠️ Thanh toán thất bại:", responseCode);
        return res.redirect(
          "https://bionomical-dortha-connectively.ngrok-free.dev/payment-failed?status=fail"
        );
      }
    } else {
      console.error("🚨 Sai chữ ký VNPay!");
      return res.redirect(
        "https://bionomical-dortha-connectively.ngrok-free.dev/payment-failed?status=invalid"
      );
    }
  } catch (err) {
    console.error("❌ VNPay Return Error:", err.message);
    return res.status(500).send("VNPay callback error!");
  }
};

/**
 * Sắp xếp object alphabetically theo key
 */
function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => (sorted[key] = obj[key]));
  return sorted;
}
