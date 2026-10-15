/**
 * Academic Vault Server
 * Main server file that sets up Express application with WebSocket support
 * Handles API routes, static file serving, and real-time notifications
 * @module server
 */

// Suppress specific deprecation warnings
import "./utils/suppressWarnings.js";

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import notificationRoutes from "./routes/notification.routes.js";
import User from "./models/user.model.js";
import Session from "./models/session.model.js";
// Import the premium expiration check job
import "./jobs/premiumExpirationCheck.js";
// Import security cleanup jobs
import "./jobs/securityCleanup.js";
// Import security monitoring jobs
import "./jobs/securityMonitoring.js";

// --- ADD THIS ---
// Recreate __dirname for ES Modules
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ----------------

// Import database connection
import connectDB from "./config/db.js";

// Import route files
import authRoutes from "./routes/auth.routes.js";
import googleAuthRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import premiumRoutes from "./routes/premium.routes.js";
import newsRoutes from "./routes/news.routes.js";
import noticeRoutes from "./routes/notice.routes.js";
import pageRoutes from "./routes/page.routes.js";
import academicRoutes from "./routes/academic.routes.js";
import courseRoutes from "./routes/course.routes.js";
import studentRoutes from "./routes/student.routes.js";
import debugRoutes from "./routes/debug.routes.js";

// Load environment variables from .env file (for development only)
dotenv.config();

// Establish database connection
const connection = await connectDB();

// Initialize the Express application
const app = express();

// --- Middleware ---
// Configure CORS: when credentials are enabled, don't use wildcard origin.
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
// Parse cookies for refresh token handling
app.use(cookieParser());

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api", newsRoutes); // This includes both /api/news and /api/newsletter routes
app.use("/api", noticeRoutes); // This includes /api/notices routes
app.use("/api", pageRoutes); // This includes /api/pages routes
app.use("/api/academic", academicRoutes); // Academic resources routes
app.use("/api/courses", courseRoutes); // Teacher course/semester/subject management
app.use("/api/students", studentRoutes); // Teacher student management
app.use("/api/debug", debugRoutes); // Debug endpoints (development only)

// Import and use file routes
import fileRoutes from "./routes/files.routes.js";
app.use("/api/files", fileRoutes); // File serving routes

// Serve uploaded files statically from LocalStorage directory
// Custom file serving middleware for secure downloads
app.use("/uploads", (req, res, next) => {
  const filePath = path.join(__dirname, "..", "LocalStorage", req.path);
  const fileName = path.basename(filePath);

  // Set secure headers for file downloads. Use the configured client origin when credentials are in use.
  res.set({
    "Access-Control-Allow-Origin": CLIENT_ORIGIN,
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Disposition": `inline; filename="${fileName}"`,
    "Content-Type": "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });

  // Stream the file directly
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      if (!res.headersSent) {
        res.status(404).send("File not found");
      }
    }
  });
});

// --- ADD THIS SECTION ---
// Serve static files from the React build folder in production
app.use(express.static(path.join(__dirname, "..", "client", "dist")));

/**
 * Catchall route handler for client-side routing
 * Serves the React application for all unmatched routes
 * Enables client-side routing in production
 */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "dist", "index.html"));
});
// --------------------

// --- Server Setup ---
const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

/**
 * WebSocket Server Configuration
 * Handles real-time communication between clients and server
 * - Configured with 60s ping timeout
 * - CORS enabled for all origins
 * - Used for notifications and real-time updates
 */
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: CLIENT_ORIGIN,
  },
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string" || !token) {
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub).select("_id");
    if (!user) {
      return next(new Error("Authentication failed"));
    }

    if (decoded.sid) {
      const session = await Session.findById(decoded.sid);
      if (
        !session ||
        session.revoked ||
        session.expiresAt < new Date() ||
        session.user.toString() !== user._id.toString()
      ) {
        return next(new Error("Session is no longer valid"));
      }
    }

    socket.data.userId = user._id.toString();
    next();
  } catch (error) {
    logger.debug("Socket authentication failed:", error.message);
    next(new Error("Authentication failed"));
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});
// Import logger
import logger from "./utils/logger.js";

io.on("connection", (socket) => {
  logger.info("User Connected", { $userId: socket.data.userId });
  socket.join(socket.data.userId);
  socket.emit("connected");

  socket.on("disconnect", () => {
    logger.info("USER DISCONNECTED");
  });
});

/**
 * Initialize server and begin listening for requests
 * Logs server mode and port information
 */
server.listen(PORT, () => {
  logger.info(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  logger.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
