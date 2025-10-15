/**
 * Test Setup
 * Global test configuration and utilities
 */

import mongoose from 'mongoose';
import { jest } from '@jest/globals';

global.jest = jest;

// Setup before all tests
beforeAll(async () => {
    // Use a test database URL
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/academic-vault-test';

    // Connect to the test database
    await mongoose.connect(mongoUri);
});

// Cleanup after all tests
afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
});

// Clear database between tests
afterEach(async () => {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

// Global test utilities
global.testUtils = {
    createTestUser: async (userData = {}) => {
        const User = (await import('../models/user.model.js')).default;

        const defaultUser = {
            firstName: 'Test',
            lastName: 'User',
            username: 'testuser',
            email: 'test@example.com',
            password: 'TestPassword123!',
            isEmailVerified: true,
            role: ['student']
        };

        return await User.create({ ...defaultUser, ...userData });
    },

    createTestSession: async (userId, sessionData = {}) => {
        const Session = (await import('../models/session.model.js')).default;
        const crypto = await import('crypto');
        const bcrypt = await import('bcryptjs');

        const tokenId = crypto.randomBytes(16).toString('hex');
        const tokenSecret = crypto.randomBytes(64).toString('hex');
        const refreshTokenHash = await bcrypt.hash(tokenSecret, 10);

        const defaultSession = {
            user: userId,
            tokenId,
            refreshTokenHash,
            deviceInfo: {
                ip: '127.0.0.1',
                ua: 'test-agent',
                name: 'Test Device'
            },
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            revoked: false
        };

        return await Session.create({ ...defaultSession, ...sessionData });
    },

    createVerificationToken: async (userId, type = 'email_verification') => {
        const VerificationToken = (await import('../models/verificationToken.model.js')).default;
        const crypto = await import('crypto');

        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        await VerificationToken.create({
            user: userId,
            token: hashedToken,
            type,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        return token; // Return raw token for testing
    }
};

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ENCRYPTION_SECRET = 'test-encryption-secret-32-characters';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'testpass';