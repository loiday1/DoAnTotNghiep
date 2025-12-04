const Order = require('../models/Order');

// Lấy thống kê thu nhập
exports.getRevenueStats = async (req, res) => {
  try {
    const now = new Date();
    
    // Tính toán các khoảng thời gian
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Chủ nhật đầu tuần
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Lấy tất cả đơn hàng
    const allOrders = await Order.find();
    
    // Đơn hàng hôm nay
    const todayOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startOfToday;
    });
    
    // Đơn hàng tuần này
    const weekOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startOfWeek;
    });
    
    // Đơn hàng tháng này
    const monthOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startOfMonth;
    });
    
    // Tính tổng thu nhập (chỉ tính đơn hàng đã thanh toán hoặc đã giao thành công)
    const calculateRevenue = (orders) => {
      return orders
        .filter(order => {
          // Chỉ tính đơn hàng đã thanh toán hoặc đã giao thành công
          return order.paymentStatus === 'paid' || 
                 order.status === 'Giao thành công' || 
                 order.status === 'giao-thành-công' ||
                 order.status === 'delivered' ||
                 order.status === 'completed';
        })
        .reduce((total, order) => {
          return total + (order.totalPrice || 0);
        }, 0);
    };
    
    // Đếm số lượng đơn hàng
    const countOrders = (orders) => orders.length;
    
    // Đếm đơn hàng đã giao thành công
    const countDeliveredOrders = (orders) => {
      return orders.filter(order => 
        order.status === 'Giao thành công' || 
        order.status === 'giao-thành-công' ||
        order.status === 'delivered' ||
        order.status === 'completed'
      ).length;
    };
    
    // Đếm đơn hàng đang đợi giao
    const countPendingDeliveryOrders = (orders) => {
      return orders.filter(order => {
        const status = order.status?.toLowerCase() || '';
        return (
          status === 'đang xử lý' ||
          status === 'xác nhận đơn hàng' ||
          status === 'chuẩn bị đơn hàng' ||
          status === 'đang giao hàng' ||
          status === 'confirmed' ||
          status === 'preparing' ||
          status === 'shipping' ||
          status === 'processing'
        ) && order.paymentStatus !== 'failed';
      }).length;
    };
    
    // Đếm đơn hàng đã hủy
    const countCancelledOrders = (orders) => {
      return orders.filter(order => {
        const status = order.status?.toLowerCase() || '';
        return status === 'đã hủy' || status === 'cancelled' || status === 'hủy';
      }).length;
    };
    
    // Tính số tiền hoàn (chỉ tính đơn hàng hủy đã thanh toán online)
    const calculateRefundAmount = (orders) => {
      return orders
        .filter(order => {
          const status = order.status?.toLowerCase() || '';
          const isCancelled = status === 'đã hủy' || status === 'cancelled' || status === 'hủy';
          const isPaid = order.paymentStatus === 'paid';
          const isOnlinePayment = order.method === 'paypal' || order.method === 'momo';
          return isCancelled && isPaid && isOnlinePayment;
        })
        .reduce((total, order) => {
          return total + (order.totalPrice || 0);
        }, 0);
    };
    
    // Thống kê tổng quan
    const stats = {
      // Tổng quan
      totalOrders: countOrders(allOrders),
      totalRevenue: calculateRevenue(allOrders),
      totalDelivered: countDeliveredOrders(allOrders),
      totalPendingDelivery: countPendingDeliveryOrders(allOrders),
      totalCancelled: countCancelledOrders(allOrders),
      totalRefundAmount: calculateRefundAmount(allOrders),
      
      // Hôm nay
      today: {
        orders: countOrders(todayOrders),
        revenue: calculateRevenue(todayOrders),
        delivered: countDeliveredOrders(todayOrders),
        pendingDelivery: countPendingDeliveryOrders(todayOrders),
        cancelled: countCancelledOrders(todayOrders),
        refundAmount: calculateRefundAmount(todayOrders),
      },
      
      // Tuần này
      week: {
        orders: countOrders(weekOrders),
        revenue: calculateRevenue(weekOrders),
        delivered: countDeliveredOrders(weekOrders),
        pendingDelivery: countPendingDeliveryOrders(weekOrders),
        cancelled: countCancelledOrders(weekOrders),
        refundAmount: calculateRefundAmount(weekOrders),
      },
      
      // Tháng này
      month: {
        orders: countOrders(monthOrders),
        revenue: calculateRevenue(monthOrders),
        delivered: countDeliveredOrders(monthOrders),
        pendingDelivery: countPendingDeliveryOrders(monthOrders),
        cancelled: countCancelledOrders(monthOrders),
        refundAmount: calculateRefundAmount(monthOrders),
      },
    };
    
    res.status(200).json(stats);
  } catch (err) {
    console.error('❌ Lỗi khi lấy thống kê thu nhập:', err);
    res.status(500).json({ 
      message: 'Lỗi server khi lấy thống kê thu nhập', 
      error: err.message 
    });
  }
};

