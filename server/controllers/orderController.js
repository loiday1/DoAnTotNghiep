const Order = require('../models/Order');
const mongoose = require('mongoose');

// Lấy danh sách đơn hàng của user
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('❌ Error fetching user orders:', err);
    res.status(500).json({ message: 'Lỗi khi lấy đơn hàng', error: err.message });
  }
};

// Lấy chi tiết một đơn hàng
exports.getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }

    res.json(order);
  } catch (err) {
    console.error('❌ Error fetching order detail:', err);
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết đơn hàng', error: err.message });
  }
};

// Tạo đơn hàng mới (COD, MoMo hoặc PayPal)
exports.createOrder = async (req, res) => {
  try {
    console.log("📦 [OrderController] ===== Bắt đầu tạo đơn hàng ======");
    console.log("📦 [OrderController] Request body:", JSON.stringify(req.body, null, 2));
    
    const { userId, items, info, totalPrice, method, promoCode, discountAmount, shippingFee, subtotal } = req.body;

    // Validate required fields với thông báo chi tiết
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!items || !Array.isArray(items) || items.length === 0) missingFields.push('items (phải là array và không rỗng)');
    if (!info) missingFields.push('info');
    if (totalPrice === undefined || totalPrice === null) missingFields.push('totalPrice');
    if (!method) missingFields.push('method');

    if (missingFields.length > 0) {
      console.error("❌ [OrderController] Missing required fields:", missingFields);
      return res.status(400).json({ 
        message: 'Missing required fields', 
        missingFields,
        received: {
          userId: !!userId,
          items: items ? `${Array.isArray(items) ? items.length : 'not array'} items` : 'missing',
          info: !!info,
          totalPrice: totalPrice !== undefined,
          method: !!method
        }
      });
    }

    // Validate info object
    if (!info.fullName || !info.phone || !info.address) {
      const missingInfo = [];
      if (!info.fullName) missingInfo.push('fullName');
      if (!info.phone) missingInfo.push('phone');
      if (!info.address) missingInfo.push('address');
      console.error("❌ [OrderController] Missing info fields:", missingInfo);
      return res.status(400).json({ 
        message: 'Missing required info fields', 
        missingInfo 
      });
    }

    // Validate items
    const invalidItems = items.filter(item => !item.name || !item.price || !item.quantity);
    if (invalidItems.length > 0) {
      console.error("❌ [OrderController] Invalid items:", invalidItems);
      return res.status(400).json({ 
        message: 'Items must have name, price, and quantity',
        invalidItems 
      });
    }

    // Map items để đảm bảo có productId (từ id hoặc productId)
    const mappedItems = items.map((item, index) => {
      const mapped = {
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.image || null,
        productId: item.productId || item.id || null, // Lấy productId từ id hoặc productId
      };
      
      // Validate numeric fields
      if (isNaN(mapped.price) || mapped.price <= 0) {
        throw new Error(`Item ${index}: price phải là số dương`);
      }
      if (isNaN(mapped.quantity) || mapped.quantity <= 0) {
        throw new Error(`Item ${index}: quantity phải là số dương`);
      }
      
      return mapped;
    });

    console.log("📦 [OrderController] Mapped items:", mappedItems.length);

    // Validate totalPrice
    const calculatedTotal = mappedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + (shippingFee || 0) - (discountAmount || 0);
    if (Math.abs(calculatedTotal - totalPrice) > 1) { // Cho phép sai số 1 VND do làm tròn
      console.warn(`⚠️ [OrderController] Total price mismatch: calculated=${calculatedTotal}, received=${totalPrice}`);
    }

    const orderData = {
      userId: String(userId),
      items: mappedItems,
      info: {
        fullName: String(info.fullName),
        phone: String(info.phone),
        address: String(info.address),
        note: info.note ? String(info.note) : undefined,
      },
      subtotal: Number(subtotal || totalPrice),
      shippingFee: Number(shippingFee || 0),
      totalPrice: Number(totalPrice),
      method: String(method),
      promoCode: promoCode ? String(promoCode) : null,
      discountAmount: Number(discountAmount || 0),
      status: 'Xác nhận đơn hàng',
      paymentStatus: 'unpaid',
    };

    console.log("📦 [OrderController] Order data prepared:", {
      userId: orderData.userId,
      itemsCount: orderData.items.length,
      totalPrice: orderData.totalPrice,
      method: orderData.method
    });

    const newOrder = new Order(orderData);
    console.log("📦 [OrderController] Order object created, saving...");

    const savedOrder = await newOrder.save();
    console.log("✅ [OrderController] Order saved successfully:", savedOrder._id);
    console.log("📦 [OrderController] ===== Kết thúc tạo đơn hàng ======");
    
    res.json({ message: '✅ Đơn hàng được tạo thành công', order: savedOrder });
  } catch (err) {
    console.error('❌ [OrderController] ===== LỖI TẠO ĐƠN HÀNG ======');
    console.error('❌ [OrderController] Error:', err);
    console.error('❌ [OrderController] Error name:', err.name);
    console.error('❌ [OrderController] Error message:', err.message);
    console.error('❌ [OrderController] Error stack:', err.stack);
    
    // Xử lý các lỗi cụ thể
    if (err.name === 'ValidationError') {
      const validationErrors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      console.error('❌ [OrderController] Validation errors:', validationErrors);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors,
        error: err.message 
      });
    }
    
    if (err.name === 'CastError') {
      console.error('❌ [OrderController] Cast error:', err.path, err.value);
      return res.status(400).json({ 
        message: 'Invalid data type', 
        field: err.path,
        value: err.value,
        error: err.message 
      });
    }

    console.error('❌ [OrderController] ==============================');
    res.status(500).json({ 
      message: 'Lỗi khi tạo đơn hàng', 
      error: err.message,
      errorName: err.name,
      details: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
};

// Lấy tất cả đơn hàng (admin)
exports.getAllOrders = async (req, res) => {
  try {
    console.log("📦 [OrderController] getAllOrders called");
    console.log("📦 [OrderController] Request URL:", req.url);
    console.log("📦 [OrderController] Request method:", req.method);
    const orders = await Order.find().sort({ createdAt: -1 });
    console.log(`✅ [OrderController] Found ${orders.length} orders`);
    res.json(orders);
  } catch (err) {
    console.error('❌ Error fetching all orders:', err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng', error: err.message });
  }
};

// Cập nhật trạng thái đơn hàng (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { id } = req.params; // Support both orderId and id
    const finalOrderId = orderId || id;
    const { status, paymentStatus } = req.body;
    
    console.log(`📝 [OrderController] updateOrderStatus called for order: ${finalOrderId}`);

    const order = await Order.findByIdAndUpdate(
      finalOrderId,
      { status, paymentStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }

    res.json({ message: '✅ Cập nhật trạng thái đơn hàng thành công', order });
  } catch (err) {
    console.error('❌ Error updating order:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật đơn hàng', error: err.message });
  }
};

