/**
 * Two-Factor Authentication Service
 * Handles TOTP generation, QR codes, and backup codes
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { encrypt, decrypt } from '../utils/encryption.js';

class TwoFactorService {
    /**
     * Generate 2FA secret for user
     * @param {Object} user - User object
     * @returns {Object} - Secret and QR code data
     */
    async generateSecret(user) {
        const secret = speakeasy.generateSecret({
            name: `${user.firstName} ${user.lastName}`,
            issuer: 'Academic Vault',
            length: 32
        });

        return {
            secret: secret.base32,
            otpauthUrl: secret.otpauth_url
        };
    }

    /**
     * Generate QR code for 2FA setup
     * @param {string} otpauthUrl - OTPAUTH URL
     * @returns {string} - Base64 encoded QR code image
     */
    async generateQRCode(otpauthUrl) {
        try {
            const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
            return qrCodeDataURL;
        } catch (error) {
            throw new Error('Failed to generate QR code');
        }
    }

    /**
     * Verify TOTP token
     * @param {string} token - 6-digit TOTP token
     * @param {string} encryptedSecret - Encrypted user secret
     * @returns {boolean} - Verification result
     */
    verifyToken(token, encryptedSecret) {
        try {
            const secret = decrypt(encryptedSecret);
            if (!secret) return false;

            return speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token,
                window: 2 // Allow 2 time steps (60 seconds) tolerance
            });
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate backup codes
     * @returns {Array} - Array of backup codes
     */
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            // Generate 8-character alphanumeric codes
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(code);
        }
        return codes;
    }

    /**
     * Validate backup code
     * @param {string} inputCode - User input backup code
     * @param {Array} encryptedBackupCodes - Array of encrypted backup codes
     * @returns {Object} - Validation result and remaining codes
     */
    validateBackupCode(inputCode, encryptedBackupCodes) {
        const normalizedInput = inputCode.toUpperCase().replace(/\s/g, '');

        for (let i = 0; i < encryptedBackupCodes.length; i++) {
            const decryptedCode = decrypt(encryptedBackupCodes[i]);
            if (decryptedCode === normalizedInput) {
                // Remove used code
                const remainingCodes = [...encryptedBackupCodes];
                remainingCodes.splice(i, 1);

                return {
                    valid: true,
                    remainingCodes
                };
            }
        }

        return {
            valid: false,
            remainingCodes: encryptedBackupCodes
        };
    }

    /**
     * Encrypt backup codes for storage
     * @param {Array} codes - Plain text backup codes
     * @returns {Array} - Encrypted backup codes
     */
    encryptBackupCodes(codes) {
        return codes.map(code => encrypt(code));
    }

    /**
     * Decrypt backup codes for display
     * @param {Array} encryptedCodes - Encrypted backup codes
     * @returns {Array} - Plain text backup codes
     */
    decryptBackupCodes(encryptedCodes) {
        return encryptedCodes.map(code => decrypt(code)).filter(Boolean);
    }
}

export default new TwoFactorService();