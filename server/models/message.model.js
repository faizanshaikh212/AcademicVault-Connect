import mongoose from "mongoose";

// Define the Message Schema
const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String, // Supports Markdown
      trim: true,
    },
    file: {
      url: { type: String }, // URL from Cloudinary
      type: { type: String }, // e.g., 'image/png', 'text/markdown'
      originalName: { type: String },
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    // Add timestamps for createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create and export the Message model
const Message = mongoose.model("Message", messageSchema);

export default Message;
