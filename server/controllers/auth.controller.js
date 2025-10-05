/**
 * Authentication Controller Module
 * Handles user registration, login, and password verification
 * Implements JWT-based authentication system
 * @module controllers/auth
 */

import User from "../models/user.model.js";
import PendingUser from "../models/pendingUser.model.js";
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

    console.log('📝 Registration attempt:', { firstName, lastName, username, email, passwordLength: password?.length });

    // Basic validation
    if (!firstName || !lastName || !username || !email || !password) {
      console.log('❌ Missing required fields');
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

    // Check if there's already a pending registration with the same email or username
    const pendingExists = await PendingUser.findOne({ $or: [{ email }, { username }] });
    if (pendingExists) {
      return res
        .status(400)
        .json({
          message: "A registration with this email or username is already pending verification. Please check your email or try again later.",
          canResend: true
        });
    }

    // Check if email sending is disabled (development mode)
    if (process.env.DISABLE_EMAIL_SENDING === 'true') {
      // For development: create user directly and auto-verify
      const user = await User.create({
        firstName,
        lastName,
        username,
        email,
        password, // Password will be hashed by the pre-save middleware in the model
        role: ["student"],
        isEmailVerified: true, // Auto-verify in development
      });

      const token = generateToken(user._id);

      console.log('Email sending disabled - user created and auto-verified for development');

      return res.status(201).json({
        message: "Registration successful. Email verification disabled for development.",
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          profile: user.profile,
          premium: user.premium
        },
        token,
        requiresVerification: false
      });
    }

    // Production mode: Create pending user and send verification email
    try {
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create pending user (will be stored temporarily until email verification)
      const pendingUser = await PendingUser.create({
        firstName,
        lastName,
        username,
        email,
        password, // Will be hashed by pre-save middleware
        verificationToken
      });

      // Send verification email
      const emailService = (await import('../services/emailService.js')).default;

      // Test email connection first
      const connectionTest = await emailService.testConnection();
      if (!connectionTest) {
        // Clean up pending user if email fails
        await PendingUser.findByIdAndDelete(pendingUser._id);
        throw new Error('Email server connection failed');
      }

      await emailService.sendVerificationEmail({
        firstName: pendingUser.firstName,
        email: pendingUser.email
      }, verificationToken);

      res.status(201).json({
        message: "Registration initiated. Please check your email to verify your account and complete registration.",
        email: pendingUser.email,
        requiresVerification: true,
        pendingVerification: true
      });

    } catch (emailError) {
      console.error('Registration failed:', emailError);

      // Clean up any created pending user
      await PendingUser.deleteOne({ email });

      res.status(500).json({
        message: "Registration failed. Unable to send verification email. Please try again.",
        error: emailError.message
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
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

    console.log(`🔐 Login attempt for: ${email}`);

    // Find user by email
    const user = await User.findOne({ email });
    console.log(`👤 User found: ${user ? 'YES' : 'NO'}`);

    if (user) {
      console.log(`📧 Email verified: ${user.isEmailVerified}`);
      console.log(`🔒 Account locked: ${user.isLocked || false}`);
      console.log(`🔑 2FA enabled: ${user.twoFactorEnabled || false}`);
    }

    // Check if user exists and if the password matches
    const passwordMatch = user ? await user.matchPassword(password) : false;
    console.log(`🔓 Password match: ${passwordMatch}`);

    if (user && passwordMatch) {
      // Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(401).json({
          message: "Please verify your email address before logging in.",
          requiresVerification: true,
          email: user.email
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          message: "Account is temporarily locked due to too many failed login attempts. Please try again later."
        });
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        return res.status(200).json({
          message: "2FA verification required.",
          requires2FA: true,
          email: user.email
        });
      }

      // Reset failed login attempts on successful login
      if (user.failedLoginAttempts > 0) {
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();
      }
      // create session and refresh token pair for login
      const { tokenId, tokenSecret, raw } = createRefreshTokenPair();
      const hashed = await bcrypt.hash(tokenSecret, HASH_ROUNDS);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const sessionService = (await import('../services/sessionService.js')).default;
      const session = await sessionService.createSessionWithDeviceInfo(
        user, req, tokenId, hashed, expiresAt, 'password'
      );

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
        // Enhanced authentication fields
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        lastPasswordChange: user.lastPasswordChange,
      });
    } else {
      // Handle failed login attempt
      if (user) {
        user.failedLoginAttempts += 1;

        // Lock account after 5 failed attempts for 30 minutes
        if (user.failedLoginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }

        await user.save();
      }

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
    const sessionService = (await import('../services/sessionService.js')).default;
    const sessions = await sessionService.getSessionsWithDetails(userId);
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
    const sessionService = (await import('../services/sessionService.js')).default;

    const success = await sessionService.revokeSessionById(userId, sessionId);
    if (!success) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({ message: "Session revoked successfully" });
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
    const sessionService = (await import('../services/sessionService.js')).default;

    const revokedCount = await sessionService.revokeAllSessions(userId);

    // Clear refresh cookie for the current client
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({
      message: `All sessions revoked successfully. ${revokedCount} sessions were terminated.`
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error revoking sessions", error: error.message });
  }
};

/**
 * Send email verification
 */
const sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // First check if there's a pending user
    const pendingUser = await PendingUser.findOne({ email });
    if (pendingUser) {
      // Resend verification for pending registration
      const emailService = (await import('../services/emailService.js')).default;

      await emailService.sendVerificationEmail({
        firstName: pendingUser.firstName,
        email: pendingUser.email
      }, pendingUser.verificationToken);

      return res.json({
        message: "Verification email resent successfully. Please check your inbox to complete registration.",
        email: pendingUser.email,
        isPending: true
      });
    }

    // Check for existing user
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If the email exists, a verification email has been sent." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    // For existing unverified users (legacy flow)
    const { generateEmailVerificationToken } = await import('../utils/emailVerification.js');
    const emailService = (await import('../services/emailService.js')).default;

    const { token } = await generateEmailVerificationToken(user._id);
    await emailService.sendVerificationEmail(user, token);

    res.json({
      message: "Verification email sent successfully.",
      email: user.email,
      isPending: false
    });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({
      message: "Server error sending verification email.",
      error: error.message,
    });
  }
};

