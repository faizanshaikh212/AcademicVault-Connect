/**
 * Contact Form Model Module
 * Handles user contact form submissions and tracking
 * Supports both authenticated and anonymous submissions
 * @module models/contact
 */

import mongoose from "mongoose";

/**
 * Contact Schema Definition
 * @typedef {Object} ContactSchema
 * @property {string} name - Sender's name
 * @property {string} email - Sender's email address
 * @property {string} message - Contact message content
 * @property {ObjectId} userId - Optional link to registered user
 * @property {string} status - Processing status of contact
 * @property {Date} createdAt - Submission timestamp
 * @property {Date} updatedAt - Last status update
 *
 * @description
 * Status workflow:
 * - pending: New submission
 * - completed: Request handled
 * - on-going: In process
 * - marked-for-deletion: Flagged for removal
 */
const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "on-going", "marked-for-deletion"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Contact", contactSchema);
