const https = require("https");
const crypto = require("crypto");
const Order = require("../models/Order");
const { getNgrokUrl } = require("../utils/autoNgrok");
const paypal = require("@paypal/checkout-server-sdk");

// ==================== MoMo Payment ====================
exports.createMoMoPayment = async (req, res) => {
  try {
    const { amount, orderInfo, orderId } = req.body;

    // MoMo configuration
    // ✅ SECURITY FIX: Bắt buộc phải có credentials trong .env, không có fallback
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    
    if (!partnerCode || !accessKey || !secretKey) {
      console.error("❌ [MoMo] Missing MoMo credentials in .env file");
      return res.status(500).json({ 
        message: "Cấu hình thanh toán MoMo chưa được thiết lập. Vui lòng liên hệ admin." 
      });
    }
    const momoApiUrl = process.env.MOMO_API_URL || "https://test-payment.momo.vn/v2/gateway/api/create";
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const returnUrl = process.env.MOMO_RETURN_URL || `${backendUrl}/api/payment/momo_return`;
    const notifyUrl = process.env.MOMO_NOTIFY_URL || `${backendUrl}/api/payment/momo_notify`;
    const requestType = "captureWallet"; // hoặc "payWithATM"

    // Validate
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Số tiền thanh toán không hợp lệ" });
    }

    // Tạo orderId nếu chưa có
    const momoOrderId = orderId || `MOMO${Date.now()}`;
    const requestId = `REQ${Date.now()}`;
    const extraData = "";

    // Tạo raw signature
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo || "Thanh toan don hang"}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;

    // Tạo signature bằng HMAC SHA256
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    // Tạo request body
    const requestBody = JSON.stringify({
      partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId,
      amount,
      orderId: momoOrderId,
      orderInfo: orderInfo || "Thanh toan don hang",
      redirectUrl: returnUrl,
      ipnUrl: notifyUrl,
      lang: "vi",
      extraData,
      requestType,
      signature,
    });

    // Gửi request đến MoMo API
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(momoApiUrl, options, (momoRes) => {
      let data = "";
      momoRes.on("data", (chunk) => {
        data += chunk;
      });
      momoRes.on("end", () => {
        try {
          const result = JSON.parse(data);
          console.log("[MoMo] Response:", result);

          if (result.resultCode === 0) {
            // Thành công, trả về payUrl
            res.json({ 
              payUrl: result.payUrl,
              orderId: momoOrderId,
              requestId: requestId
            });
          } else {
            res.status(400).json({ 
              message: result.message || "Lỗi tạo thanh toán MoMo",
              resultCode: result.resultCode 
            });
          }
        } catch (err) {
          console.error("[MoMo] Parse response error:", err);
          res.status(500).json({ message: "Lỗi xử lý phản hồi từ MoMo" });
        }
      });
    });

    req.on("error", (err) => {
      console.error("[MoMo] Request error:", err);
      res.status(500).json({ message: "Lỗi kết nối đến MoMo", error: err.message });
    });

    req.write(requestBody);
    req.end();
  } catch (err) {
    console.error("[MoMo] Error:", err);
    res.status(500).json({ message: "Lỗi tạo thanh toán MoMo", error: err.message });
  }
};

