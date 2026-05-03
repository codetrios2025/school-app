require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const http = require("http"); // ✅ NEW
const { Server } = require("socket.io"); // ✅ NEW

const connectDB = require("./config/db");

const app = express();

// 🔐 Security Middlewares
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(hpp());
app.use(cors());

// 🚫 Rate Limiting (prevent brute force)
const limiter = rateLimit({
  max: 500,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests, try again later",
});
//app.use("/api", limiter);
app.use("/api", (req, res, next) => {
  if (req.path.includes("/notifications") || req.path.includes("/classes")) {
    return next();
  }

  return limiter(req, res, next);
});

// DB Connection
connectDB();

// ==============================
// ✅ SOCKET.IO SETUP
// ==============================

// 🔹 Create HTTP server
const server = http.createServer(app);

// 🔹 Attach socket
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// 🔌 Socket connection
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // 🎯 Join user room
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User joined room: ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// 👉 Make io available in controllers
app.set("io", io);

// ==============================
// ROUTES
// ==============================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/classes", require("./routes/classRoutes"));
app.use("/api/subjects", require("./routes/subjectRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/assignments", require("./routes/teacherAssignmentRoutes"));
app.use("/api/teachers", require("./routes/teacherRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// ==============================
// START SERVER
// ==============================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
