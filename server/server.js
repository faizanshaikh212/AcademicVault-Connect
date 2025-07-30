// Import necessary modules
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import notificationRoutes from "./routes/notification.routes.js";

// Import database connection
import connectDB from "./config/db.js";

// Import models for socket operations
import Message from "./models/message.model.js";
import Chat from "./models/chat.model.js";

// Import route files
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import adminRoutes from "./routes/admin.routes.js"; // Import admin routes

// Load environment variables from .env file
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
app.use("/api/chats", chatRoutes);
app.use("/api/admin", adminRoutes); // Add the admin routes
app.use("/api/notifications", notificationRoutes); // Add the notification routes

// --- Server Setup ---
const PORT = process.env.PORT || 5001;
const server = http.createServer(app); // Create HTTP server from Express app

// --- Socket.IO Setup ---
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*", // In production, restrict this to your frontend URL
  },
});
app.use((req, res, next) => {
  req.io = io;
  next();
});
io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id); // User joins a personal room based on their ID
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", async (newMessageReceived) => {
    let chat = newMessageReceived.chat;
    if (!chat.participants) return console.log("Chat.users not defined");
    try {
      var message = await Message.create({
        sender: newMessageReceived.sender._id,
        content: newMessageReceived.content,
        file: newMessageReceived.file,
        chat: newMessageReceived.chat._id,
      });
      message = await message.populate("sender", "username profile.avatar");
      message = await message.populate("chat");
      message = await User.populate(message, {
        path: "chat.participants",
        select: "username profile.avatar email",
      });
      await Chat.findByIdAndUpdate(newMessageReceived.chat._id, {
        lastMessage: message,
      });
      chat.participants.forEach((user) => {
        if (user._id == newMessageReceived.sender._id) return;
        socket.in(user._id).emit("message received", message);
      });
    } catch (error) {
      console.error("Error handling new message:", error);
    }
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
