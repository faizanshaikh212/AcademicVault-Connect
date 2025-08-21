/**
 * Notification Routes Module
 * Handles user notification retrieval and management
 * All routes require authentication
 * @module routes/notification
 */

import express from "express";
import {
  getNotifications,
  markNotificationsAsRead,
  getNotificationHistory,
  clearNotifications,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @route GET /api/notifications
 * @description Get all notifications for the authenticated user
 * @access Private
 * @returns {Array<Object>} Array of notification objects
 */
router.route("/").get(protect, getNotifications);

/**
 * @route POST /api/notifications/read
 * @description Mark notifications as read for the authenticated user
 * @access Private
 * @body {Array<string>} notificationIds - Array of notification IDs to mark as read
 * @returns {Object} Updated notification status
 */
router.route("/read").post(protect, markNotificationsAsRead);

/**
 * @route GET /api/notifications/history
 * @description Get all notification history for the authenticated user
 * @access Private
 * @returns {Array<Object>} Array of notification objects
 */
router.route("/history").get(protect, getNotificationHistory);

/**
 * @route POST /api/notifications/clear
 * @description Clear all uncleared notifications for the authenticated user
 * @access Private
 * @returns {Object} Success message
 */
router.route("/clear").post(protect, clearNotifications);

export default router;
