import { hasAnyRole, logRoleCheck } from "../utils/roleUtils.js";

/**
 * Teacher Authorization Middleware
 * Protects teacher routes by verifying teacher or admin role
 * @module middleware/teacher
 */

/**
 * Verifies that the authenticated user has teacher or admin privileges
 * Must be used after authentication middleware
 *
 * @function teacher
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object from auth middleware
 * @param {string[]} req.user.role - User's roles array
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @throws {403} If user is not a teacher or admin
 */
const teacher = (req, res, next) => {
  const context = `${req.method} ${req.originalUrl}`;

  // Check if user exists and has role property
  if (!req.user) {
    logRoleCheck(null, [], 'teacher', false, context + ' - No user object');
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
      error: "NO_USER_OBJECT"
    });
  }

  if (!req.user.role) {
    logRoleCheck(req.user._id, [], 'teacher', false, context + ' - No role property');
    return res.status(403).json({
      success: false,
      message: "User role information missing.",
      error: "NO_ROLE_PROPERTY"
    });
  }

  // Check if user has teacher or admin role
  const hasAccess = hasAnyRole(req.user.role, ['teacher', 'admin']);

  logRoleCheck(req.user._id, req.user.role, 'teacher', hasAccess, context);

  if (hasAccess) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Not authorized as a teacher.",
      error: "INSUFFICIENT_PERMISSIONS",
      requiredRole: "teacher",
      userRoles: req.user.role,
      debug: process.env.NODE_ENV === 'development' ? {
        userId: req.user._id,
        endpoint: req.originalUrl,
        timestamp: new Date().toISOString()
      } : undefined
    });
  }
};

export default teacher;
