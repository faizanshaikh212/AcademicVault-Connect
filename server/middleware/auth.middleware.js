/**
 * Authentication Middleware Module
 * Provides route protection and optional authentication functionality
 * @module middleware/auth
 */

import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Middleware to protect routes that require authentication
 * Verifies JWT token and attaches user to request object
 *
 * @async
 * @function protect
 * @param {Object} req - Express request object
 * @param {Object} req.headers - Request headers
 * @param {string} req.headers.authorization - Bearer token
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @throws {401} If no token provided or token is invalid
 * @throws {401} If user not found
 */
const protect = async (req, res, next) => {
  let token;

  // Check if the Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(" ")[1];

      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by the ID from the token payload
      // Exclude the password field from the result
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error("Token verification failed:", error.message);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate user but allows request to proceed regardless
 * Used for routes that can work with or without authentication
 *
 * @async
 * @function optionalAuth
 * @param {Object} req - Express request object
 * @param {Object} req.headers - Request headers
 * @param {string} req.headers.authorization - Optional bearer token
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @description
 * If valid token provided:
 * - Verifies token and attaches user to request
 * If no token or invalid token:
 * - Sets req.user to undefined
 * - Allows request to proceed
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      console.log("Optional auth token invalid:", error.message);
    }
  }

  next();
};

export { protect, optionalAuth };
