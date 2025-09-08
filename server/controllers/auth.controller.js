/**
 * Authentication Controller Module
 * Handles user registration, login, and password verification
 * Implements JWT-based authentication system
 * @module controllers/auth
 */

import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";

// Helper to create a refresh token pair: tokenId and secret
const createRefreshTokenPair = () => {
  const tokenId = crypto.randomBytes(16).toString("hex"); // shorter id for indexing
  const tokenSecret = crypto.randomBytes(64).toString("hex");
  const raw = `${tokenId}.${tokenSecret}`;
  return { tokenId, tokenSecret, raw };
};

const HASH_ROUNDS = 10; // bcrypt rounds for hashing refresh secret

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

    // Create a new user with default student role
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password, // Password will be hashed by the pre-save middleware in the model
      role: ["student"], // Explicitly set the default role as an array
    });

    if (user) {
      // create session and refresh token pair
      const { tokenId, tokenSecret, raw } = createRefreshTokenPair();
      const hashed = await bcrypt.hash(tokenSecret, HASH_ROUNDS);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const session = await Session.create({
        user: user._id,
        tokenId,
        refreshTokenHash: hashed,
        deviceInfo: { ua: req.get("user-agent") || "", ip: req.ip },
        expiresAt,
      });

      // set cookie with raw token (tokenId.tokenSecret)
      res.cookie("refreshToken", raw, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

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
        token: generateToken(user._id, session._id),
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
      // create session and refresh token pair for login
      const { tokenId, tokenSecret, raw } = createRefreshTokenPair();
      const hashed = await bcrypt.hash(tokenSecret, HASH_ROUNDS);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const session = await Session.create({
        user: user._id,
        tokenId,
        refreshTokenHash: hashed,
        deviceInfo: { ua: req.get("user-agent") || "", ip: req.ip },
        expiresAt,
      });

      // set cookie with raw token (tokenId.tokenSecret)
      res.cookie("refreshToken", raw, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

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
        token: generateToken(user._id, session._id),
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

// (Export moved to bottom after refresh/logout implementations)

/**
 * Refresh access token using refresh token cookie
 * - Reads refreshToken from httpOnly cookie
 * - Verifies it matches stored value for user
 * - Issues new access token and rotates refresh token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies || {};
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    // parse tokenId and secret from cookie: tokenId.secret
    const [tokenId, tokenSecret] = refreshToken.split(".");
    if (!tokenId || !tokenSecret) {
      return res.status(401).json({ message: "Malformed refresh token" });
    }

    const session = await Session.findOne({ tokenId });
    if (!session || session.revoked || session.expiresAt < new Date()) {
      // possible reuse or expired
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // verify secret against stored hash
    const ok = await bcrypt.compare(tokenSecret, session.refreshTokenHash);
    if (!ok) {
      // token mismatch — potential theft; revoke all sessions for this user and respond 401
      await Session.updateMany(
        { user: session.user },
        { $set: { revoked: true } }
      );
      logger.error("Refresh token reuse detected for user", {
        userId: session.user,
        tokenId,
      });
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Rotate: create new tokenSecret (keep tokenId or rotate tokenId)
    const {
      tokenId: newTokenId,
      tokenSecret: newSecret,
      raw: newRaw,
    } = createRefreshTokenPair();
    const newHash = await bcrypt.hash(newSecret, HASH_ROUNDS);

    // create a new session document and link previous session
    const newSession = await Session.create({
      user: session.user,
      tokenId: newTokenId,
      refreshTokenHash: newHash,
      deviceInfo: session.deviceInfo,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      replacedBy: null,
    });

    // mark old session replaced and revoked
    session.revoked = true;
    session.replacedBy = newSession._id;
    await session.save();

    // send new cookie
    res.cookie("refreshToken", newRaw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // issue new access token with session id = newSession._id
    const accessToken = generateToken(session.user, newSession._id);
    res.json({ token: accessToken });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error refreshing token", error: error.message });
  }
};

/**
 * Logout user by clearing refresh token cookie and server-side value
 */
const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.cookies || {};
    if (refreshToken) {
      const [tokenId] = refreshToken.split(".");
      if (tokenId) {
        const session = await Session.findOne({ tokenId });
        if (session) {
          session.revoked = true;
          await session.save();
        }
      }
    }

    // Clear cookie from client
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({ message: "Logged out" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error logging out", error: error.message });
  }
};

/**
 * List active sessions for the authenticated user
 */
const listSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessions = await Session.find({ user: userId }).select(
      "_id tokenId deviceInfo createdAt lastUsedAt expiresAt revoked"
    );
    res.json({ sessions });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching sessions", error: error.message });
  }
};

/**
 * Revoke a single session (by id) for the authenticated user
 */
const revokeSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessionId = req.params.id;
    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    session.revoked = true;
    await session.save();
    res.json({ message: "Session revoked" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error revoking session", error: error.message });
  }
};

/**
 * Revoke all sessions for authenticated user (useful for "log out of all devices")
 */
const revokeAllSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    await Session.updateMany({ user: userId }, { $set: { revoked: true } });
    // Clear refresh cookie for the current client
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    // Also clear local token if present
    res.json({ message: "All sessions revoked" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error revoking sessions", error: error.message });
  }
};

export {
  registerUser,
  loginUser,
  verifyPassword,
  refreshToken,
  logoutUser,
  listSessions,
  revokeSession,
  revokeAllSessions,
};
