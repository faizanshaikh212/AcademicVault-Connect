/**
 * Authentication Routes
 */

import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerUser,
  loginUser,
  verifyPassword,
  refreshToken,
  logoutUser,
  listSessions,
  revokeSession,
  revokeAllSessions,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

// Basic rate limiter for auth endpoints to slow down brute-force/replay attempts
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  message: { message: "Too many requests, please try again later." },
});

// Relaxed limiter for refresh endpoint specifically. The refresh endpoint may
// be called automatically by many client instances; give a higher allowance
// and a slightly longer window to avoid accidental 429s from legitimate
// background refresh activity.
const refreshLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 200, // allow more requests per IP in the window
  message: { message: "Too many refresh attempts, please try again later." },
});

const router = express.Router();

// Public auth routes
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);

// Token refresh and logout
// Use a relaxed limiter for refresh because many clients may call it in the
// background; keep login/register under the stricter limiter.
router.post("/refresh", refreshLimiter, refreshToken);
router.post("/logout", authLimiter, logoutUser);

// Session management (protected)
router.get("/sessions", protect, listSessions);
router.delete("/sessions/:id", protect, revokeSession);
router.post("/sessions/revoke-all", protect, revokeAllSessions);

// Protected route to verify password
router.post("/verify-password", protect, verifyPassword);

export default router;
