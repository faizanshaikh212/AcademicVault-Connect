/**
 * Security Cleanup Jobs
 * Scheduled tasks for maintaining security-related data
 */

import cron from 'node-cron';
import logger from '../utils/logger.js';

/**
 * Clean up expired sessions
 */
const cleanupExpiredSessions = async () => {
    try {
        const sessionService = (await import('../services/sessionService.js')).default;
        const deletedCount = await sessionService.cleanupExpiredSessions();

        if (deletedCount > 0) {
            logger.info('Cleaned up expired sessions', { deletedCount });
        }
    } catch (error) {
        logger.error('Error cleaning up expired sessions', { error: error.message });
    }
};

/**
 * Clean up expired verification tokens
 */
const cleanupExpiredTokens = async () => {
    try {
        const { cleanupExpiredTokens } = await import('../utils/emailVerification.js');
        await cleanupExpiredTokens();
        logger.info('Cleaned up expired verification tokens');
    } catch (error) {
        logger.error('Error cleaning up expired tokens', { error: error.message });
    }
};

/**
 * Unlock accounts that have passed their lock time
 */
const unlockAccounts = async () => {
    try {
        const User = (await import('../models/user.model.js')).default;

        const result = await User.updateMany(
            {
                lockUntil: { $exists: true, $lt: new Date() },
                failedLoginAttempts: { $gt: 0 }
            },
            {
                $unset: { lockUntil: 1 },
                $set: { failedLoginAttempts: 0 }
            }
        );

        if (result.modifiedCount > 0) {
            logger.info('Unlocked accounts', { unlockedCount: result.modifiedCount });
        }
    } catch (error) {
        logger.error('Error unlocking accounts', { error: error.message });
    }
};

// Schedule cleanup jobs
// Run every hour
cron.schedule('0 * * * *', cleanupExpiredSessions);
cron.schedule('0 * * * *', cleanupExpiredTokens);

// Run every 15 minutes
cron.schedule('*/15 * * * *', unlockAccounts);

logger.info('Security cleanup jobs scheduled');

export {
    cleanupExpiredSessions,
    cleanupExpiredTokens,
    unlockAccounts
};