// Lấy thống kê theo tháng được chọn
exports.getRevenueStatsByMonth = async (req, res) => {
  try {
    const { year, month } = req.query; // year: 2024, month: 0-11 (0 = tháng 1)
    
    if (!year || month === undefined) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp year và month' 
      });
    }
    
    const selectedYear = parseInt(year);
    const selectedMonth = parseInt(month);
    
    // Tính toán khoảng thời gian của tháng được chọn
    const startOfMonth = new Date(selectedYear, selectedMonth, 1);
    const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    
    // Lấy tất cả đơn hàng
    const allOrders = await Order.find();
    
    // Lọc đơn hàng trong tháng được chọn
    const monthOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startOfMonth && orderDate <= endOfMonth;
    });
    
    // Tính tổng thu nhập
    const calculateRevenue = (orders) => {
      return orders
        .filter(order => {
          return order.paymentStatus === 'paid' || 
                 order.status === 'Giao thành công' || 
                 order.status === 'giao-thành-công' ||
                 order.status === 'delivered' ||
                 order.status === 'completed';
        })
        .reduce((total, order) => {
          return total + (order.totalPrice || 0);
        }, 0);
    };
    
    // Đếm số lượng đơn hàng
    const countOrders = (orders) => orders.length;
    
    // Đếm đơn hàng đã giao thành công
    const countDeliveredOrders = (orders) => {
      return orders.filter(order => 
        order.status === 'Giao thành công' || 
        order.status === 'giao-thành-công' ||
        order.status === 'delivered' ||
        order.status === 'completed'
      ).length;
    };
    
    // Đếm đơn hàng đang đợi giao
    const countPendingDeliveryOrders = (orders) => {
      return orders.filter(order => {
        const status = order.status?.toLowerCase() || '';
        return (
          status === 'đang xử lý' ||
          status === 'xác nhận đơn hàng' ||
          status === 'chuẩn bị đơn hàng' ||
          status === 'đang giao hàng' ||
          status === 'confirmed' ||
          status === 'preparing' ||
          status === 'shipping' ||
          status === 'processing'
        ) && order.paymentStatus !== 'failed';
      }).length;
    };
    
    // Đếm đơn hàng đã hủy
    const countCancelledOrders = (orders) => {
      return orders.filter(order => {
        const status = order.status?.toLowerCase() || '';
        return status === 'đã hủy' || status === 'cancelled' || status === 'hủy';
      }).length;
    };
    
    // Tính số tiền hoàn
    const calculateRefundAmount = (orders) => {
      return orders
        .filter(order => {
          const status = order.status?.toLowerCase() || '';
          const isCancelled = status === 'đã hủy' || status === 'cancelled' || status === 'hủy';
          const isPaid = order.paymentStatus === 'paid';
          const isOnlinePayment = order.method === 'paypal' || order.method === 'momo';
          return isCancelled && isPaid && isOnlinePayment;
        })
        .reduce((total, order) => {
          return total + (order.totalPrice || 0);
        }, 0);
    };
    
    const stats = {
      orders: countOrders(monthOrders),
      revenue: calculateRevenue(monthOrders),
      delivered: countDeliveredOrders(monthOrders),
      pendingDelivery: countPendingDeliveryOrders(monthOrders),
      cancelled: countCancelledOrders(monthOrders),
      refundAmount: calculateRefundAmount(monthOrders),
      year: selectedYear,
      month: selectedMonth,
    };
    
    res.status(200).json(stats);
  } catch (err) {
    console.error('❌ Lỗi khi lấy thống kê thu nhập theo tháng:', err);
    res.status(500).json({ 
      message: 'Lỗi server khi lấy thống kê thu nhập theo tháng', 
      error: err.message 
    });
  }
};

// Lấy doanh thu từng tháng trong năm
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const { year } = req.query;
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Lấy tất cả đơn hàng
    const allOrders = await Order.find();
    
    // Tính doanh thu cho từng tháng
    const monthlyData = [];
    
    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date(selectedYear, month, 1);
      const endOfMonth = new Date(selectedYear, month + 1, 0, 23, 59, 59, 999);
      
      const monthOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startOfMonth && orderDate <= endOfMonth;
      });
      
      const revenue = monthOrders
        .filter(order => {
          return order.paymentStatus === 'paid' || 
                 order.status === 'Giao thành công' || 
                 order.status === 'giao-thành-công' ||
                 order.status === 'delivered' ||
                 order.status === 'completed';
        })
        .reduce((total, order) => {
          return total + (order.totalPrice || 0);
        }, 0);
      
      const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
      ];
      
      monthlyData.push({
        month: month + 1,
        monthName: monthNames[month],
        revenue: revenue,
        orders: monthOrders.length,
      });
    }
    
    res.status(200).json({
      year: selectedYear,
      data: monthlyData,
    });
  } catch (err) {
    console.error('❌ Lỗi khi lấy doanh thu theo tháng:', err);
    res.status(500).json({ 
      message: 'Lỗi server khi lấy doanh thu theo tháng', 
      error: err.message 
    });
  }
};

