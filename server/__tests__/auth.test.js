/**
 * Authentication Tests
 * Comprehensive test suite for authentication endpoints
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../routes/auth.routes.js';
import User from '../models/user.model.js';
import Session from '../models/session.model.js';
import VerificationToken from '../models/verificationToken.model.js';

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);

describe('Authentication Endpoints', () => {
    describe('POST /auth/register', () => {
        const validUserData = {
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            email: 'john@example.com',
            password: 'TestPassword123!'
        };

        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send(validUserData)
                .expect(201);

            expect(response.body.message).toContain('Registration successful');
            expect(response.body.email).toBe(validUserData.email);
            expect(response.body.requiresVerification).toBe(true);

            // Check user was created in database
            const user = await User.findOne({ email: validUserData.email });
            expect(user).toBeTruthy();
            expect(user.isEmailVerified).toBe(false);
        });

        it('should reject registration with invalid email', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({ ...validUserData, email: 'invalid-email' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should reject registration with weak password', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({ ...validUserData, password: '123' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should reject duplicate email registration', async () => {
            // Create user first
            await testUtils.createTestUser({ email: validUserData.email });

            const response = await request(app)
                .post('/auth/register')
                .send(validUserData)
                .expect(400);

            expect(response.body.message).toContain('already exists');
        });
    });

    describe('POST /auth/login', () => {
        let testUser;

        beforeEach(async () => {
            testUser = await testUtils.createTestUser({
                email: 'test@example.com',
                password: 'TestPassword123!',
                isEmailVerified: true
            });
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'TestPassword123!'
                })
                .expect(200);

            expect(response.body.token).toBeDefined();
            expect(response.body.email).toBe('test@example.com');
            expect(response.headers['set-cookie']).toBeDefined();
        });

        it('should reject login with invalid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.message).toContain('Invalid email or password');
        });

        it('should reject login for unverified email', async () => {
            const unverifiedUser = await testUtils.createTestUser({
                email: 'unverified@example.com',
                password: 'TestPassword123!',
                isEmailVerified: false
            });

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'unverified@example.com',
                    password: 'TestPassword123!'
                })
                .expect(401);

            expect(response.body.message).toContain('verify your email');
            expect(response.body.requiresVerification).toBe(true);
        });

        it('should require 2FA when enabled', async () => {
            // Enable 2FA for user
            testUser.twoFactorEnabled = true;
            await testUser.save();

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'TestPassword123!'
                })
                .expect(200);

            expect(response.body.requires2FA).toBe(true);
            expect(response.body.message).toContain('2FA verification required');
        });
    });

    describe('POST /auth/forgot-password', () => {
        let testUser;

        beforeEach(async () => {
            testUser = await testUtils.createTestUser({
                email: 'test@example.com',
                isEmailVerified: true
            });
        });

        it('should send password reset email for valid user', async () => {
            const response = await request(app)
                .post('/auth/forgot-password')
                .send({ email: 'test@example.com' })
                .expect(200);

            expect(response.body.message).toContain('password reset link has been sent');

            // Check that verification token was created
            const token = await VerificationToken.findOne({
                user: testUser._id,
                type: 'password_reset'
            });
            expect(token).toBeTruthy();
        });

        it('should return generic message for non-existent email', async () => {
            const response = await request(app)
                .post('/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' })
                .expect(200);

            expect(response.body.message).toContain('password reset link has been sent');
        });

        it('should reject invalid email format', async () => {
            const response = await request(app)
                .post('/auth/forgot-password')
                .send({ email: 'invalid-email' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /auth/reset-password/:token', () => {
        let testUser;
        let resetToken;

        beforeEach(async () => {
            testUser = await testUtils.createTestUser({
                email: 'test@example.com',
                isEmailVerified: true
            });
            resetToken = await testUtils.createVerificationToken(testUser._id, 'password_reset');
        });

        it('should reset password with valid token', async () => {
            const newPassword = 'NewPassword123!';

            const response = await request(app)
                .post(`/auth/reset-password/${resetToken}`)
                .send({ password: newPassword })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Password reset successfully');

            // Verify password was changed
            const updatedUser = await User.findById(testUser._id);
            const isNewPassword = await updatedUser.matchPassword(newPassword);
            expect(isNewPassword).toBe(true);

            // Verify token was marked as used
            const token = await VerificationToken.findOne({
                user: testUser._id,
                type: 'password_reset'
            });
            expect(token.used).toBe(true);
        });

        it('should reject invalid token', async () => {
            const response = await request(app)
                .post('/auth/reset-password/invalid-token')
                .send({ password: 'NewPassword123!' })
                .expect(400);

            expect(response.body.message).toContain('Invalid or expired');
        });

        it('should reject weak password', async () => {
            const response = await request(app)
                .post(`/auth/reset-password/${resetToken}`)
                .send({ password: '123' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /auth/verify-email/:token', () => {
        let testUser;
        let verificationToken;

        beforeEach(async () => {
            testUser = await testUtils.createTestUser({
                email: 'test@example.com',
                isEmailVerified: false
            });
            verificationToken = await testUtils.createVerificationToken(testUser._id, 'email_verification');
        });

        it('should verify email with valid token', async () => {
            const response = await request(app)
                .get(`/auth/verify-email/${verificationToken}`)
                .expect(200);

            expect(response.body.verified).toBe(true);
            expect(response.body.message).toContain('verified successfully');

            // Check user is now verified
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.isEmailVerified).toBe(true);
        });

        it('should reject invalid token', async () => {
            const response = await request(app)
                .get('/auth/verify-email/invalid-token')
                .expect(400);

            expect(response.body.message).toContain('Invalid or expired');
        });
    });

    describe('GET /auth/sessions', () => {
        let testUser;
        let authToken;

        beforeEach(async () => {
            testUser = await testUtils.createTestUser();
            const session = await testUtils.createTestSession(testUser._id);

            // Generate auth token
            const generateToken = (await import('../utils/generateToken.js')).default;
            authToken = generateToken(testUser._id, session._id);
        });

        it('should list user sessions when authenticated', async () => {
            const response = await request(app)
                .get('/auth/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.sessions).toBeDefined();
            expect(Array.isArray(response.body.sessions)).toBe(true);
        });

        it('should reject unauthenticated requests', async () => {
            const response = await request(app)
                .get('/auth/sessions')
                .expect(401);

            expect(response.body.message).toContain('token');
        });
    });

    describe('Rate Limiting', () => {
        it('should rate limit login attempts', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            // Make multiple failed login attempts
            for (let i = 0; i < 15; i++) {
                await request(app)
                    .post('/auth/login')
                    .send(loginData);
            }

            // Next request should be rate limited
            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(429);

            expect(response.body.message).toContain('Too many');
        });
    });
});

describe('2FA Authentication', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
        testUser = await testUtils.createTestUser({
            email: 'test@example.com',
            isEmailVerified: true
        });
        const session = await testUtils.createTestSession(testUser._id);
        const generateToken = (await import('../utils/generateToken.js')).default;
        authToken = generateToken(testUser._id, session._id);
    });

    describe('POST /auth/setup-2fa', () => {
        it('should setup 2FA for authenticated user', async () => {
            const response = await request(app)
                .post('/auth/setup-2fa')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.secret).toBeDefined();
            expect(response.body.qrCode).toBeDefined();
            expect(response.body.message).toContain('Scan the QR code');
        });

        it('should reject unauthenticated requests', async () => {
            const response = await request(app)
                .post('/auth/setup-2fa')
                .expect(401);

            expect(response.body.message).toContain('token');
        });
    });

    describe('POST /auth/verify-2fa-setup', () => {
        beforeEach(async () => {
            // Setup 2FA first
            await request(app)
                .post('/auth/setup-2fa')
                .set('Authorization', `Bearer ${authToken}`);
        });

        it('should reject invalid 2FA token format', async () => {
            const response = await request(app)
                .post('/auth/verify-2fa-setup')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ token: 'invalid' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .post('/auth/verify-2fa-setup')
                .send({ token: '123456' })
                .expect(401);

            expect(response.body.message).toContain('token');
        });
    });
});