/**
 * Verify email address
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required." });
    }

    console.log(`🔍 Verifying email with token: ${token.substring(0, 10)}...`);

    // Find pending user with this verification token
    const pendingUser = await PendingUser.findOne({
      verificationToken: token,
      expiresAt: { $gt: new Date() } // Make sure token hasn't expired
    });

    console.log(`📋 Pending user found: ${pendingUser ? 'YES' : 'NO'}`);
    if (pendingUser) {
      console.log(`📧 Pending user email: ${pendingUser.email}`);
    }

    if (!pendingUser) {
      // Check if a user with this token pattern might have been created recently
      // This helps distinguish between "already verified" vs "expired token"
      const recentUser = await User.findOne({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).sort({ createdAt: -1 });

      if (recentUser) {
        console.log(`🔍 Recent user found, token likely already used successfully`);
        return res.status(400).json({
          message: "This verification link has already been used. If you just registered, your account has been created successfully.",
          code: "TOKEN_USED_OR_EXPIRED",
          hint: "TRY_LOGIN"
        });
      }

      return res.status(400).json({
        message: "This verification link has expired or is invalid. Please register again.",
        code: "TOKEN_USED_OR_EXPIRED"
      });
    }

    // Check if user with this email/username already exists (race condition protection)
    const existingUser = await User.findOne({
      $or: [
        { email: pendingUser.email },
        { username: pendingUser.username }
      ]
    });

    if (existingUser) {
      // Clean up pending user
      await PendingUser.findByIdAndDelete(pendingUser._id);
      return res.status(400).json({
        message: "A user with this email or username already exists. Please log in instead."
      });
    }

    // Create the actual user account using direct database insertion to avoid double-hashing
    const userDoc = await User.collection.insertOne({
      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      username: pendingUser.username,
      email: pendingUser.email,
      password: pendingUser.password, // Already hashed in pending user
      role: ["student"],
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: { theme: "light" },
      profile: {},
      premium: { isPremium: false }
    });

    // Get the created user
    const user = await User.findById(userDoc.insertedId);

    // Clean up pending user
    await PendingUser.findByIdAndDelete(pendingUser._id);

    // Create session for the new user
    const { tokenId, tokenSecret, raw } = createRefreshTokenPair();
    const hashed = await bcrypt.hash(tokenSecret, HASH_ROUNDS);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const sessionService = (await import('../services/sessionService.js')).default;
    const session = await sessionService.createSessionWithDeviceInfo(
      user, req, tokenId, hashed, expiresAt, 'email_verification'
    );

    // Generate JWT token for immediate sign-in
    const jwtToken = generateToken(user._id, session._id);

    // Set refresh token cookie
    res.cookie("refreshToken", raw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      message: "Email verified successfully! Your account has been created and you are now logged in.",
      verified: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        profile: user.profile,
        premium: user.premium
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      message: "Server error during email verification.",
      error: error.message,
    });
  }
};

/**
 * Request password reset
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    // Always return success message for security (don't reveal if email exists)
    const successMessage = "If the email exists in our system, a password reset link has been sent.";

    if (!user) {
      return res.json({ message: successMessage });
    }

    // Check if user is verified
    if (!user.isEmailVerified) {
      return res.json({ message: successMessage }); // Don't reveal unverified status
    }

    const { generatePasswordResetToken } = await import('../utils/passwordReset.js');
    const emailService = (await import('../services/emailService.js')).default;

    const { token } = await generatePasswordResetToken(user._id);
    await emailService.sendPasswordResetEmail(user, token);

    res.json({ message: successMessage });
  } catch (error) {
    res.status(500).json({
      message: "Server error processing password reset request.",
      error: error.message,
    });
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Reset token is required." });
    }

    if (!password) {
      return res.status(400).json({ message: "New password is required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const { validatePasswordResetToken, markTokenAsUsed } = await import('../utils/passwordReset.js');
    const result = await validatePasswordResetToken(token);

    if (!result.valid) {
      return res.status(400).json({ message: result.error });
    }

    const user = result.user;

    // Update password
    user.password = password; // Will be hashed by pre-save middleware
    user.lastPasswordChange = new Date();
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    // Reset failed login attempts
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    await user.save();

    // Mark token as used
    await markTokenAsUsed(result.tokenDoc._id);

    // Revoke all existing sessions for security
    await Session.updateMany({ user: user._id }, { $set: { revoked: true } });

    // Send notification email
    const emailService = (await import('../services/emailService.js')).default;
    await emailService.sendPasswordChangeNotification(user);

    res.json({
      message: "Password reset successfully. Please log in with your new password.",
      success: true
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error during password reset.",
      error: error.message,
    });
  }
};

/**
 * Setup 2FA - Generate secret and QR code
 */
