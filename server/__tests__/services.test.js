/**
 * Services Tests
 * Test suite for authentication services
 */

import twoFactorService from '../services/twoFactorService.js';
import sessionService from '../services/sessionService.js';
import emailService from '../services/emailService.js';
import { encrypt, decrypt, generateSecureToken } from '../utils/encryption.js';

describe('TwoFactorService', () => {
    const mockUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
    };

    describe('generateSecret', () => {
        it('should generate a valid 2FA secret', async () => {
            const result = await twoFactorService.generateSecret(mockUser);

            expect(result.secret).toBeDefined();
            expect(result.otpauthUrl).toBeDefined();
            expect(result.secret).toMatch(/^[A-Z2-7]+$/); // Base32 format
            expect(decodeURIComponent(result.otpauthUrl)).toContain('Academic Vault');
        });
    });

    describe('generateQRCode', () => {
        it('should generate a QR code data URL', async () => {
            const otpauthUrl = 'otpauth://totp/Academic%20Vault:test@example.com?secret=TESTSECRET&issuer=Academic%20Vault';

            const qrCode = await twoFactorService.generateQRCode(otpauthUrl);

            expect(qrCode).toBeDefined();
            expect(qrCode).toMatch(/^data:image\/png;base64,/);
        });
    });

    describe('generateBackupCodes', () => {
        it('should generate 10 backup codes', () => {
            const codes = twoFactorService.generateBackupCodes();

            expect(codes).toHaveLength(10);
            codes.forEach(code => {
                expect(code).toMatch(/^[A-F0-9]{8}$/);
            });
        });
    });

    describe('encryptBackupCodes', () => {
        it('should encrypt backup codes', () => {
            const codes = ['ABCD1234', 'EFGH5678'];
            const encrypted = twoFactorService.encryptBackupCodes(codes);

            expect(encrypted).toHaveLength(2);
            encrypted.forEach(encryptedCode => {
                expect(encryptedCode).toBeDefined();
                expect(encryptedCode).not.toBe(codes[0]);
                expect(encryptedCode).not.toBe(codes[1]);
            });
        });
    });

    describe('validateBackupCode', () => {
        it('should validate correct backup code', () => {
            const codes = ['ABCD1234', 'EFGH5678'];
            const encrypted = twoFactorService.encryptBackupCodes(codes);

            const result = twoFactorService.validateBackupCode('ABCD1234', encrypted);

            expect(result.valid).toBe(true);
            expect(result.remainingCodes).toHaveLength(1);
        });

        it('should reject invalid backup code', () => {
            const codes = ['ABCD1234', 'EFGH5678'];
            const encrypted = twoFactorService.encryptBackupCodes(codes);

            const result = twoFactorService.validateBackupCode('INVALID1', encrypted);

            expect(result.valid).toBe(false);
            expect(result.remainingCodes).toHaveLength(2);
        });
    });
});

