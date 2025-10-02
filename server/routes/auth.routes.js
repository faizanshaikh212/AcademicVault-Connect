/**
 * Authentication Routes
 */

import express from "express";
import {
  registerUser,
  loginUser,
  verifyPassword,
  refreshToken,
  logoutUser,
  listSessions,
  revokeSession,
  revokeAllSessions,
  sendVerificationEmail,
  verifyEmail,
  forgotPassword,
  resetPassword,
  setup2FA,
  verify2FASetup,
  disable2FA,
  verify2FALogin,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  authLimiter,
  strictAuthLimiter,
  emailLimiter,
  twoFALimiter,
  checkAccountLockout,
  logSecurityEvent,
  requireRecentAuth,
  detectSuspiciousActivity
} from "../middleware/securityMiddleware.js";
import {
  validateRegistration,
  validateLogin,
  validateEmail,
  validatePasswordReset,
  validate2FAToken,
  validate2FALogin,
  validatePasswordVerification,
  validate2FADisable,
  validateTokenParam,
  validateSessionId
} from "../middleware/validation.js";

// Relaxed limiter for refresh endpoint specifically
import rateLimit from "express-rate-limit";
const refreshLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 200, // allow more requests per IP in the window
  message: { message: "Too many refresh attempts, please try again later." },
});

const router = express.Router();

// Public auth routes with enhanced security
router.post("/register",
  validateRegistration,
  authLimiter,
  logSecurityEvent('register'),
  registerUser
);

router.post("/login",
  validateLogin,
  authLimiter,
  checkAccountLockout,
  logSecurityEvent('login'),
  detectSuspiciousActivity,
  loginUser
);

// Token refresh and logout
router.post("/refresh", refreshLimiter, refreshToken);
router.post("/logout", authLimiter, logSecurityEvent('logout'), logoutUser);

// Session management (protected)
router.get("/sessions", protect, listSessions);
router.delete("/sessions/:id", protect, validateSessionId, logSecurityEvent('session_revoke'), revokeSession);
router.post("/sessions/revoke-all", protect, logSecurityEvent('all_sessions_revoke'), revokeAllSessions);

// Protected route to verify password
router.post("/verify-password", protect, validatePasswordVerification, verifyPassword);

// Email verification routes
router.post("/send-verification-email",
  validateEmail,
  emailLimiter,
  logSecurityEvent('verification_email'),
  sendVerificationEmail
);
router.get("/verify-email/:token", validateTokenParam, logSecurityEvent('email_verify'), verifyEmail);

// Password reset routes
router.post("/forgot-password",
  validateEmail,
  emailLimiter,
  logSecurityEvent('password_reset_request'),
  forgotPassword
);
router.post("/reset-password/:token",
  validatePasswordReset,
  strictAuthLimiter,
  logSecurityEvent('password_reset'),
  resetPassword
);

// 2FA routes with enhanced security
router.post("/setup-2fa",
  protect,
  requireRecentAuth(10 * 60 * 1000), // 10 minutes
  logSecurityEvent('2fa_setup'),
  setup2FA
);

router.post("/verify-2fa-setup",
  protect,
  validate2FAToken,
  twoFALimiter,
  logSecurityEvent('2fa_verify_setup'),
  verify2FASetup
);

router.post("/disable-2fa",
  protect,
  validate2FADisable,
  requireRecentAuth(30 * 60 * 1000), // 30 minutes
  logSecurityEvent('2fa_disable'),
  disable2FA
);

router.post("/verify-2fa-login",
  validate2FALogin,
  twoFALimiter,
  checkAccountLockout,
  logSecurityEvent('2fa_login'),
  detectSuspiciousActivity,
  verify2FALogin
);

export default router;
