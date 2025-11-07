const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

// Dữ liệu test
const testUser = {
  name: "Test User",
  email: `testuser_${Date.now()}@example.com`, // tránh trùng
  password: "Test@1234",
  phone: "0123456789"
};

const runTest = async () => {
  try {
    console.log("----- BẮT ĐẦU ĐĂNG KÝ -----");
    const registerRes = await axios.post(`${API_URL}/register`, testUser);
    const registerData = registerRes.data;
    console.log("Register:", {
      ...registerData,
      user: { ...registerData.user, password: "***" }
    });

    console.log("----- ĐĂNG NHẬP -----");
    const loginRes = await axios.post(`${API_URL}/login`, {
      email: testUser.email,
      password: testUser.password
    });
    const loginData = loginRes.data;
    if (!loginData.token) throw new Error("Login thất bại, không có token");
    console.log("Login:", {
      ...loginData,
      user: { ...loginData.user, password: "***" }
    });

    console.log("----- VERIFY TOKEN -----");
    const token = loginData.token;
    const verifyRes = await axios.get(`${API_URL}/verify-token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Verify Token:", {
      user: { ...verifyRes.data.user, password: "***" }
    });

    console.log("✅ Tất cả test thành công!");
  } catch (err) {
    console.error("❌ Lỗi test:", err.response?.data || err.message);
  }
};

runTest();
