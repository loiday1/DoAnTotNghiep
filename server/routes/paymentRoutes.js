const express = require('express');
const cors = require('cors');

// Import payment controllers
let createMoMoPayment, momoReturn, momoNotify;
let createPayPalPayment, paypalReturn, paypalCancel;
try {
  const paymentController = require('../controllers/paymentController');
  createMoMoPayment = paymentController.createMoMoPayment;
  momoReturn = paymentController.momoReturn;
  momoNotify = paymentController.momoNotify;
  createPayPalPayment = paymentController.createPayPalPayment;
  paypalReturn = paymentController.paypalReturn;
  paypalCancel = paymentController.paypalCancel;
  console.log("✅ [PaymentRoutes] All payment controllers loaded successfully");
} catch (err) {
  console.error("❌ [PaymentRoutes] Error loading payment controllers:", err);
  throw err;
}

// Import ngrok utils
const { getNgrokUrl } = require('../utils/autoNgrok');

const router = express.Router();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
  /^http:\/\/localhost:\d+$/, // Cho phép tất cả localhost ports
  /^https:\/\/.+\.ngrok-free\.(app|dev)$/ // allow both .app and .dev
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o instanceof RegExp && o.test(origin)
    );
    callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Origin','X-Requested-With','Content-Type','Accept','Authorization']
};

// Middleware CORS cho toàn bộ router
router.use(cors(corsOptions));

// Endpoint để kiểm tra ngrok status
router.get('/ngrok-status', (req, res) => {
  const ngrokUrl = getNgrokUrl();
  res.json({
    ngrokActive: !!ngrokUrl,
    ngrokUrl: ngrokUrl || null,
    backendUrl: process.env.BACKEND_URL || null,
    message: ngrokUrl 
      ? "✅ Ngrok đang hoạt động" 
      : "⚠️ Ngrok chưa được khởi động hoặc không có sẵn"
  });
});

// MoMo routes
router.post('/momo/create', (req, res, next) => {
  console.log("📱 [MoMo Route] POST /momo/create called");
  next();
}, createMoMoPayment);
router.get('/momo_return', momoReturn);
router.post('/momo_notify', express.json(), momoNotify);

// PayPal routes
router.post('/paypal/create', (req, res, next) => {
  console.log("💳 [PayPal Route] POST /paypal/create called");
  next();
}, createPayPalPayment);
router.get('/paypal_return', paypalReturn);
router.get('/paypal_cancel', paypalCancel);

module.exports = router;
