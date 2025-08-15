/**
 * Notification Model Module
 * Defines the schema for user notifications system
 * Supports various notification types and real-time updates
 * @module models/notification
 */

import mongoose from "mongoose";

/**
 * Notification Schema Definition
 * @typedef {Object} NotificationSchema
 * @property {ObjectId} recipient - User receiving the notification
 * @property {ObjectId} sender - User or system generating the notification
 * @property {string} type - Type of notification
 * @property {string} link - URL or path related to notification
 * @property {boolean} isRead - Read status of notification
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 *
 * @description
 * Supported notification types:
 * - follow: When someone follows the user
 * - friend_request: New friend request received
 * - friend_request_accepted: Friend request was accepted
 * - message: New message received
 * - project_mention: User mentioned in project
 * - blog_comment: New comment on user's blog
 * - role_approved: Role request approved
 * - role_rejected: Role request rejected
 */
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
        "premium_approved",
        "premium_rejected",
        "new_news",
        "newsletter_status_change",
      ],
      required: true,
    },
    // Optional message for the notification (e.g., news title)
    message: {
      type: String,
      required: false,
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
    isCleared: {
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
