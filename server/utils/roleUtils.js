/**
 * Role Validation Utilities
 * Centralized role checking logic with precedence handling
 * @module utils/roleUtils
 */

/**
 * Role precedence order (highest to lowest)
 */
const ROLE_PRECEDENCE = {
    admin: 3,
    teacher: 2,
    student: 1
};

/**
 * Check if user has a specific role
 * @param {string[]} userRoles - Array of user roles
 * @param {string} requiredRole - Required role to check
 * @returns {boolean} True if user has the required role
 */
export const hasRole = (userRoles, requiredRole) => {
    if (!Array.isArray(userRoles)) {
        return false;
    }
    return userRoles.includes(requiredRole);
};

/**
 * Check if user has any of the specified roles
 * @param {string[]} userRoles - Array of user roles
 * @param {string[]} requiredRoles - Array of required roles
 * @returns {boolean} True if user has any of the required roles
 */
export const hasAnyRole = (userRoles, requiredRoles) => {
    if (!Array.isArray(userRoles) || !Array.isArray(requiredRoles)) {
        return false;
    }
    return requiredRoles.some(role => userRoles.includes(role));
};

/**
 * Get the highest precedence role from user's roles
 * @param {string[]} userRoles - Array of user roles
 * @returns {string|null} Highest precedence role or null if no valid roles
 */
export const getHighestRole = (userRoles) => {
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
        return null;
    }

    let highestRole = null;
    let highestPrecedence = 0;

    for (const role of userRoles) {
        const precedence = ROLE_PRECEDENCE[role] || 0;
        if (precedence > highestPrecedence) {
            highestPrecedence = precedence;
            highestRole = role;
        }
    }

    return highestRole;
};

/**
 * Check if user should use teacher privileges (has teacher or admin role)
 * @param {string[]} userRoles - Array of user roles
 * @returns {boolean} True if user has teacher or admin privileges
 */
export const shouldUseTeacherPrivileges = (userRoles) => {
    return hasAnyRole(userRoles, ['teacher', 'admin']);
};

/**
 * Check if user should use admin privileges (has admin role)
 * @param {string[]} userRoles - Array of user roles
 * @returns {boolean} True if user has admin privileges
 */
export const shouldUseAdminPrivileges = (userRoles) => {
    return hasRole(userRoles, 'admin');
};

/**
 * Get academic note upload defaults based on user roles
 * @param {string[]} userRoles - Array of user roles
 * @returns {Object} Default values for academic note uploads
 */
export const getAcademicNoteDefaults = (userRoles) => {
    if (shouldUseTeacherPrivileges(userRoles)) {
        return {
            status: "Approved",
            type: "Official",
            isAdminUploaded: shouldUseAdminPrivileges(userRoles),
            isApproved: true
        };
    }

    return {
        status: "In for Review",
        type: "Unofficial",
        isAdminUploaded: false,
        isApproved: false
    };
};

/**
 * Log role check for debugging
 * @param {string} userId - User ID
 * @param {string[]} userRoles - User roles
 * @param {string} requiredRole - Required role being checked
 * @param {boolean} hasAccess - Whether access was granted
 * @param {string} context - Context of the check (e.g., endpoint, component)
 */
export const logRoleCheck = (userId, userRoles, requiredRole, hasAccess, context) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[ROLE CHECK] ${context}:`, {
            userId,
            userRoles,
            requiredRole,
            hasAccess,
            highestRole: getHighestRole(userRoles),
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Validate role array format
 * @param {any} roles - Roles to validate
 * @returns {boolean} True if roles is a valid array of role strings
 */
export const isValidRoleArray = (roles) => {
    if (!Array.isArray(roles)) {
        return false;
    }

    const validRoles = ['student', 'teacher', 'admin'];
    return roles.every(role => validRoles.includes(role));
};