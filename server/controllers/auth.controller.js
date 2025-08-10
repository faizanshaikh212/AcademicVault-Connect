/**
 * Authentication Controller Module
 * Handles user registration, login, and password verification
 * Implements JWT-based authentication system
 * @module controllers/auth
 */

import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";

/**
 * Register a new user in the system
 * @async
 * @function registerUser
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user data
 * @param {string} req.body.firstName - User's first name
 * @param {string} req.body.lastName - User's last name
 * @param {string} req.body.username - Unique username
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password (will be hashed)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} When registration fails
 * @access Public
 */
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    // Basic validation
    if (!firstName || !lastName || !username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    // Check if user already exists with the same email or username
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email or username already exists." });
    }

    // Create a new user
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password, // Password will be hashed by the pre-save middleware in the model
    });

    if (user) {
      // If user is created successfully, send back user data and a token
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        settings: user.settings,
        profile: user.profile,
        premium: user.premium,
        token: generateToken(user._id),
        updatedAt: user.updatedAt,
      });
    } else {
      res.status(400).json({ message: "Invalid user data." });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error during registration.",
      error: error.message,
    });
  }
};

/**
 * Authenticate user and generate JWT token
 * @async
 * @function loginUser
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} When authentication fails
 * @access Public
 * @description Validates user credentials and returns user data with JWT token if valid
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and if the password matches
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        settings: user.settings,
        profile: user.profile,
        premium: user.premium,
        token: generateToken(user._id),
        updatedAt: user.updatedAt,
      });
    } else {
      // Use a generic message to avoid revealing whether the email or password was wrong
      res.status(401).json({ message: "Invalid email or password." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error during login.", error: error.message });
  }
};

/**
 * Verify user's password for sensitive operations
 * @async
 * @function verifyPassword
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.password - Password to verify
 * @param {Object} req.user - Authenticated user object (from middleware)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} When verification fails
 * @access Private
 * @description Used for confirming user's password before sensitive operations
 */
const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(password))) {
      res.json({ valid: true });
    } else {
      res
        .status(401)
        .json({ message: "Incorrect password. Please verify and try again." });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error during password verification.",
      error: error.message,
    });
  }
};

export { registerUser, loginUser, verifyPassword };
