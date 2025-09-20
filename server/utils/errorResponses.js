/**
 * Standardized Error Response Utilities
 * Provides consistent error response formatting across the application
 * @module utils/errorResponses
 */

/**
 * Create a standardized error response for access control violations
 * @param {string} message - Human-readable error message
 * @param {string} error - Error code for programmatic handling
 * @param {string} requiredRole - Role that was required for access
 * @param {string[]} userRoles - User's current roles
 * @param {Object} debugInfo - Additional debug information (development only)
 * @returns {Object} Standardized error response object
 */
export const createAccessDeniedResponse = (
    message = "Access denied",
    error = "INSUFFICIENT_PERMISSIONS",
    requiredRole = null,
    userRoles = [],
    debugInfo = {}
) => {
    const response = {
        success: false,
        message,
        error,
        requiredRole,
        userRoles
    };

    // Add debug information in development mode
    if (process.env.NODE_ENV === 'development') {
        response.debug = {
            timestamp: new Date().toISOString(),
            ...debugInfo
        };
    }

    return response;
};

/**
 * Create a standardized error response for authentication failures
 * @param {string} message - Human-readable error message
 * @param {string} error - Error code for programmatic handling
 * @returns {Object} Standardized error response object
 */
export const createAuthenticationRequiredResponse = (
    message = "Authentication required",
    error = "AUTHENTICATION_REQUIRED"
) => {
    return {
        success: false,
        message,
        error,
        ...(process.env.NODE_ENV === 'development' && {
            debug: {
                timestamp: new Date().toISOString()
            }
        })
    };
};

/**
 * Create a standardized error response for resource not found
 * @param {string} resource - Type of resource that was not found
 * @param {string} id - ID of the resource that was not found
 * @returns {Object} Standardized error response object
 */
export const createNotFoundResponse = (
    resource = "Resource",
    id = null
) => {
    return {
        success: false,
        message: `${resource} not found`,
        error: "RESOURCE_NOT_FOUND",
        resourceType: resource.toLowerCase(),
        resourceId: id,
        ...(process.env.NODE_ENV === 'development' && {
            debug: {
                timestamp: new Date().toISOString()
            }
        })
    };
};

/**
 * Create a standardized error response for validation failures
 * @param {string} message - Human-readable error message
 * @param {Object} validationErrors - Detailed validation error information
 * @returns {Object} Standardized error response object
 */
export const createValidationErrorResponse = (
    message = "Validation failed",
    validationErrors = {}
) => {
    return {
        success: false,
        message,
        error: "VALIDATION_ERROR",
        validationErrors,
        ...(process.env.NODE_ENV === 'development' && {
            debug: {
                timestamp: new Date().toISOString()
            }
        })
    };
};

/**
 * Create a standardized error response for server errors
 * @param {string} message - Human-readable error message
 * @param {Error} originalError - Original error object (for logging)
 * @returns {Object} Standardized error response object
 */
export const createServerErrorResponse = (
    message = "Internal server error",
    originalError = null
) => {
    const response = {
        success: false,
        message,
        error: "INTERNAL_SERVER_ERROR"
    };

    // Add error details in development mode
    if (process.env.NODE_ENV === 'development' && originalError) {
        response.debug = {
            originalMessage: originalError.message,
            stack: originalError.stack,
            timestamp: new Date().toISOString()
        };
    }

    return response;
};

/**
 * Role-specific error responses
 */
export const RoleErrors = {
    TEACHER_REQUIRED: (userRoles = [], debugInfo = {}) =>
        createAccessDeniedResponse(
            "Teacher privileges required",
            "TEACHER_PRIVILEGES_REQUIRED",
            "teacher",
            userRoles,
            debugInfo
        ),

    ADMIN_REQUIRED: (userRoles = [], debugInfo = {}) =>
        createAccessDeniedResponse(
            "Administrator privileges required",
            "ADMIN_PRIVILEGES_REQUIRED",
            "admin",
            userRoles,
            debugInfo
        ),

    TEACHER_OR_ADMIN_REQUIRED: (userRoles = [], debugInfo = {}) =>
        createAccessDeniedResponse(
            "Teacher or administrator privileges required",
            "TEACHER_OR_ADMIN_PRIVILEGES_REQUIRED",
            "teacher_or_admin",
            userRoles,
            debugInfo
        ),

    RESOURCE_OWNER_REQUIRED: (userRoles = [], debugInfo = {}) =>
        createAccessDeniedResponse(
            "You can only modify your own resources",
            "RESOURCE_OWNER_REQUIRED",
            "owner",
            userRoles,
            debugInfo
        )
};

export default {
    createAccessDeniedResponse,
    createAuthenticationRequiredResponse,
    createNotFoundResponse,
    createValidationErrorResponse,
    createServerErrorResponse,
    RoleErrors
};