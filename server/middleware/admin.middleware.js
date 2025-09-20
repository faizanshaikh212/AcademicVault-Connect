import { hasRole, logRoleCheck } from "../utils/roleUtils.js";

/**
 * Admin Authorization Middleware Module
 * Protects admin-only routes by verifying admin role
 * @module middleware/admin
 */

/**
 * Verifies that the authenticated user has admin privileges
 * Must be used after authentication middleware
 *
 * @function admin
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object from auth middleware
 * @param {string[]} req.user.role - User's roles array
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @throws {403} If user is not an admin
 * @description
 * Checks if:
 * 1. User object exists on request (auth middleware ran)
 * 2. User has role property
 * 3. User's roles include "admin"
 */
const admin = (req, res, next) => {
  const context = `${req.method} ${req.originalUrl}`;

  // Check if user exists and has role property
  if (!req.user) {
    logRoleCheck(null, [], 'admin', false, context + ' - No user object');
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
      error: "NO_USER_OBJECT"
    });
  }

  if (!req.user.role) {
    logRoleCheck(req.user._id, [], 'admin', false, context + ' - No role property');
    return res.status(403).json({
      success: false,
      message: "User role information missing.",
      error: "NO_ROLE_PROPERTY"
    });
  }

  // Check if user has admin role
  const hasAccess = hasRole(req.user.role, 'admin');

  logRoleCheck(req.user._id, req.user.role, 'admin', hasAccess, context);

  if (hasAccess) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Not authorized as an admin.",
      error: "INSUFFICIENT_PERMISSIONS",
      requiredRole: "admin",
      userRoles: req.user.role,
      debug: process.env.NODE_ENV === 'development' ? {
        userId: req.user._id,
        endpoint: req.originalUrl,
        timestamp: new Date().toISOString()
      } : undefined
    });
  }
};

export { admin };