const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is already enabled for this account." });
    }

    const twoFactorService = (await import('../services/twoFactorService.js')).default;
    const { encrypt } = await import('../utils/encryption.js');

    const { secret, otpauthUrl } = await twoFactorService.generateSecret(user);
    const qrCode = await twoFactorService.generateQRCode(otpauthUrl);

    // Store encrypted secret temporarily (not enabled yet)
    user.twoFactorSecret = encrypt(secret);
    user.twoFactorVerified = false;
    await user.save();

    res.json({
      secret,
      qrCode,
      message: "Scan the QR code with your authenticator app and verify with a code to enable 2FA."
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error setting up 2FA.",
      error: error.message,
    });
  }
};

/**
 * Verify 2FA setup
 */
const verify2FASetup = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Verification code is required." });
    }

    const user = await User.findById(req.user._id);

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: "2FA setup not initiated. Please start setup first." });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is already enabled." });
    }

    const twoFactorService = (await import('../services/twoFactorService.js')).default;

    const isValid = twoFactorService.verifyToken(token, user.twoFactorSecret);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid verification code. Please try again." });
    }

    // Generate backup codes
    const backupCodes = twoFactorService.generateBackupCodes();
    const encryptedBackupCodes = twoFactorService.encryptBackupCodes(backupCodes);

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorVerified = true;
    user.twoFactorBackupCodes = encryptedBackupCodes;
    await user.save();

    // Send notification email
    const emailService = (await import('../services/emailService.js')).default;
    await emailService.send2FAEnabledNotification(user);

    res.json({
      message: "2FA enabled successfully!",
      backupCodes,
      warning: "Save these backup codes in a secure location. You won't see them again."
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error verifying 2FA setup.",
      error: error.message,
    });
  }
};

