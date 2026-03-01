// ===== server.js =====
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ===== Pastikan folder uploads ada =====
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== Multer Setup =====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);                     }
});
const upload = multer({ storage: storage });

// ===== Upload Endpoint =====
app.post("/upload", upload.single("image"), function (req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "Tidak ada file" });
  }

  res.json({
    url: req.protocol + "://" + req.get("host") + "/uploads/" + req.file.filename
  });
});

// ===== Database SQL.js =====
let db;

(async function () {
  const SQL = await initSqlJs();
  db = new SQL.Database();

  db.run(
    "CREATE TABLE IF NOT EXISTS messages (" +                               "id INTEGER PRIMARY KEY AUTOINCREMENT," +
      "username TEXT," +
      "message TEXT," +
      "imageUrl TEXT," +
      "timestamp DATETIME DEFAULT CURRENT_TIMESTAMP" +
    ");"                                                                );
})();

// ===== Save Message =====
function saveMessage(username, message, imageUrl) {
  if (!db) return;

  db.run(
    "INSERT INTO messages (username, message, imageUrl) VALUES (?, ?, ?)",
    [username || "Anon", message || "", imageUrl || null]
  );
}

// ===== Get History =====
function getChatHistory() {
  if (!db) return [];

  const stmt = db.prepare("SELECT * FROM messages ORDER BY id ASC");
  const result = [];

  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }

  stmt.free();
  return result;
}

// ===== Server Status & Online Users =====
let serverStatus = true;
let onlineUsers = [];

// ===== Console Render (Google Style Clean) =====
function renderConsole() {
  console.clear();

  console.log("====================================");
  console.log("        🌐 CHAT SERVER PANEL       ");
  console.log("====================================");
  console.log("");
  console.log("Status Server  :", serverStatus ? "🟢 ONLINE" : "🔴 OFFLINE");
  console.log("Jumlah Online  :", onlineUsers.length, "user");
  console.log("");

  if (onlineUsers.length > 0) {
    console.log("Daftar User Online:");
    console.log("---------------------");
    onlineUsers.forEach(function (user, index) {
      console.log((index + 1) + ". " + user);
    });
  } else {
    console.log("Belum ada user online...");
  }

  console.log("");
  console.log("Server jalan di http://localhost:3000");
  console.log("====================================");
}

// ===== API Status Control =====
app.get("/server/status", function (req, res) {
  res.json({
    status: serverStatus ? "ONLINE" : "OFFLINE",
    onlineUsers: onlineUsers
  });
});

app.post("/server/start", function (req, res) {
  serverStatus = true;
  renderConsole();
  res.json({ status: "ONLINE" });
});

app.post("/server/stop", function (req, res) {
  serverStatus = false;
  renderConsole();
  res.json({ status: "OFFLINE" });
});

// ===== Socket.IO =====
io.on("connection", function (socket) {

  socket.emit("chatHistory", getChatHistory());

  socket.on("registerUser", function (username) {
    socket.username = username || "Anon";

    if (!onlineUsers.includes(socket.username)) {
      onlineUsers.push(socket.username);
    }

    renderConsole();
    io.emit("onlineUsers", onlineUsers);
  });

  socket.on("chatMessage", function (data) {
    if (!serverStatus) return;

    saveMessage(data.username, data.message, data.imageUrl);
    io.emit("chatMessage", data);
  });

  socket.on("disconnect", function () {

    if (socket.username) {
      onlineUsers = onlineUsers.filter(function (u) {
        return u !== socket.username;
      });
    }

    renderConsole();
    io.emit("onlineUsers", onlineUsers);
  });

});

// ===== Run Server =====
const PORT = process.env.PORT || 3000;

server.listen(PORT, function () {
  renderConsole();
});
