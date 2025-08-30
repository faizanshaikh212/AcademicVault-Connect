/**
 * Academic Vault Server
 * Main server file that sets up Express application with WebSocket support
 * Handles API routes, static file serving, and real-time notifications
 * @module server
 */

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import notificationRoutes from "./routes/notification.routes.js";
// Import the premium expiration check job
import "./jobs/premiumExpirationCheck.js";

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

// Load environment variables from .env file (for development only)
dotenv.config();

// Establish database connection
const connection = await connectDB();

// Initialize the Express application
const app = express();

// Removed unnecessary initialization code

// --- Middleware ---
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());

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
    origin: "*",
  },
});
app.use((req, res, next) => {
  req.io = io;
  next();
});
// Import logger
import logger from "./utils/logger.js";

io.on("connection", (socket) => {
  logger.info("User Connected", { $userId: socket.id });
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

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