// Cập nhật thông tin đơn hàng (admin) - sửa items, info, totalPrice, etc.
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, info, totalPrice, method, promoCode, discountAmount } = req.body;
    
    console.log(`✏️ [OrderController] updateOrder called for order: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
    }

    const updateData = {};
    if (items) updateData.items = items;
    if (info) updateData.info = info;
    if (totalPrice !== undefined) updateData.totalPrice = totalPrice;
    if (method) updateData.method = method;
    if (promoCode !== undefined) updateData.promoCode = promoCode;
    if (discountAmount !== undefined) updateData.discountAmount = discountAmount;

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }

    res.json({ message: '✅ Cập nhật đơn hàng thành công', order });
  } catch (err) {
    console.error('❌ Error updating order:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật đơn hàng', error: err.message });
  }
};

// Xóa đơn hàng (admin)
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ [OrderController] deleteOrder called for order: ${id}`);
    console.log(`🗑️ [OrderController] Request method: ${req.method}`);
    console.log(`🗑️ [OrderController] Request URL: ${req.url}`);
    console.log(`🗑️ [OrderController] Request path: ${req.path}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`❌ [OrderController] Invalid order ID: ${id}`);
      return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
    }

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      console.log(`❌ [OrderController] Order not found: ${id}`);
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }

    console.log(`✅ [OrderController] Order deleted successfully: ${id}`);
    res.json({ message: '✅ Xóa đơn hàng thành công', deletedOrder: { _id: deletedOrder._id } });
  } catch (err) {
    console.error('❌ Error deleting order:', err);
    res.status(500).json({ message: 'Lỗi khi xóa đơn hàng', error: err.message });
  }
};

// Hủy đơn hàng (khách hàng) - chỉ được hủy khi admin chưa xác nhận
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.body; // userId từ request body để verify quyền

    console.log(`🚫 [OrderController] cancelOrder called for order: ${orderId}, userId: ${userId}`);

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'userId là bắt buộc' });
    }

    // Tìm đơn hàng
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }

    // Kiểm tra quyền: chỉ chủ đơn hàng mới được hủy
    if (order.userId !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này' });
    }

    // Kiểm tra trạng thái: chỉ được hủy khi admin chưa xác nhận
    const statusLower = (order.status || "").toLowerCase();
    const canCancel = 
      statusLower.includes("đang xử lý") || 
      statusLower.includes("xác nhận đơn hàng") ||
      statusLower.includes("confirmed") ||
      status === "Đang xử lý" ||
      status === "Xác nhận đơn hàng";

    if (!canCancel) {
      // Kiểm tra nếu đã hủy rồi
      if (statusLower.includes("đã hủy") || statusLower.includes("cancelled")) {
        return res.status(400).json({ message: 'Đơn hàng này đã được hủy trước đó' });
      }
      return res.status(400).json({ 
        message: 'Không thể hủy đơn hàng này. Đơn hàng đã được xử lý hoặc đang giao hàng.',
        currentStatus: order.status
      });
    }

    // Kiểm tra xem đơn hàng đã thanh toán chưa
    const hasPaid = order.paymentStatus === "paid";
    const isOnlinePayment = order.method === "paypal" || order.method === "momo";
    
    // Cập nhật trạng thái đơn hàng thành "Đã hủy"
    order.status = "Đã hủy";
    // Nếu đã thanh toán online, giữ nguyên paymentStatus = "paid" để biết cần hoàn tiền
    // Nếu chưa thanh toán, đánh dấu paymentStatus = "cancelled"
    if (order.paymentStatus === "unpaid") {
      order.paymentStatus = "cancelled";
    }

    await order.save();

    console.log(`✅ [OrderController] Order cancelled successfully: ${orderId}`);
    console.log(`💰 [OrderController] Payment info: hasPaid=${hasPaid}, method=${order.method}, totalPrice=${order.totalPrice}`);
    
    res.json({ 
      message: hasPaid && isOnlinePayment 
        ? '✅ Hủy đơn hàng thành công. Vui lòng liên hệ để được hoàn tiền.' 
        : '✅ Hủy đơn hàng thành công',
      order,
      requiresRefund: hasPaid && isOnlinePayment, // Cần hoàn tiền nếu đã thanh toán online
      refundAmount: hasPaid && isOnlinePayment ? order.totalPrice : 0
    });
  } catch (err) {
    console.error('❌ Error cancelling order:', err);
    res.status(500).json({ message: 'Lỗi khi hủy đơn hàng', error: err.message });
  }
};