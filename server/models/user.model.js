/**
 * User Model Module
 * Defines the schema and methods for user data in the application
 * Includes authentication, profile management, and social features
 * @module models/user
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Schema for external platform connections
 * @typedef {Object} ConnectionSchema
 * @property {string} platform - The name of the external platform
 * @property {string} url - The URL to the user's profile on that platform
 */
const connectionSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
); // _id is not needed for this sub-document

/**
 * Main User Schema
 * Comprehensive user model with profile, settings, social features, and premium status
 * @typedef {Object} UserSchema
 */
const userSchema = new mongoose.Schema(
  {
    /**
     * User's first name
     * @type {String}
     * @required
     */
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true, // Add index for faster queries by username
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: [String], // THE FIX: Changed from String to an Array of Strings
      enum: ["student", "teacher", "admin"],
      default: ["student"], // Default is now an array
    },
    profile: {
      bio: { type: String, default: "" },
      avatar: { type: String, default: "" }, // URL to Cloudinary image
      isAvatarGif: { type: Boolean, default: false },
      avatarHistory: [{ type: String }], // Store last 3 avatar URLs
      connections: [connectionSchema],
    },
    settings: {
      isPrivate: { type: Boolean, default: false },
      theme: { type: String, default: "default" },
      blockedContent: {
        type: String,
        enum: ["blur", "hide"],
        default: "blur",
      },
    },
    socials: {
      followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    premium: {
      isPremium: { type: Boolean, default: false },
      premiumSince: { type: Date, default: null },
      premiumExpiry: { type: Date, default: null },
      lastRenewal: { type: Date, default: null },
      expiryNotified: { type: Boolean, default: false }, // Track if we've sent expiry notification
    },
    // Refresh token for session rotation (stored server-side for revocation)
    refreshToken: {
      type: String,
      default: null,
    },
    // Student assignment fields (optional)
    studentInfo: {
      assignedCourse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        default: null,
      },
      assignedSemester: { type: Number, default: null },
      academicYearStart: { type: Number, default: null }, // e.g., 2023
      academicYearEnd: { type: Number, default: null }, // e.g., 2026
    },
  },
  {
    // Add timestamps for createdAt and updatedAt fields
    timestamps: true,
  }
);

// --- Mongoose Middleware ---

// Before saving a new user document, hash the password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Mongoose Methods ---

/**
 * Compares the entered password with the hashed password in the database.
 * @param {string} enteredPassword - The password to compare.
 * @returns {Promise<boolean>} - True if the passwords match, false otherwise.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export the User model
const User = mongoose.model("User", userSchema);

export default User;
