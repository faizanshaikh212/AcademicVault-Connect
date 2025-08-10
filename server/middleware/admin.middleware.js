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
  /*
  // --- DEBUGGING STEP ---

  if (req.user) {
    console.log(
      req.user.username,
      "Is 'admin'?",
      req.user.role.includes("admin")
    );
  } else {
    console.log("No user object found on request.");
  }
  console.log("");
  // --- END DEBUGGING STEP ---
  
  */

  if (req.user && req.user.role && req.user.role.includes("admin")) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin." });
  }
};

export { admin };