// Xử lý callback từ MoMo (return URL)
exports.momoReturn = (req, res) => {
  try {
    const query = req.query;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    console.log("[MoMo Return] Received query:", query);

    const resultCode = query.resultCode;
    const orderId = query.orderId;
    const amount = query.amount;

    if (resultCode === "0") {
      // Thanh toán thành công
      res.redirect(`${clientUrl}/checkout?status=success&paymentMethod=momo&orderId=${orderId}&amount=${amount}`);
    } else {
      // Thanh toán thất bại
      const errorCode = resultCode || "unknown";
      res.redirect(`${clientUrl}/checkout?status=error&code=${errorCode}&paymentMethod=momo`);
    }
  } catch (err) {
    console.error("[MoMo Return] Error:", err);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${clientUrl}/checkout?status=error&code=system_error&paymentMethod=momo`);
  }
};

// Xử lý IPN (Instant Payment Notification) từ MoMo
exports.momoNotify = async (req, res) => {
  try {
    const data = req.body;
    const secretKey = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";

    console.log("[MoMo Notify] Received data:", data);

    // Xác thực signature
    const rawSignature = `accessKey=${data.accessKey}&amount=${data.amount}&extraData=${data.extraData}&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&orderType=${data.orderType}&partnerCode=${data.partnerCode}&payType=${data.payType}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;
    
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    if (signature !== data.signature) {
      console.error("[MoMo Notify] Invalid signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Xử lý kết quả thanh toán
    if (data.resultCode === 0) {
      // Thanh toán thành công - cập nhật đơn hàng trong database
      console.log("[MoMo Notify] Payment successful:", {
        orderId: data.orderId,
        transId: data.transId,
        amount: data.amount,
      });
      
    }

    // Trả về response cho MoMo
    res.json({
      resultCode: 0,
      message: "Success",
    });
  } catch (err) {
    console.error("[MoMo Notify] Error:", err);
    res.status(500).json({ resultCode: -1, message: "Error" });
  }
};

// ==================== PayPal Payment ====================

/**
 * Tạo PayPal client (Sandbox hoặc Live)
 */
function paypalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID || "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
  const environment = process.env.PAYPAL_ENVIRONMENT || "sandbox"; // sandbox hoặc live

  console.log("[PayPal Client] Configuration check:", {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    environment,
    clientIdLength: clientId.length,
    clientSecretLength: clientSecret.length
  });

  if (!clientId || !clientSecret) {
    const missing = [];
    if (!clientId) missing.push("PAYPAL_CLIENT_ID");
    if (!clientSecret) missing.push("PAYPAL_CLIENT_SECRET");
    throw new Error(`PayPal ${missing.join(" và ")} chưa được cấu hình trong .env. Vui lòng kiểm tra file .env trong thư mục server/`);
  }

  if (clientId.length < 20 || clientSecret.length < 20) {
    throw new Error("PayPal Client ID hoặc Client Secret không hợp lệ. Vui lòng kiểm tra lại credentials từ PayPal Developer Dashboard.");
  }

  // Tạo environment
  let paypalEnvironment;
  try {
    if (environment === "live") {
      paypalEnvironment = new paypal.core.LiveEnvironment(clientId, clientSecret);
    } else {
      paypalEnvironment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    }
  } catch (envErr) {
    console.error("[PayPal Client] Error creating environment:", envErr);
    throw new Error(`Lỗi tạo PayPal environment: ${envErr.message}`);
  }

  // Tạo client
  try {
    const client = new paypal.core.PayPalHttpClient(paypalEnvironment);
    console.log("[PayPal Client] ✅ Client created successfully");
    return client;
  } catch (clientErr) {
    console.error("[PayPal Client] Error creating client:", clientErr);
    throw new Error(`Lỗi tạo PayPal client: ${clientErr.message}`);
  }
}

/**
 * Tạo PayPal order
 */
exports.createPayPalPayment = async (req, res) => {
  try {
    console.log("[PayPal] ===== Bắt đầu tạo PayPal payment ======");
    console.log("[PayPal] Request body:", JSON.stringify(req.body, null, 2));

    const { amount, orderInfo, orderId: providedOrderId } = req.body;

    // Validate
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Số tiền thanh toán không hợp lệ" });
    }

    // Lấy return URL và cancel URL
    const ngrokUrl = getNgrokUrl();
    const backendUrl = ngrokUrl || process.env.BACKEND_URL || "http://localhost:5000";
    const returnUrl = `${backendUrl}/api/payment/paypal_return`;
    const cancelUrl = `${backendUrl}/api/payment/paypal_cancel`;

    console.log("[PayPal] Configuration:", {
      amount,
      returnUrl,
      cancelUrl,
      environment: process.env.PAYPAL_ENVIRONMENT || "sandbox"
    });

    // Chuyển đổi VND sang USD (tỷ giá tạm thời: 1 USD = 25,000 VND)
    // TODO: Có thể lấy tỷ giá thực tế từ API
    const exchangeRate = parseFloat(process.env.USD_TO_VND_RATE || "25000");
    const amountUSD = (amount / exchangeRate).toFixed(2);

    console.log("[PayPal] Currency conversion:", {
      amountVND: amount,
      exchangeRate,
      amountUSD
    });

    // Tạo PayPal client
    const client = paypalClient();

    // Tạo order request
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: providedOrderId || `ORDER_${Date.now()}`,
          description: orderInfo || "Thanh toán đơn hàng",
          amount: {
            currency_code: "USD",
            value: amountUSD,
          },
        },
      ],
      application_context: {
        brand_name: "TasteTheCoffee",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    });

    // Gọi PayPal API
    const order = await client.execute(request);
    const paypalOrderId = order.result.id;

    console.log("[PayPal] Order created:", paypalOrderId);
    console.log("[PayPal] Approval URL:", order.result.links.find(link => link.rel === "approve")?.href);

    // Lưu PayPal Order ID vào order nếu có
    if (providedOrderId) {
      try {
        const orderDoc = await Order.findById(providedOrderId);
        if (orderDoc) {
          orderDoc.paypalOrderId = paypalOrderId;
          await orderDoc.save();
          console.log("[PayPal] Order paypalOrderId updated:", orderDoc._id);
        }
      } catch (dbErr) {
        console.error("[PayPal] Error updating order:", dbErr);
      }
    }

    // Tìm approval URL
    const approvalUrl = order.result.links.find(link => link.rel === "approve")?.href;

    if (!approvalUrl) {
      return res.status(500).json({ message: "Không thể tạo PayPal payment URL" });
    }

    console.log("[PayPal] ✅ Payment URL created successfully");
    console.log("[PayPal] ===== Kết thúc tạo PayPal payment ======");

    res.json({
      payUrl: approvalUrl,
      orderId: paypalOrderId,
      paypalOrderId: paypalOrderId,
    });
  } catch (err) {
    console.error("[PayPal] ❌ ===== LỖI TẠO PAYMENT ======");
    console.error("[PayPal] Error:", err);
    console.error("[PayPal] Error name:", err.name);
    console.error("[PayPal] Error message:", err.message);
    console.error("[PayPal] Stack:", err.stack);
    console.error("[PayPal] ==============================");

    // Xử lý các lỗi cụ thể
    let errorMessage = "Lỗi tạo thanh toán PayPal";
    let statusCode = 500;

    if (err.message.includes("Client ID") || err.message.includes("Client Secret")) {
      errorMessage = "PayPal credentials chưa được cấu hình. Vui lòng kiểm tra file .env";
      statusCode = 400;
    } else if (err.message.includes("Invalid credentials") || err.message.includes("401")) {
      errorMessage = "PayPal credentials không hợp lệ. Vui lòng kiểm tra lại Client ID và Secret";
      statusCode = 401;
    } else if (err.message.includes("Network") || err.message.includes("ECONNREFUSED")) {
      errorMessage = "Không thể kết nối đến PayPal API. Vui lòng kiểm tra kết nối internet";
      statusCode = 503;
    }

    res.status(statusCode).json({
      message: errorMessage,
      error: err.message,
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

/**
 * Xử lý return từ PayPal (sau khi user approve)
 */
exports.paypalReturn = async (req, res) => {
  try {
    const { token, PayerID } = req.query;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    console.log("[PayPal Return] Received:", { token, PayerID });

    if (!token) {
      return res.redirect(`${clientUrl}/checkout?status=error&code=missing_token&method=paypal`);
    }

    // Capture order
    const client = paypalClient();
    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.requestBody({});

    const capture = await client.execute(request);
    const captureId = capture.result.purchase_units[0].payments.captures[0].id;
    const status = capture.result.status;

    console.log("[PayPal Return] Capture result:", { captureId, status });

    // Tìm order theo paypalOrderId
    const order = await Order.findOne({ paypalOrderId: token });
    
    if (order) {
      if (status === "COMPLETED") {
        order.paymentStatus = "paid";
        order.paypalTransactionId = captureId;
        // Cập nhật trạng thái đơn hàng thành "Xác nhận đơn hàng" nếu chưa có
        if (!order.status || order.status === "Đang xử lý") {
          order.status = "Xác nhận đơn hàng";
        }
        await order.save();
        console.log("[PayPal Return] Order updated to paid:", order._id);
        console.log("[PayPal Return] Order status:", order.status);
      } else {
        order.paymentStatus = "failed";
        await order.save();
        console.log("[PayPal Return] Order updated to failed:", order._id);
      }
    } else {
      console.warn("[PayPal Return] Order not found with paypalOrderId:", token);
    }

    // Redirect về frontend
    if (status === "COMPLETED") {
      res.redirect(`${clientUrl}/checkout?status=success&method=paypal&orderId=${order?._id || token}`);
    } else {
      res.redirect(`${clientUrl}/checkout?status=error&code=${status}&method=paypal`);
    }
  } catch (err) {
    console.error("[PayPal Return] ❌ Error:", err);
    console.error("[PayPal Return] Error name:", err.name);
    console.error("[PayPal Return] Error message:", err.message);
    console.error("[PayPal Return] Stack:", err.stack);
    
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    
    // Xử lý các lỗi cụ thể
    let errorCode = "system_error";
    if (err.message.includes("Invalid credentials") || err.message.includes("401")) {
      errorCode = "invalid_credentials";
    } else if (err.message.includes("Order not found")) {
      errorCode = "order_not_found";
    } else if (err.message.includes("Network") || err.message.includes("ECONNREFUSED")) {
      errorCode = "network_error";
    }
    
    res.redirect(`${clientUrl}/checkout?status=error&code=${errorCode}&method=paypal`);
  }
};

/**
 * Xử lý cancel từ PayPal
 */
exports.paypalCancel = (req, res) => {
  try {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    console.log("[PayPal Cancel] User cancelled payment");
    res.redirect(`${clientUrl}/checkout?status=cancelled&method=paypal`);
  } catch (err) {
    console.error("[PayPal Cancel] Error:", err);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${clientUrl}/checkout?status=error&code=system_error&method=paypal`);
  }
};
