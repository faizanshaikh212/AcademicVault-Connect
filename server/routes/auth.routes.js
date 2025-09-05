/**
 * Authentication Routes Module
 * Handles all authentication-related endpoints
 * @module routes/auth
 */

import express from "express";
import {
  registerUser,
  loginUser,
  verifyPassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

// Initialize the express router
const router = express.Router();

/**
 * Authentication Routes
 * @name auth-routes
 * @description Endpoints for user authentication
 */

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 * @body
 * - firstName: string
 * - lastName: string
 * - email: string
 * - password: string
 * @returns User object with JWT token
 */
router.post("/register", registerUser);

/**
 * @route POST /api/auth/login
 * @description Authenticate user and get token
 * @access Public
 * @body
 * - email: string
 * - password: string
 * @returns User object with JWT token
 */
router.post("/login", loginUser);

/**
 * @route POST /api/auth/verify-password
 * @description Verify user's current password
 * @access Private
 * @middleware protect - Requires authentication
 * @body
 * - password: string
 * @returns {Object} Valid status
 */
router.post("/verify-password", protect, verifyPassword);

export default router;