/**
 * Disable 2FA
 */
const disable2FA = async (req, res) => {
  try {
    const { password, token } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Current password is required." });
    }

    const user = await User.findById(req.user._id);

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled for this account." });
    }

    // Verify password
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    // Verify 2FA token if provided
    if (token) {
      const twoFactorService = (await import('../services/twoFactorService.js')).default;
      const isValid = twoFactorService.verifyToken(token, user.twoFactorSecret);

      if (!isValid) {
        return res.status(400).json({ message: "Invalid 2FA code." });
      }
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = [];
    user.twoFactorVerified = false;
    await user.save();

    // Revoke all sessions for security
    await Session.updateMany({ user: user._id }, { $set: { revoked: true } });

    res.json({ message: "2FA disabled successfully. All sessions have been logged out for security." });
  } catch (error) {
    res.status(500).json({
      message: "Server error disabling 2FA.",
      error: error.message,
    });
  }
};

/**
 * Verify 2FA during login
 */
const verify2FALogin = async (req, res) => {
  try {
    const { email, password, token, backupCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (!token && !backupCode) {
      return res.status(400).json({ message: "2FA code or backup code is required." });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({
        message: "Please verify your email address before logging in.",
        requiresVerification: true
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled for this account." });
    }

    const twoFactorService = (await import('../services/twoFactorService.js')).default;
    let isValid = false;

    if (token) {
      // Verify TOTP token
      isValid = twoFactorService.verifyToken(token, user.twoFactorSecret);
    } else if (backupCode) {
      // Verify backup code
      const result = twoFactorService.validateBackupCode(backupCode, user.twoFactorBackupCodes);
      isValid = result.valid;

      if (isValid) {
        // Update remaining backup codes
        user.twoFactorBackupCodes = result.remainingCodes;
        await user.save();
      }
    }

    if (!isValid) {
      return res.status(401).json({ message: "Invalid 2FA code or backup code." });
    }

    // Create session with 2FA login method
    const { tokenId, tokenSecret, raw } = createRefreshTokenPair();
    const hashed = await bcrypt.hash(tokenSecret, HASH_ROUNDS);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const sessionService = (await import('../services/sessionService.js')).default;
    const session = await sessionService.createSessionWithDeviceInfo(
      user, req, tokenId, hashed, expiresAt, 'password_2fa'
    );

    res.cookie("refreshToken", raw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
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
      // Enhanced authentication fields
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      lastPasswordChange: user.lastPasswordChange,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error during 2FA login.",
      error: error.message,
    });
  }
};

/**
 * Get backup codes for 2FA
 */
const getBackupCodes = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled for this account." });
    }

    // Return backup codes (they're already hashed/encrypted in the database)
    res.json({
      message: "Backup codes retrieved successfully",
      backupCodes: user.twoFactorBackupCodes || [],
      totalCodes: user.twoFactorBackupCodes?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error retrieving backup codes.",
      error: error.message,
    });
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
  sendVerificationEmail,
  verifyEmail,
  forgotPassword,
  resetPassword,
  setup2FA,
  verify2FASetup,
  disable2FA,
  verify2FALogin,
  getBackupCodes,
};
