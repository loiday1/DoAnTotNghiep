require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================
// Import Routes
// ==========================
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const processingPublicRoutes = require('./routes/processingPublicRoutes');
const processingAdminRoutes = require('./routes/processingAdminRoutes');
const purchaseAdminRoutes = require('./routes/purchaseAdminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// ==========================
// Middleware
// ==========================

// Logging requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS - cho phép cả localhost và ngrok
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL, // ví dụ: https://bionomical-dortha-connectively.ngrok-free.dev
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /\.ngrok-free\.dev$/.test(origin)
      ) {
        return callback(null, true);
      }
      console.warn(`🚫 CORS blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// COOP / COEP headers - cần cho Google Identity Service popup
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// ==========================
// Routes
// ==========================

// Root test
app.get('/', (req, res) => res.send('✅ Server is running!'));

// Public routes
app.use('/api/public', publicRoutes);
app.use('/api/public/processings', processingPublicRoutes);

// Auth routes
app.use('/api/auth', authRoutes);

// Admin routes
app.use('/api/admin/processings', processingAdminRoutes);
app.use('/api/admin/purchases', purchaseAdminRoutes);
app.use('/api/admin', adminRoutes);

// AI routes
app.use('/api/ai', aiRoutes);

// Payment routes (VNPay, MoMo)
app.use('/api/payment', paymentRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: '⚠️ Route không tồn tại' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ message: 'Lỗi server', error: err.message });
});

// ==========================
// MongoDB connect & start
// ==========================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
