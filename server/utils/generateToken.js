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
const generateToken = (id) => {
  // Sign the token with the user's ID and the JWT secret from environment variables.
  // The token is set to expire in 30 days.
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export default generateToken;
