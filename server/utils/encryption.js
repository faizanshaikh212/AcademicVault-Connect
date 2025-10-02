/**
 * Encryption Utilities
 * Provides secure encryption/decryption for sensitive data like 2FA secrets
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.ENCRYPTION_SECRET ?
    crypto.createHash('sha256').update(process.env.ENCRYPTION_SECRET).digest() :
    crypto.randomBytes(32);

/**
 * Encrypt sensitive data
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text with IV
 */
export const encrypt = (text) => {
    if (!text) return null;

    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text with IV
 * @returns {string} - Decrypted text
 */
export const decrypt = (encryptedText) => {
    if (!encryptedText) return null;

    try {
        const [ivHex, encrypted] = encryptedText.split(':');
        if (!ivHex || !encrypted) return null;

        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
};

/**
 * Generate cryptographically secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Hex encoded random token
 */
export const generateSecureToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a token for secure storage
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};