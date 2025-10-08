/**
 * Validation Middleware
 * Input validation for authentication endpoints
 */

import { body, param, validationResult } from 'express-validator';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

/**
 * Registration validation rules
 */
export const validateRegistration = [
    body('firstName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),

    body('lastName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),

    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
        .toLowerCase(),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email address is too long'),

    body('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    handleValidationErrors
];

/**
 * Login validation rules
 */
export const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

/**
 * Email validation rules
 */
export const validateEmail = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    handleValidationErrors
];

/**
 * Password reset validation rules
 */
export const validatePasswordReset = [
    param('token')
        .isLength({ min: 1 })
        .withMessage('Reset token is required'),

    body('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    handleValidationErrors
];

/**
 * 2FA token validation rules
 */
export const validate2FAToken = [
    body('token')
        .optional()
        .isLength({ min: 6, max: 6 })
        .withMessage('2FA token must be 6 digits')
        .isNumeric()
        .withMessage('2FA token must contain only numbers'),

    body('backupCode')
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage('Backup code is invalid')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Backup code can only contain uppercase letters and numbers'),

    handleValidationErrors
];

/**
 * 2FA login validation rules
 */
export const validate2FALogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    body('token')
        .optional({ checkFalsy: true })
        .isLength({ min: 6, max: 6 })
        .withMessage('2FA token must be 6 digits')
        .isNumeric()
        .withMessage('2FA token must contain only numbers'),

    body('backupCode')
        .optional({ checkFalsy: true })
        .isLength({ min: 1, max: 20 })
        .withMessage('Backup code is invalid')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Backup code can only contain uppercase letters and numbers'),

    // Custom validation to ensure either token or backupCode is provided
    body().custom((value, { req }) => {
        const token = req.body.token?.trim();
        const backupCode = req.body.backupCode?.trim();

        if (!token && !backupCode) {
            throw new Error('Either 2FA token or backup code is required');
        }
        return true;
    }),

    handleValidationErrors
];

/**
 * Password verification validation rules
 */
export const validatePasswordVerification = [
    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

/**
 * 2FA disable validation rules
 */
export const validate2FADisable = [
    body('password')
        .notEmpty()
        .withMessage('Current password is required'),

    body('token')
        .optional()
        .isLength({ min: 6, max: 6 })
        .withMessage('2FA token must be 6 digits')
        .isNumeric()
        .withMessage('2FA token must contain only numbers'),

    body('backupCode')
        .optional()
        .isLength({ min: 8, max: 8 })
        .withMessage('Backup code must be 8 characters')
        .matches(/^[A-F0-9]+$/)
        .withMessage('Backup code must contain only uppercase letters and numbers'),

    handleValidationErrors
];

/**
 * Token parameter validation
 */
export const validateTokenParam = [
    param('token')
        .isLength({ min: 1 })
        .withMessage('Token is required')
        .matches(/^[a-fA-F0-9]+$/)
        .withMessage('Invalid token format'),

    handleValidationErrors
];

/**
 * Session ID validation
 */
export const validateSessionId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid session ID'),

    handleValidationErrors
];