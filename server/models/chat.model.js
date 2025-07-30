import mongoose from "mongoose";

// Define the Chat Schema
const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    groupInfo: {
      name: { type: String, trim: true },
      admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      avatar: { type: String, default: "" }, // URL to Cloudinary image
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    // Add timestamps for createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create and export the Chat model
const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
