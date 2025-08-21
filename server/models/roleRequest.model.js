/**
 * Role Request Model Module
 * Handles teacher/admin role upgrade requests
 * Enforces one pending request per user policy
 * @module models/roleRequest
 */

import mongoose from "mongoose";

/**
 * Role Request Schema Definition
 * @typedef {Object} RoleRequestSchema
 * @property {ObjectId} user - Reference to requesting user
 * @property {string} fullName - User's full name
 * @property {string} qualifications - Academic/Professional qualifications
 * @property {string} bio - Professional biography
 * @property {string} status - Request status (pending/approved/rejected)
 * @property {Date} createdAt - Request submission timestamp
 * @property {Date} updatedAt - Last status update timestamp
 *
 * @description
 * Business Rules:
 * - One active request per user
 * - Required qualification details
 * - Status workflow management
 */
const roleRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // A user can only have one pending request at a time
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    qualifications: {
      type: String,
      required: [true, "Qualifications are required"],
    },
    bio: {
      type: String,
      required: [true, "A short bio is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the RoleRequest model
const RoleRequest = mongoose.model("RoleRequest", roleRequestSchema);

export default RoleRequest;
