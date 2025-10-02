/**
 * Environment Configuration
 * Validates and provides default values for environment variables
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Validate required environment variables
 */
const validateEnvironment = () => {
    const required = [
        'JWT_SECRET',
        'MONGODB_URI'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('Missing required environment variables:', missing.join(', '));
        console.error('Please check your .env file and ensure all required variables are set.');

        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

/**
 * Environment configuration with defaults
 */
export const config = {
    // Server
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT) || 5001,
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

    // Database
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/academic-vault',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'fallback-jwt-secret-for-development',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '15m',

    // Encryption
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET || 'fallback-encryption-secret-32chars',

    // Email
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'support@academicvault.com',

    // Security
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

    // Feature flags
    ENABLE_2FA: process.env.ENABLE_2FA !== 'false',
    ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION !== 'false',
    ENABLE_PASSWORD_RESET: process.env.ENABLE_PASSWORD_RESET !== 'false',
    ENABLE_SECURITY_MONITORING: process.env.ENABLE_SECURITY_MONITORING !== 'false',

    // Development
    DISABLE_EMAIL_SENDING: process.env.DISABLE_EMAIL_SENDING === 'true',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Validate environment in production
if (config.NODE_ENV === 'production') {
    validateEnvironment();
}

export default config;