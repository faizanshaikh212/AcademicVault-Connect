/**
 * Token Generation Utility Module
 * Handles JWT creation for user authentication
 * @module utils/generateToken
 */

import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load environment variables for JWT configuration
dotenv.config();

/**
 * Generates a JSON Web Token (JWT) for user authentication
 * Uses environment variable JWT_SECRET for signing
 *
 * @function generateToken
 * @param {string} id - User's MongoDB ObjectId
 * @returns {string} Signed JWT with 30-day expiration
 * @throws {Error} If JWT_SECRET is not configured
 * @description
 * Token payload includes:
 * - User ID
 * - Issue date (iat)
 * - Expiration date (exp) - 30 days from issue
 */
const generateToken = (userId, sessionId = null) => {
  // Payload includes subject (userId) and session id for revocation checks
  const payload = { sub: userId };
  if (sessionId) payload.sid = String(sessionId);

  return jwt.sign(payload, process.env.JWT_SECRET, {
    // Access tokens: 75 minutes
    expiresIn: "75m",
  });
};

export default generateToken;
