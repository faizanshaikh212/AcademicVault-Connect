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
  // Import logger if needed for debugging
  // import logger from "../utils/logger.js";

  // Uncomment these lines if you need to debug admin access
  /*
  if (req.user) {
    logger.debug(
      req.user.username,
      "Is 'admin'?",
      req.user.role.includes("admin")
    );
  } else {
    logger.debug("No user object found on request.");
  }
  */

  if (req.user && req.user.role && req.user.role.includes("admin")) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin." });
  }
};

export { admin };
