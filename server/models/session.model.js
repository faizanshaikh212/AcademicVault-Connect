/**
 * Session model to store refresh token hashes and session metadata
 */
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tokenId: { type: String, required: true },
    refreshTokenHash: { type: String, required: true },
    deviceInfo: {
      ip: { type: String },
      ua: { type: String },
      name: { type: String },
      browser: { type: String },
      os: { type: String },
      location: {
        country: { type: String },
        city: { type: String },
        region: { type: String }
      }
    },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },

    // Security flags
    isCurrent: {
      type: Boolean,
      default: false
    },
    loginMethod: {
      type: String,
      enum: ['password', 'password_2fa', 'email_verification'],
      default: 'password'
    },
  },
  { timestamps: true }
);

// Add indexes for performance
sessionSchema.index({ user: 1, revoked: 1 });
sessionSchema.index({ tokenId: 1 });
sessionSchema.index({ expiresAt: 1 });

const Session = mongoose.model("Session", sessionSchema);
export default Session;
