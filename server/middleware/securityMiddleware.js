/**
 * Security Middleware
 * Enhanced security middleware for authentication endpoints
 */

import rateLimit from 'express-rate-limit';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';

/**
 * Enhanced rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        message: "Too many authentication attempts, please try again later.",
        retryAfter: 15 * 60 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded for authentication', {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.path
        });
        res.status(429).json({
            message: "Too many authentication attempts, please try again later.",
            retryAfter: 15 * 60
        });
    }
});

/**
 * Strict rate limiter for sensitive operations
 */
export const strictAuthLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 requests per hour
    message: {
        message: "Too many attempts for this operation, please try again later.",
        retryAfter: 60 * 60 // 1 hour in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Strict rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.path
        });
        res.status(429).json({
            message: "Too many attempts for this operation, please try again later.",
            retryAfter: 60 * 60
        });
    }
});

/**
 * Email rate limiter to prevent spam
 */
export const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 email requests per hour
    message: {
        message: "Too many email requests, please try again later.",
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Email rate limit exceeded', {
            ip: req.ip,
            email: req.body.email,
            userAgent: req.get('user-agent'),
            endpoint: req.path
        });
        res.status(429).json({
            message: "Too many email requests, please try again later.",
            retryAfter: 60 * 60
        });
    }
});

/**
 * 2FA rate limiter to prevent brute force
 */
export const twoFALimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 2FA attempts per 15 minutes
    message: {
        message: "Too many 2FA attempts, please try again later.",
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('2FA rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.path
        });
        res.status(429).json({
            message: "Too many 2FA attempts, please try again later.",
            retryAfter: 15 * 60
        });
    }
});

/**
 * Account lockout middleware
 */
export const checkAccountLockout = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return next();
        }

        const user = await User.findOne({ email });

        if (user && user.isLocked) {
            logger.warn('Attempt to access locked account', {
                userId: user._id,
                email: user.email,
                ip: req.ip,
                lockUntil: user.lockUntil
            });

            return res.status(423).json({
                message: "Account is temporarily locked due to too many failed login attempts. Please try again later or reset your password.",
                locked: true,
                retryAfter: Math.ceil((user.lockUntil - Date.now()) / 1000)
            });
        }

        next();
    } catch (error) {
        logger.error('Error checking account lockout', { error: error.message });
        next();
    }
};

/**
 * Security event logger middleware
 */
export const logSecurityEvent = (eventType) => {
    return (req, res, next) => {
        const originalSend = res.send;

        res.send = function (data) {
            // Log security events
            const statusCode = res.statusCode;
            const isSuccess = statusCode >= 200 && statusCode < 300;

            logger.info('Security event', {
                event: eventType,
                success: isSuccess,
                statusCode,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                endpoint: req.path,
                method: req.method,
                userId: req.user?._id,
                email: req.body?.email
            });

            originalSend.call(this, data);
        };

        next();
    };
};

/**
 * Step-up authentication middleware
 * Requires recent authentication for sensitive operations
 */
export const requireRecentAuth = (maxAge = 30 * 60 * 1000) => { // 30 minutes default
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Authentication required" });
            }

            // Check if user has recently authenticated by looking at their current session
            const Session = (await import('../models/session.model.js')).default;
            const currentSession = await Session.findOne({
                user: req.user._id,
                revoked: false,
                isCurrent: true,
                expiresAt: { $gt: new Date() }
            }).sort({ lastUsedAt: -1 });

            if (!currentSession) {
                return res.status(403).json({
                    message: "No active session found. Please log in again.",
                    requiresReauth: true
                });
            }

            // Check if the session is recent enough
            const timeSinceAuth = Date.now() - currentSession.createdAt.getTime();

            if (timeSinceAuth > maxAge) {
                return res.status(403).json({
                    message: "Recent authentication required for this operation. Please log in again.",
                    requiresReauth: true,
                    maxAgeMinutes: Math.floor(maxAge / (60 * 1000))
                });
            }

            next();
        } catch (error) {
            logger.error('Error in step-up authentication', { error: error.message });
            res.status(500).json({ message: "Server error" });
        }
    };
};

/**
 * CSRF protection for authentication endpoints
 */
export const csrfProtection = (req, res, next) => {
    // Skip CSRF for GET requests
    if (req.method === 'GET') {
        return next();
    }

    // Check for custom header (AJAX requests)
    const customHeader = req.get('X-Requested-With');
    if (customHeader === 'XMLHttpRequest') {
        return next();
    }

    // Check for CSRF token in header
    const csrfToken = req.get('X-CSRF-Token');
    if (!csrfToken) {
        logger.warn('Missing CSRF token', {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.path
        });

        return res.status(403).json({
            message: "CSRF token required",
            code: "CSRF_TOKEN_MISSING"
        });
    }

    // In a real implementation, you would validate the CSRF token here
    // For now, we just check that it exists
    next();
};

/**
 * Suspicious activity detector
 */
export const detectSuspiciousActivity = async (req, res, next) => {
    try {
        if (!req.user) {
            return next();
        }

        const sessionService = (await import('../services/sessionService.js')).default;
        const suspiciousActivity = await sessionService.detectSuspiciousActivity(req.user._id, req);

        if (suspiciousActivity.isSuspicious) {
            logger.warn('Suspicious activity detected', {
                userId: req.user._id,
                factors: suspiciousActivity.factors,
                deviceInfo: suspiciousActivity.deviceInfo,
                ip: req.ip
            });

            // Send security alert email
            const emailService = (await import('../services/emailService.js')).default;
            const user = await User.findById(req.user._id);

            const eventDescription = `Login from ${suspiciousActivity.deviceInfo.name} in ${suspiciousActivity.deviceInfo.location?.country || 'Unknown Location'}`;
            await emailService.sendSecurityAlert(user, eventDescription);
        }

        next();
    } catch (error) {
        logger.error('Error detecting suspicious activity', { error: error.message });
        next();
    }
};