describe('SessionService', () => {
    const mockUser = { _id: 'user123' };
    const mockReq = {
        ip: '192.168.1.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    };

    describe('extractDeviceInfo', () => {
        it('should extract device information from request', () => {
            const deviceInfo = sessionService.extractDeviceInfo(mockReq);

            expect(deviceInfo.ip).toBe('192.168.1.1');
            expect(deviceInfo.ua).toBeDefined();
            expect(deviceInfo.name).toBeDefined();
            expect(deviceInfo.browser).toBeDefined();
            expect(deviceInfo.os).toBeDefined();
            expect(deviceInfo.location).toEqual({
                country: 'Unknown',
                city: 'Unknown',
                region: 'Unknown'
            });
        });
    });

    describe('generateDeviceName', () => {
        it('should generate readable device name', () => {
            const uaResult = {
                browser: { name: 'Chrome', version: '91.0' },
                os: { name: 'Windows', version: '10' },
                device: { type: undefined }
            };

            const deviceName = sessionService.generateDeviceName(uaResult);

            expect(deviceName).toContain('Chrome');
            expect(deviceName).toContain('Windows');
        });

        it('should handle mobile devices', () => {
            const uaResult = {
                browser: { name: 'Safari', version: '14.0' },
                os: { name: 'iOS', version: '14.0' },
                device: { type: 'mobile' }
            };

            const deviceName = sessionService.generateDeviceName(uaResult);

            expect(deviceName).toContain('Mobile');
            expect(deviceName).toContain('Safari');
            expect(deviceName).toContain('iOS');
        });
    });

    describe('formatLocation', () => {
        it('should format complete location', () => {
            const location = {
                city: 'New York',
                region: 'NY',
                country: 'US'
            };

            const formatted = sessionService.formatLocation(location);

            expect(formatted).toBe('New York, NY, US');
        });

        it('should handle missing location data', () => {
            const location = { country: 'Unknown' };

            const formatted = sessionService.formatLocation(location);

            expect(formatted).toBe('Unknown Location');
        });
    });

    describe('detectSuspiciousActivity', () => {
        let testUser;

        beforeEach(async () => {
            testUser = await testUtils.createTestUser();
        });

        it('should not infer a location change when geolocation is unavailable', async () => {
            await testUtils.createTestSession(testUser._id, {
                deviceInfo: {
                    location: { country: 'US' }
                }
            });

            const mockReqWithoutLocation = {
                ...mockReq,
                ip: '192.168.1.2'
            };

            const result = await sessionService.detectSuspiciousActivity(testUser._id, mockReqWithoutLocation);

            expect(result.isSuspicious).toBe(false);
            expect(result.factors).not.toContain('new_location');
        });
    });
});

describe('Encryption Utils', () => {
    describe('encrypt/decrypt', () => {
        it('should encrypt and decrypt text correctly', () => {
            const originalText = 'sensitive data';

            const encrypted = encrypt(originalText);
            expect(encrypted).toBeDefined();
            expect(encrypted).not.toBe(originalText);

            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(originalText);
        });

        it('should handle null values', () => {
            expect(encrypt(null)).toBeNull();
            expect(decrypt(null)).toBeNull();
        });

        it('should handle empty strings', () => {
            const encrypted = encrypt('');
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe('');
        });
    });

    describe('generateSecureToken', () => {
        it('should generate secure random tokens', () => {
            const token1 = generateSecureToken();
            const token2 = generateSecureToken();

            expect(token1).toBeDefined();
            expect(token2).toBeDefined();
            expect(token1).not.toBe(token2);
            expect(token1).toMatch(/^[a-f0-9]+$/);
            expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
        });

        it('should generate tokens of specified length', () => {
            const token = generateSecureToken(16);
            expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
        });
    });
});

describe('EmailService', () => {
    const mockUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
    };

    // Mock nodemailer for testing
    beforeEach(() => {
        // Mock the transporter
        emailService.transporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
        };
    });

    describe('getEmailTemplate', () => {
        it('should generate verification email template', () => {
            const template = emailService.getEmailTemplate('verification', {
                firstName: 'Test',
                verificationUrl: 'http://example.com/verify/token',
                supportEmail: 'support@example.com'
            });

            expect(template).toContain('Test');
            expect(template).toContain('http://example.com/verify/token');
            expect(template).toContain('support@example.com');
        });

        it('should generate password reset email template', () => {
            const template = emailService.getEmailTemplate('passwordReset', {
                firstName: 'Test',
                resetUrl: 'http://example.com/reset/token',
                supportEmail: 'support@example.com'
            });

            expect(template).toContain('Test');
            expect(template).toContain('http://example.com/reset/token');
            expect(template).toContain('Password Reset');
        });
    });

    describe('sendVerificationEmail', () => {
        it('should send verification email successfully', async () => {
            await expect(
                emailService.sendVerificationEmail(mockUser, 'test-token')
            ).resolves.not.toThrow();

            expect(emailService.transporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: mockUser.email,
                    subject: expect.stringContaining('Verify'),
                    html: expect.any(String)
                })
            );
        });
    });

    describe('sendPasswordResetEmail', () => {
        it('should send password reset email successfully', async () => {
            await expect(
                emailService.sendPasswordResetEmail(mockUser, 'reset-token')
            ).resolves.not.toThrow();

            expect(emailService.transporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: mockUser.email,
                    subject: expect.stringContaining('Reset'),
                    html: expect.any(String)
                })
            );
        });
    });
});