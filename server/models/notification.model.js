import mongoose from "mongoose";

// Define the Notification Schema
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "follow",
        "friend_request",
        "friend_request_accepted",
        "message",
        "project_mention",
        "blog_comment",
        "role_approved",
        "role_rejected",
      ],
      required: true,
    },
    // A link to the content the notification is about (e.g., a chat, a profile)
    link: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the Notification model
const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
