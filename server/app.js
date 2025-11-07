const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Import payment route
const paymentRoutes = require("./routes/paymentRoutes");

// Middleware
app.use(cors());
app.use(express.json());  // Thay body-parser

// Test server
app.get("/", (req, res) => res.send("Server is running ✅"));

// Route thanh toán
app.use("/api/payment", paymentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
