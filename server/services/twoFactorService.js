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
            length: 32
        });
        const label = `${user.firstName} ${user.lastName}`;

        return {
            secret: secret.base32,
            otpauthUrl: speakeasy.otpauthURL({
                secret: secret.base32,
                encoding: 'base32',
                label: `Academic Vault:${label}`,
                issuer: 'Academic Vault'
            })
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
     * @param {Array} encryptedUsedCodes - Array of encrypted used backup codes
     * @returns {Object} - Validation result and updated codes
     */
    validateBackupCode(inputCode, encryptedBackupCodes, encryptedUsedCodes = []) {
        const normalizedInput = inputCode.toUpperCase().replace(/\s/g, '');

        // Check if code is already used
        for (const usedCode of encryptedUsedCodes) {
            const decryptedUsedCode = decrypt(usedCode);
            if (decryptedUsedCode === normalizedInput) {
                return {
                    valid: false,
                    error: 'This backup code has already been used',
                    remainingCodes: encryptedBackupCodes,
                    usedCodes: encryptedUsedCodes
                };
            }
        }

        // Check if code is valid
        for (let i = 0; i < encryptedBackupCodes.length; i++) {
            const decryptedCode = decrypt(encryptedBackupCodes[i]);
            if (decryptedCode === normalizedInput) {
                // Move code from available to used
                const remainingCodes = [...encryptedBackupCodes];
                const usedCode = remainingCodes.splice(i, 1)[0];
                const updatedUsedCodes = [...encryptedUsedCodes, usedCode];

                return {
                    valid: true,
                    remainingCodes,
                    usedCodes: updatedUsedCodes
                };
            }
        }

        return {
            valid: false,
            error: 'Invalid backup code',
            remainingCodes: encryptedBackupCodes,
            usedCodes: encryptedUsedCodes
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

    /**
     * Get all backup codes with their status (used/unused)
     * @param {Array} encryptedAvailableCodes - Encrypted available backup codes
     * @param {Array} encryptedUsedCodes - Encrypted used backup codes
     * @returns {Array} - Array of backup code objects with status
     */
    getAllBackupCodesWithStatus(encryptedAvailableCodes, encryptedUsedCodes = []) {
        // Safety check for undefined/null arrays
        const availableCodesArray = Array.isArray(encryptedAvailableCodes) ? encryptedAvailableCodes : [];
        const usedCodesArray = Array.isArray(encryptedUsedCodes) ? encryptedUsedCodes : [];

        const availableCodes = this.decryptBackupCodes(availableCodesArray).map(code => ({
            code,
            isUsed: false
        }));

        const usedCodes = this.decryptBackupCodes(usedCodesArray).map(code => ({
            code,
            isUsed: true
        }));

        // Combine and sort to maintain consistent order
        return [...availableCodes, ...usedCodes].sort((a, b) => a.code.localeCompare(b.code));
    }
}

export default new TwoFactorService();