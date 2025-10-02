/**
 * Enhanced Session Service
 * Handles session management with device fingerprinting and geolocation
 */

import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';
import Session from '../models/session.model.js';

class SessionService {
    /**
     * Create session with enhanced device information
     * @param {Object} user - User object
     * @param {Object} req - Express request object
     * @param {string} tokenId - Session token ID
     * @param {string} refreshTokenHash - Hashed refresh token
     * @param {Date} expiresAt - Session expiration date
     * @param {string} loginMethod - Login method (password, password_2fa)
     * @returns {Object} - Created session
     */
    async createSessionWithDeviceInfo(user, req, tokenId, refreshTokenHash, expiresAt, loginMethod = 'password') {
        const deviceInfo = this.extractDeviceInfo(req);

        // Mark all other sessions as not current
        await Session.updateMany(
            { user: user._id },
            { $set: { isCurrent: false } }
        );

        const session = await Session.create({
            user: user._id,
            tokenId,
            refreshTokenHash,
            deviceInfo,
            expiresAt,
            loginMethod,
            isCurrent: true
        });

        return session;
    }

    /**
     * Extract device information from request
     * @param {Object} req - Express request object
     * @returns {Object} - Device information
     */
    extractDeviceInfo(req) {
        const ua = req.get('user-agent') || '';
        const parser = new UAParser(ua);
        const result = parser.getResult();

        // Get IP address (handle proxy headers)
        const ip = req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            (req.connection.socket ? req.connection.socket.remoteAddress : null);

        // Get location from IP
        const geo = geoip.lookup(ip);

        return {
            ip,
            ua,
            name: this.generateDeviceName(result),
            browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
            os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
            location: geo ? {
                country: geo.country,
                city: geo.city,
                region: geo.region
            } : {
                country: 'Unknown',
                city: 'Unknown',
                region: 'Unknown'
            }
        };
    }

    /**
     * Generate human-readable device name
     * @param {Object} uaResult - UA parser result
     * @returns {string} - Device name
     */
    generateDeviceName(uaResult) {
        const browser = uaResult.browser.name || 'Unknown Browser';
        const os = uaResult.os.name || 'Unknown OS';
        const device = uaResult.device.type || 'desktop';

        if (device === 'mobile') {
            return `${browser} on Mobile (${os})`;
        } else if (device === 'tablet') {
            return `${browser} on Tablet (${os})`;
        } else {
            return `${browser} on ${os}`;
        }
    }

    /**
     * Get sessions with enhanced details
     * @param {string} userId - User ID
     * @returns {Array} - Array of sessions with details
     */
    async getSessionsWithDetails(userId) {
        const sessions = await Session.find({
            user: userId,
            revoked: false,
            expiresAt: { $gt: new Date() }
        }).select(
            '_id tokenId deviceInfo createdAt lastUsedAt expiresAt isCurrent loginMethod'
        ).sort({ lastUsedAt: -1 });

        return sessions.map(session => ({
            _id: session._id,
            deviceName: session.deviceInfo.name,
            browser: session.deviceInfo.browser,
            os: session.deviceInfo.os,
            location: this.formatLocation(session.deviceInfo.location),
            ip: session.deviceInfo.ip,
            createdAt: session.createdAt,
            lastUsedAt: session.lastUsedAt,
            expiresAt: session.expiresAt,
            isCurrent: session.isCurrent,
            loginMethod: session.loginMethod,
            isSecure: session.loginMethod === 'password_2fa'
        }));
    }

    /**
     * Format location for display
     * @param {Object} location - Location object
     * @returns {string} - Formatted location string
     */
    formatLocation(location) {
        if (!location || location.country === 'Unknown') {
            return 'Unknown Location';
        }

        const parts = [];
        if (location.city && location.city !== 'Unknown') {
            parts.push(location.city);
        }
        if (location.region && location.region !== 'Unknown') {
            parts.push(location.region);
        }
        if (location.country && location.country !== 'Unknown') {
            parts.push(location.country);
        }

        return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
    }

    /**
     * Revoke session by ID
     * @param {string} userId - User ID
     * @param {string} sessionId - Session ID
     * @returns {boolean} - Success status
     */
    async revokeSessionById(userId, sessionId) {
        const session = await Session.findOne({
            _id: sessionId,
            user: userId
        });

        if (!session) {
            return false;
        }

        session.revoked = true;
        await session.save();

        return true;
    }

    /**
     * Revoke all sessions for user
     * @param {string} userId - User ID
     * @param {string} excludeSessionId - Session ID to exclude (current session)
     * @returns {number} - Number of sessions revoked
     */
    async revokeAllSessions(userId, excludeSessionId = null) {
        const query = { user: userId };
        if (excludeSessionId) {
            query._id = { $ne: excludeSessionId };
        }

        const result = await Session.updateMany(
            query,
            { $set: { revoked: true } }
        );

        return result.modifiedCount;
    }

    /**
     * Detect suspicious activity
     * @param {string} userId - User ID
     * @param {Object} req - Express request object
     * @returns {Object} - Suspicious activity detection result
     */
    async detectSuspiciousActivity(userId, req) {
        const deviceInfo = this.extractDeviceInfo(req);

        // Get recent sessions (last 30 days)
        const recentSessions = await Session.find({
            user: userId,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).select('deviceInfo createdAt');

        const suspiciousFactors = [];

        // Check for new location
        const knownLocations = recentSessions.map(s => s.deviceInfo.location?.country).filter(Boolean);
        if (knownLocations.length > 0 && !knownLocations.includes(deviceInfo.location?.country)) {
            suspiciousFactors.push('new_location');
        }

        // Check for new device/browser
        const knownDevices = recentSessions.map(s => s.deviceInfo.name).filter(Boolean);
        if (knownDevices.length > 0 && !knownDevices.includes(deviceInfo.name)) {
            suspiciousFactors.push('new_device');
        }

        // Check for rapid location changes (within 1 hour)
        const lastSession = recentSessions[0];
        if (lastSession && lastSession.createdAt > new Date(Date.now() - 60 * 60 * 1000)) {
            const lastLocation = lastSession.deviceInfo.location;
            const currentLocation = deviceInfo.location;

            if (lastLocation?.country && currentLocation?.country &&
                lastLocation.country !== currentLocation.country) {
                suspiciousFactors.push('rapid_location_change');
            }
        }

        return {
            isSuspicious: suspiciousFactors.length > 0,
            factors: suspiciousFactors,
            deviceInfo
        };
    }

    /**
     * Update session last used time
     * @param {string} sessionId - Session ID
     */
    async updateLastUsed(sessionId) {
        await Session.findByIdAndUpdate(sessionId, {
            lastUsedAt: new Date()
        });
    }

    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        const result = await Session.deleteMany({
            expiresAt: { $lt: new Date() }
        });

        return result.deletedCount;
    }
}

export default new SessionService();