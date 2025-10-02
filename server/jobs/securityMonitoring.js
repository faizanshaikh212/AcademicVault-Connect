/**
 * Security Monitoring Jobs
 * Scheduled tasks for security monitoring and alerting
 */

import cron from 'node-cron';
import logger from '../utils/logger.js';
import { generateSecurityMetrics, logSecurityEvent, SecurityEvents } from '../utils/securityLogger.js';

/**
 * Monitor for suspicious login patterns
 */
const monitorSuspiciousLogins = async () => {
    try {
        const User = (await import('../models/user.model.js')).default;
        const Session = (await import('../models/session.model.js')).default;

        const now = new Date();
        const last1Hour = new Date(now.getTime() - 60 * 60 * 1000);

        // Find users with multiple failed login attempts in the last hour
        const suspiciousUsers = await User.find({
            failedLoginAttempts: { $gte: 3 },
            updatedAt: { $gte: last1Hour }
        }).select('_id email failedLoginAttempts lockUntil');

        for (const user of suspiciousUsers) {
            logSecurityEvent(SecurityEvents.BRUTE_FORCE_ATTEMPT, {
                userId: user._id,
                email: user.email,
                failedAttempts: user.failedLoginAttempts,
                isLocked: user.lockUntil && user.lockUntil > now,
                detectedAt: now.toISOString()
            });
        }

        if (suspiciousUsers.length > 0) {
            logger.warn('Suspicious login activity detected', {
                suspiciousUserCount: suspiciousUsers.length,
                users: suspiciousUsers.map(u => ({ id: u._id, email: u.email, attempts: u.failedLoginAttempts }))
            });
        }

    } catch (error) {
        logger.error('Error monitoring suspicious logins', { error: error.message });
    }
};

/**
 * Monitor for unusual session patterns
 */
const monitorSessionPatterns = async () => {
    try {
        const Session = (await import('../models/session.model.js')).default;

        const now = new Date();
        const last1Hour = new Date(now.getTime() - 60 * 60 * 1000);

        // Find users with multiple sessions from different locations
        const suspiciousSessions = await Session.aggregate([
            {
                $match: {
                    createdAt: { $gte: last1Hour },
                    revoked: false
                }
            },
            {
                $group: {
                    _id: '$user',
                    sessions: { $push: '$$ROOT' },
                    uniqueCountries: { $addToSet: '$deviceInfo.location.country' },
                    uniqueIPs: { $addToSet: '$deviceInfo.ip' }
                }
            },
            {
                $match: {
                    $or: [
                        { 'uniqueCountries.1': { $exists: true } }, // More than 1 country
                        { 'uniqueIPs.4': { $exists: true } } // More than 4 IPs
                    ]
                }
            }
        ]);

        for (const userSessions of suspiciousSessions) {
            logSecurityEvent(SecurityEvents.SUSPICIOUS_ACTIVITY, {
                userId: userSessions._id,
                sessionCount: userSessions.sessions.length,
                uniqueCountries: userSessions.uniqueCountries.length,
                uniqueIPs: userSessions.uniqueIPs.length,
                countries: userSessions.uniqueCountries,
                detectedAt: now.toISOString()
            });
        }

        if (suspiciousSessions.length > 0) {
            logger.warn('Suspicious session patterns detected', {
                suspiciousUserCount: suspiciousSessions.length
            });
        }

    } catch (error) {
        logger.error('Error monitoring session patterns', { error: error.message });
    }
};

/**
 * Generate and log security metrics
 */
const generateMetricsReport = async () => {
    try {
        const metrics = await generateSecurityMetrics();

        if (metrics) {
            // Check for concerning metrics
            const concerns = [];

            if (metrics.users.locked > 10) {
                concerns.push(`High number of locked accounts: ${metrics.users.locked}`);
            }

            if (metrics.users.newLast24h > 100) {
                concerns.push(`Unusually high registration rate: ${metrics.users.newLast24h} in 24h`);
            }

            const twoFAAdoptionRate = (metrics.users.with2FA / metrics.users.total) * 100;
            if (twoFAAdoptionRate < 20) {
                concerns.push(`Low 2FA adoption rate: ${twoFAAdoptionRate.toFixed(1)}%`);
            }

            if (concerns.length > 0) {
                logger.warn('Security concerns detected', { concerns, metrics });
            }
        }

    } catch (error) {
        logger.error('Error generating metrics report', { error: error.message });
    }
};

/**
 * Clean up old security logs (if using file-based logging)
 */
const cleanupOldLogs = async () => {
    try {
        // This would depend on your logging setup
        // For file-based logs, you might want to archive or delete old files
        // For database logs, you might want to remove entries older than X days

        logger.info('Security log cleanup completed');

    } catch (error) {
        logger.error('Error cleaning up old logs', { error: error.message });
    }
};

/**
 * Monitor for token abuse
 */
const monitorTokenAbuse = async () => {
    try {
        const VerificationToken = (await import('../models/verificationToken.model.js')).default;

        const now = new Date();
        const last1Hour = new Date(now.getTime() - 60 * 60 * 1000);

        // Find users with multiple token requests in short time
        const tokenAbuse = await VerificationToken.aggregate([
            {
                $match: {
                    createdAt: { $gte: last1Hour }
                }
            },
            {
                $group: {
                    _id: { user: '$user', type: '$type' },
                    count: { $sum: 1 },
                    tokens: { $push: '$$ROOT' }
                }
            },
            {
                $match: {
                    count: { $gte: 5 } // 5 or more tokens in 1 hour
                }
            }
        ]);

        for (const abuse of tokenAbuse) {
            logSecurityEvent(SecurityEvents.SUSPICIOUS_ACTIVITY, {
                userId: abuse._id.user,
                tokenType: abuse._id.type,
                tokenCount: abuse.count,
                timeframe: '1 hour',
                detectedAt: now.toISOString()
            });
        }

        if (tokenAbuse.length > 0) {
            logger.warn('Token abuse detected', {
                abuseCount: tokenAbuse.length,
                details: tokenAbuse.map(a => ({
                    userId: a._id.user,
                    type: a._id.type,
                    count: a.count
                }))
            });
        }

    } catch (error) {
        logger.error('Error monitoring token abuse', { error: error.message });
    }
};

// Schedule monitoring jobs
// Run every 15 minutes
cron.schedule('*/15 * * * *', monitorSuspiciousLogins);
cron.schedule('*/15 * * * *', monitorSessionPatterns);
cron.schedule('*/15 * * * *', monitorTokenAbuse);

// Run every hour
cron.schedule('0 * * * *', generateMetricsReport);

// Run daily at 2 AM
cron.schedule('0 2 * * *', cleanupOldLogs);

logger.info('Security monitoring jobs scheduled');

export {
    monitorSuspiciousLogins,
    monitorSessionPatterns,
    generateMetricsReport,
    cleanupOldLogs,
    monitorTokenAbuse
};