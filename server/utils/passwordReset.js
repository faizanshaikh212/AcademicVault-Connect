/**
 * Password Reset Utilities
 * Handles password reset token generation and validation
 */

import { generateSecureToken, hashToken } from './encryption.js';
import VerificationToken from '../models/verificationToken.model.js';

/**
 * Generate password reset token
 * @param {string} userId - User ID
 * @returns {Object} - Token and hashed token
 */
export const generatePasswordResetToken = async (userId) => {
    const token = generateSecureToken(32);
    const hashedToken = hashToken(token);

    // Set expiration to 1 hour for security
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Remove any existing password reset tokens for this user
    await VerificationToken.deleteMany({
        user: userId,
        type: 'password_reset'
    });

    // Create new password reset token
    await VerificationToken.create({
        user: userId,
        token: hashedToken,
        type: 'password_reset',
        expiresAt
    });

    return { token, hashedToken };
};

/**
 * Validate password reset token
 * @param {string} token - Raw token from email
 * @returns {Object} - Validation result with user ID
 */
export const validatePasswordResetToken = async (token) => {
    const hashedToken = hashToken(token);

    const resetToken = await VerificationToken.findOne({
        token: hashedToken,
        type: 'password_reset',
        used: false,
        expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!resetToken) {
        return { valid: false, error: 'Invalid or expired reset token' };
    }

    return { valid: true, user: resetToken.user, tokenDoc: resetToken };
};

/**
 * Mark password reset token as used
 * @param {string} tokenId - Token document ID
 */
export const markTokenAsUsed = async (tokenId) => {
    await VerificationToken.findByIdAndUpdate(tokenId, { used: true });
};