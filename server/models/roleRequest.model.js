import mongoose from "mongoose";

// Define the Role Request Schema
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
