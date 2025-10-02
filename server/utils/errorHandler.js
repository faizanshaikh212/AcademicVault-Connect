/**
 * Error Handler Utilities
 * Standardized error handling for authentication system
 */

import logger from './logger.js';

/**
 * Standard error response format
 */
export class AuthError extends Error {
    constructor(message, statusCode = 500, code = null, details = null) {
        super(message);
        this.name = 'AuthError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

/**
 * Predefined error types
 */
export const ErrorTypes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
    AUTHORIZATION_FAILED: 'AUTHORIZATION_FAILED',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    TWO_FA_REQUIRED: 'TWO_FA_REQUIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    EXPIRED_TOKEN: 'EXPIRED_TOKEN',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVER_ERROR: 'SERVER_ERROR'
};

/**
 * Create standardized error responses
 */
export const createErrorResponse = (error, req = null) => {
    const response = {
        success: false,
        message: error.message || 'An error occurred',
        timestamp: new Date().toISOString()
    };

    // Add error code if available
    if (error.code) {
        response.code = error.code;
    }

    // Add details for validation errors
    if (error.details) {
        response.details = error.details;
    }

    // Add request ID for tracking (if available)
    if (req?.id) {
        response.requestId = req.id;
    }

    return response;
};

/**
 * Log security-related errors
 */
export const logSecurityError = (error, req, additionalInfo = {}) => {
    const logData = {
        error: error.message,
        statusCode: error.statusCode,
        code: error.code,
        ip: req?.ip,
        userAgent: req?.get('user-agent'),
        endpoint: req?.path,
        method: req?.method,
        userId: req?.user?._id,
        ...additionalInfo
    };

    if (error.statusCode >= 500) {
        logger.error('Authentication system error', logData);
    } else if (error.statusCode === 429) {
        logger.warn('Rate limit exceeded', logData);
    } else if (error.statusCode >= 400) {
        logger.warn('Authentication error', logData);
    }
};

/**
 * Handle different types of authentication errors
 */
export const handleAuthError = (error, req, res, next) => {
    // Log the error
    logSecurityError(error, req);

    // Determine status code
    let statusCode = error.statusCode || 500;

    // Handle specific error types
    if (error.name === 'ValidationError') {
        statusCode = 400;
        error.code = ErrorTypes.VALIDATION_ERROR;
    } else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        error.code = ErrorTypes.INVALID_TOKEN;
        error.message = 'Invalid authentication token';
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        error.code = ErrorTypes.EXPIRED_TOKEN;
        error.message = 'Authentication token has expired';
    } else if (error.name === 'MongoError' && error.code === 11000) {
        statusCode = 400;
        error.code = ErrorTypes.VALIDATION_ERROR;
        error.message = 'Email or username already exists';
    }

    // Create standardized response
    const errorResponse = createErrorResponse(error, req);

    // Send response
    res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Common authentication error creators
 */
export const AuthErrors = {
    invalidCredentials: () => new AuthError(
        'Invalid email or password',
        401,
        ErrorTypes.AUTHENTICATION_FAILED
    ),

    accountLocked: (lockUntil) => new AuthError(
        'Account is temporarily locked due to too many failed login attempts',
        423,
        ErrorTypes.ACCOUNT_LOCKED,
        { lockUntil }
    ),

    emailNotVerified: (email) => new AuthError(
        'Please verify your email address before logging in',
        401,
        ErrorTypes.EMAIL_NOT_VERIFIED,
        { email, requiresVerification: true }
    ),

    twoFARequired: (email) => new AuthError(
        '2FA verification required',
        200,
        ErrorTypes.TWO_FA_REQUIRED,
        { email, requires2FA: true }
    ),

    invalidToken: (tokenType = 'token') => new AuthError(
        `Invalid or expired ${tokenType}`,
        400,
        ErrorTypes.INVALID_TOKEN
    ),

    unauthorized: () => new AuthError(
        'Access denied. Authentication required',
        401,
        ErrorTypes.AUTHORIZATION_FAILED
    ),

    forbidden: () => new AuthError(
        'Access denied. Insufficient permissions',
        403,
        ErrorTypes.AUTHORIZATION_FAILED
    ),

    rateLimitExceeded: (retryAfter) => new AuthError(
        'Too many requests. Please try again later',
        429,
        ErrorTypes.RATE_LIMIT_EXCEEDED,
        { retryAfter }
    ),

    serverError: (message = 'Internal server error') => new AuthError(
        message,
        500,
        ErrorTypes.SERVER_ERROR
    )
};

/**
 * Validation error formatter
 */
export const formatValidationErrors = (errors) => {
    return errors.map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
    }));
};