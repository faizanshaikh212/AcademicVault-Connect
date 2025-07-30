import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Generates a JSON Web Token (JWT) for a user.
 * @param {string} id - The user's MongoDB ObjectId.
 * @returns {string} - The generated JWT.
 */
const generateToken = (id) => {
  // Sign the token with the user's ID and the JWT secret from environment variables.
  // The token is set to expire in 30 days.
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export default generateToken;
