const ngrok = require("ngrok");
const fs = require("fs");
const { spawn } = require("child_process");

async function start() {
  try {
    // 1️⃣ Khởi động ngrok cho cổng React (5173)
    const url = await ngrok.connect({
      proto: "http",
      addr: 5173
    });

    console.log("Ngrok URL:", url);

    // 2️⃣ Lưu link vào file JSON để React đọc
    const data = { VITE_API_URL: url };
    fs.writeFileSync("public/ngrok-url.json", JSON.stringify(data, null, 2));
    console.log("Ngrok URL saved to public/ngrok-url.json");

    // 3️⃣ Start React dev server
    const react = spawn("npm", ["run", "dev"], { stdio: "inherit" });

    // 4️⃣ Khi React dừng, ngắt ngrok
    react.on("exit", async () => {
      await ngrok.disconnect();
      await ngrok.kill();
    });

  } catch (err) {
    console.error("Error starting dev:", err.message);
  }
}

start();
