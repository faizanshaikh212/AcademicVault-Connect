/**
 * Premium Request Model Module
 * Handles premium membership requests and approval workflow
 * Enforces unique pending requests per user
 * @module models/premiumRequest
 */

import mongoose from "mongoose";

/**
 * Premium Request Schema Definition
 * @typedef {Object} PremiumRequestSchema
 * @property {ObjectId} user - Reference to requesting user
 * @property {string} fullName - User's full name for billing
 * @property {string} paymentMethodId - Validated payment method identifier
 * @property {string} status - Request status (pending/approved/rejected)
 * @property {string} adminNotes - Administrative notes on request
 * @property {Date} createdAt - Request submission timestamp
 * @property {Date} updatedAt - Last status update timestamp
 *
 * @description
 * Enforces business rules:
 * - One pending request per user
 * - Payment method format validation
 * - Status workflow management
 */
const premiumRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    paymentMethodId: {
      type: String,
      required: true,
      match: [/^[a-zA-Z0-9]+@[a-zA-Z]+$/, "Please provide a valid payment ID"], // Basic format validation
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one user can only have one pending request at a time
premiumRequestSchema.index(
  { user: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

const PremiumRequest = mongoose.model("PremiumRequest", premiumRequestSchema);

export default PremiumRequest;
