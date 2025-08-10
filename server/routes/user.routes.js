/**
 * User Routes Module
 * Handles user profile, settings, and social interactions
 * Includes public and protected endpoints
 * @module routes/user
 */

import express from "express";
import {
  getUserProfile,
  getUserById,
  updateUserProfile,
  updateUserSettings,
  followUser,
  handleFriendRequest,
  blockUser,
  getAllPublicUsers,
  submitRoleRequest,
} from "../controllers/user.controller.js";
import { protect, optionalAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @route GET /api/users/all
 * @description Get a list of all public users
 * @access Public
 * @returns {Array<Object>} Array of user objects with public information
 */
router.get("/all", getAllPublicUsers);

/**
 * @route GET /api/users/:username
 * @description Get a user's profile by username with optional auth for following status
 * @access Public (with optional auth)
 * @param {string} username - Username to fetch profile for
 * @returns {Object} User profile data
 */
router.get("/:username", optionalAuth, getUserProfile);

/**
 * @route GET /api/users/id/:id
 * @description Get a user's profile by their ID
 * @access Public
 * @param {string} id - User ID to fetch
 * @returns {Object} User profile data
 */
router.get("/id/:id", getUserById);

/**
 * @route PUT /api/users/profile
 * @description Update the current user's profile information
 * @access Private
 * @body {Object} profileData - Profile data to update
 * @returns {Object} Updated user profile
 */
router.put("/profile", protect, updateUserProfile);

/**
 * @route PUT /api/users/settings
 * @description Update the current user's account settings
 * @access Private
 * @body {Object} settingsData - Settings data to update
 * @returns {Object} Updated user settings
 */
router.put("/settings", protect, updateUserSettings);

/**
 * @route POST /api/users/:id/follow
 * @description Follow or unfollow a user
 * @access Private
 * @param {string} id - User ID to follow/unfollow
 * @returns {Object} Updated follow status
 */
router.post("/:id/follow", protect, followUser);

/**
 * @route POST /api/users/:id/friend
 * @description Send, accept, or reject a friend request
 * @access Private
 * @param {string} id - User ID to handle friend request with
 * @body {string} action - Action to take ('send', 'accept', or 'reject')
 * @returns {Object} Updated friend request status
 */
router.post("/:id/friend", protect, handleFriendRequest);

/**
 * @route POST /api/users/:id/block
 * @description Block or unblock a user
 * @access Private
 * @param {string} id - User ID to block/unblock
 * @returns {Object} Updated block status
 */
router.post("/:id/block", protect, blockUser);

/**
 * @route POST /api/users/request-teacher-role
 * @description Submit a request for teacher role
 * @access Private
 * @body {Object} requestData - Role request details including qualifications
 * @returns {Object} Created role request
 */
router.post("/request-teacher-role", protect, submitRoleRequest);

export default router;
