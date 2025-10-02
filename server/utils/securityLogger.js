/**
 * Security Logger
 * Specialized logging for security events and monitoring
 */

import logger from './logger.js';

/**
 * Security event types
 */
export const SecurityEvents = {
    // Authentication events
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILED: 'login_failed',
    LOGOUT: 'logout',
    REGISTRATION: 'registration',

    // Password events
    PASSWORD_RESET_REQUEST: 'password_reset_request',
    PASSWORD_RESET_SUCCESS: 'password_reset_success',
    PASSWORD_CHANGE: 'password_change',

    // Email verification events
    EMAIL_VERIFICATION_SENT: 'email_verification_sent',
    EMAIL_VERIFIED: 'email_verified',

    // 2FA events
    TWO_FA_SETUP: '2fa_setup',
    TWO_FA_ENABLED: '2fa_enabled',
    TWO_FA_DISABLED: '2fa_disabled',
    TWO_FA_LOGIN_SUCCESS: '2fa_login_success',
    TWO_FA_LOGIN_FAILED: '2fa_login_failed',

    // Session events
    SESSION_CREATED: 'session_created',
    SESSION_REVOKED: 'session_revoked',
    ALL_SESSIONS_REVOKED: 'all_sessions_revoked',

    // Security violations
    ACCOUNT_LOCKED: 'account_locked',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    INVALID_TOKEN_ATTEMPT: 'invalid_token_attempt',
    BRUTE_FORCE_ATTEMPT: 'brute_force_attempt',

    // System events
    SECURITY_CONFIG_CHANGE: 'security_config_change',
    ADMIN_ACTION: 'admin_action'
};

/**
 * Log security event with standardized format
 */
export const logSecurityEvent = (eventType, data = {}) => {
    const securityLog = {
        event: eventType,
        timestamp: new Date().toISOString(),
        severity: getSeverityLevel(eventType),
        ...data
    };

    // Use appropriate log level based on severity
    switch (securityLog.severity) {
        case 'critical':
            logger.error('Security Event', securityLog);
            break;
        case 'high':
            logger.warn('Security Event', securityLog);
            break;
        case 'medium':
            logger.info('Security Event', securityLog);
            break;
        case 'low':
        default:
            logger.debug('Security Event', securityLog);
            break;
    }

    // Send alerts for critical events
    if (securityLog.severity === 'critical') {
        sendSecurityAlert(securityLog);
    }
};

/**
 * Determine severity level for security events
 */
const getSeverityLevel = (eventType) => {
    const severityMap = {
        // Critical events
        [SecurityEvents.BRUTE_FORCE_ATTEMPT]: 'critical',
        [SecurityEvents.ACCOUNT_LOCKED]: 'critical',
        [SecurityEvents.SUSPICIOUS_ACTIVITY]: 'critical',

        // High severity events
        [SecurityEvents.LOGIN_FAILED]: 'high',
        [SecurityEvents.TWO_FA_LOGIN_FAILED]: 'high',
        [SecurityEvents.INVALID_TOKEN_ATTEMPT]: 'high',
        [SecurityEvents.RATE_LIMIT_EXCEEDED]: 'high',

        // Medium severity events
        [SecurityEvents.LOGIN_SUCCESS]: 'medium',
        [SecurityEvents.PASSWORD_RESET_REQUEST]: 'medium',
        [SecurityEvents.TWO_FA_DISABLED]: 'medium',
        [SecurityEvents.ALL_SESSIONS_REVOKED]: 'medium',

        // Low severity events
        [SecurityEvents.REGISTRATION]: 'low',
        [SecurityEvents.EMAIL_VERIFIED]: 'low',
        [SecurityEvents.SESSION_CREATED]: 'low',
        [SecurityEvents.LOGOUT]: 'low'
    };

    return severityMap[eventType] || 'low';
};

/**
 * Send security alerts for critical events
 */
const sendSecurityAlert = async (securityLog) => {
    try {
        // In a production environment, you would integrate with:
        // - Email alerts
        // - Slack/Discord webhooks
        // - SMS notifications
        // - Security monitoring tools (Datadog, New Relic, etc.)

        logger.error('SECURITY ALERT', {
            alert: true,
            ...securityLog
        });

        // Example: Send email alert (uncomment in production)
        // const emailService = (await import('../services/emailService.js')).default;
        // await emailService.sendSecurityAlert(adminEmail, securityLog);

    } catch (error) {
        logger.error('Failed to send security alert', { error: error.message });
    }
};

