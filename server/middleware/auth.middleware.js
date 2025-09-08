/**
 * Authentication Middleware Module
 * Provides route protection and optional authentication functionality
 * @module middleware/auth
 */

import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import logger from "../utils/logger.js";

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

      // decoded.sub is user id, decoded.sid is session id
      const userId = decoded.sub;
      const sessionId = decoded.sid;

      // Attach user
      req.user = await User.findById(userId).select("-password");
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      // If session id present, verify session is valid
      if (sessionId) {
        const session = await Session.findById(sessionId);
        if (!session || session.revoked || session.expiresAt < new Date()) {
          return res
            .status(401)
            .json({ message: "Not authorized, session invalid" });
        }
        // update lastUsedAt
        session.lastUsedAt = new Date();
        await session.save();
      }

      // Proceed
      next();
    } catch (error) {
      // Distinguish expired tokens from other verification errors so the
      // client can react appropriately (e.g. prompt for re-login or refresh)
      if (error.name === "TokenExpiredError") {
        // Log at debug level to avoid noisy error logs for expected expirations
        logger.debug("Token verification failed: token expired");
        return res.status(401).json({ message: "Token expired" });
      }

      logger.error("Token verification failed:", error.message);
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
      const userId = decoded.sub;
      const sessionId = decoded.sid;
      req.user = await User.findById(userId).select("-password");
      if (sessionId) {
        const session = await Session.findById(sessionId);
        if (session && !session.revoked && session.expiresAt >= new Date()) {
          session.lastUsedAt = new Date();
          await session.save();
        } else {
          // If session invalid, just don't attach user
          req.user = undefined;
        }
      }
    } catch (error) {
      // Optional auth should not interrupt the request; be explicit when token
      // expired so callers can know why `req.user` is undefined if needed.
      if (error.name === "TokenExpiredError") {
        logger.debug("Optional auth token expired");
      } else {
        logger.debug("Optional auth token invalid:", error.message);
      }
    }
  }

  next();
};

export { protect, optionalAuth };
