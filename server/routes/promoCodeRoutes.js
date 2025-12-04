const express = require("express");
const cors = require("cors");
const {
  validatePromoCode,
  incrementUsage,
  getActivePromoCodes,
} = require("../controllers/promoCodeController");

const router = express.Router();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL,
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/.+\.ngrok-free\.(app|dev)$/,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some((o) =>
      typeof o === "string" ? o === origin : o instanceof RegExp && o.test(origin)
    );
    callback(isAllowed ? null : new Error("Not allowed by CORS"), isAllowed);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "ngrok-skip-browser-warning",
  ],
};

router.use(cors(corsOptions));

// Routes
router.get("/active", getActivePromoCodes);
router.post("/validate", validatePromoCode);
router.post("/increment-usage", incrementUsage);

module.exports = router;