/**
 * Log authentication attempt
 */
export const logAuthAttempt = (req, user, success, reason = null) => {
    const eventType = success ? SecurityEvents.LOGIN_SUCCESS : SecurityEvents.LOGIN_FAILED;

    logSecurityEvent(eventType, {
        userId: user?._id,
        email: user?.email || req.body?.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        reason,
        timestamp: new Date().toISOString()
    });
};

/**
 * Log 2FA attempt
 */
export const log2FAAttempt = (req, user, success, method = 'totp') => {
    const eventType = success ? SecurityEvents.TWO_FA_LOGIN_SUCCESS : SecurityEvents.TWO_FA_LOGIN_FAILED;

    logSecurityEvent(eventType, {
        userId: user._id,
        email: user.email,
        method, // 'totp' or 'backup_code'
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
    });
};

/**
 * Log suspicious activity
 */
export const logSuspiciousActivity = (req, user, factors, deviceInfo) => {
    logSecurityEvent(SecurityEvents.SUSPICIOUS_ACTIVITY, {
        userId: user._id,
        email: user.email,
        suspiciousFactors: factors,
        deviceInfo,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
    });
};

/**
 * Log account lockout
 */
export const logAccountLockout = (user, reason, lockUntil) => {
    logSecurityEvent(SecurityEvents.ACCOUNT_LOCKED, {
        userId: user._id,
        email: user.email,
        reason,
        lockUntil,
        timestamp: new Date().toISOString()
    });
};

/**
 * Log password events
 */
export const logPasswordEvent = (eventType, user, req = null) => {
    logSecurityEvent(eventType, {
        userId: user._id,
        email: user.email,
        ip: req?.ip,
        userAgent: req?.get('user-agent'),
        timestamp: new Date().toISOString()
    });
};

/**
 * Log session events
 */
export const logSessionEvent = (eventType, user, sessionInfo = {}, req = null) => {
    logSecurityEvent(eventType, {
        userId: user._id,
        email: user.email,
        sessionId: sessionInfo.sessionId,
        deviceInfo: sessionInfo.deviceInfo,
        ip: req?.ip,
        userAgent: req?.get('user-agent'),
        timestamp: new Date().toISOString()
    });
};

/**
 * Log rate limiting events
 */
export const logRateLimit = (req, endpoint, limit) => {
    logSecurityEvent(SecurityEvents.RATE_LIMIT_EXCEEDED, {
        ip: req.ip,
        endpoint,
        limit,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
    });
};

/**
 * Generate security metrics for monitoring
 */
export const generateSecurityMetrics = async () => {
    try {
        const User = (await import('../models/user.model.js')).default;
        const Session = (await import('../models/session.model.js')).default;

        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const metrics = {
            timestamp: now.toISOString(),
            users: {
                total: await User.countDocuments(),
                verified: await User.countDocuments({ isEmailVerified: true }),
                with2FA: await User.countDocuments({ twoFactorEnabled: true }),
                locked: await User.countDocuments({ lockUntil: { $gt: now } }),
                newLast24h: await User.countDocuments({ createdAt: { $gte: last24Hours } }),
                newLast7d: await User.countDocuments({ createdAt: { $gte: last7Days } })
            },
            sessions: {
                active: await Session.countDocuments({
                    revoked: false,
                    expiresAt: { $gt: now }
                }),
                totalLast24h: await Session.countDocuments({ createdAt: { $gte: last24Hours } }),
                revokedLast24h: await Session.countDocuments({
                    revoked: true,
                    updatedAt: { $gte: last24Hours }
                })
            }
        };

        logger.info('Security Metrics', metrics);
        return metrics;
    } catch (error) {
        logger.error('Failed to generate security metrics', { error: error.message });
        return null;
    }
};

export default {
    logSecurityEvent,
    logAuthAttempt,
    log2FAAttempt,
    logSuspiciousActivity,
    logAccountLockout,
    logPasswordEvent,
    logSessionEvent,
    logRateLimit,
    generateSecurityMetrics,
    SecurityEvents
};