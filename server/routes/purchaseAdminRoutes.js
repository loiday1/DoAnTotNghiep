const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseController");

// Lấy tất cả purchases
router.get("/", purchaseController.getAllPurchases);

// Thêm mới purchase
router.post("/", purchaseController.createPurchase);

// Cập nhật purchase theo id (hỗ trợ PUT & PATCH)
router.put("/:id", purchaseController.updatePurchase);
router.patch("/:id", purchaseController.updatePurchase);

// Xóa purchase theo id
router.delete("/:id", purchaseController.deletePurchase);

module.exports = router;
