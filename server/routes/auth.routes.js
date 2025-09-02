/**
 * Authentication Routes
 */

import express from "express";
import {
  registerUser,
  loginUser,
  verifyPassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected route to verify password
router.post("/verify-password", protect, verifyPassword);

export default router;
