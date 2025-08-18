// Import necessary modules
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

// Load environment variables from .env file (for development only)
dotenv.config();

// Establish database connection
connectDB();

// Initialize the Express application
const app = express();

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

// --- ADD THIS SECTION ---
// Serve static files from the React build folder in production
app.use(express.static(path.join(__dirname, "..", "client", "dist")));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "dist", "index.html"));
});
// --------------------

// --- Server Setup ---
const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

// --- Socket.IO Setup ---
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
io.on("connection", (socket) => {
  console.log("User Connected", { $userId: socket.id });
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
