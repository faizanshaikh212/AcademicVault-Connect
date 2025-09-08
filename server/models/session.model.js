/**
 * Session model to store refresh token hashes and session metadata
 */
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tokenId: { type: String, required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    deviceInfo: {
      ip: { type: String },
      ua: { type: String },
      name: { type: String },
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
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);
export default Session;
