/**
 * Email Verification Utilities
 * Handles email verification token generation and validation
 */

import { generateSecureToken, hashToken } from './encryption.js';
import VerificationToken from '../models/verificationToken.model.js';

/**
 * Generate email verification token
 * @param {string} userId - User ID
 * @returns {Object} - Token and hashed token
 */
export const generateEmailVerificationToken = async (userId) => {
    const token = generateSecureToken(32);
    const hashedToken = hashToken(token);

    // Set expiration to 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Remove any existing verification tokens for this user
    await VerificationToken.deleteMany({
        user: userId,
        type: 'email_verification'
    });

    // Create new verification token
    await VerificationToken.create({
        user: userId,
        token: hashedToken,
        type: 'email_verification',
        expiresAt
    });

    return { token, hashedToken };
};

/**
 * Validate email verification token
 * @param {string} token - Raw token from email
 * @returns {Object} - Validation result with user ID
 */
export const validateEmailVerificationToken = async (token) => {
    const hashedToken = hashToken(token);

    const verificationToken = await VerificationToken.findOne({
        token: hashedToken,
        type: 'email_verification',
        used: false,
        expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!verificationToken) {
        return { valid: false, error: 'Invalid or expired verification token' };
    }

    // Mark token as used
    verificationToken.used = true;
    await verificationToken.save();

    return { valid: true, user: verificationToken.user };
};

/**
 * Clean up expired verification tokens
 */
export const cleanupExpiredTokens = async () => {
    await VerificationToken.deleteMany({
        expiresAt: { $lt: new Date() }
    });
};