/**
 * Client-side role debugging utilities
 * Provides debugging tools for role-based access control
 */

import api from '../services/api';

interface RoleDebugInfo {
    userId: string;
    username: string;
    roles: string[];
    roleChecks: {
        isValidRoleArray: boolean;
        hasStudentRole: boolean;
        hasTeacherRole: boolean;
        hasAdminRole: boolean;
        hasAnyTeacherOrAdmin: boolean;
        highestRole: string | null;
        shouldUseTeacherPrivileges: boolean;
        shouldUseAdminPrivileges: boolean;
    };
    academicNoteDefaults: {
        status: string;
        type: string;
        isAdminUploaded: boolean;
        isApproved: boolean;
    };
    timestamp: string;
}

interface RoleTestResult {
    testRoles: string[];
    requiredRole?: string;
    checks: {
        isValidRoleArray: boolean;
        hasRequiredRole: boolean | null;
        hasStudentRole: boolean;
        hasTeacherRole: boolean;
        hasAdminRole: boolean;
        hasAnyTeacherOrAdmin: boolean;
        highestRole: string | null;
        shouldUseTeacherPrivileges: boolean;
        shouldUseAdminPrivileges: boolean;
    };
    academicNoteDefaults: {
        status: string;
        type: string;
        isAdminUploaded: boolean;
        isApproved: boolean;
    };
    timestamp: string;
}

/**
 * Get current user's role debug information
 */
export const getUserRoleDebugInfo = async (): Promise<RoleDebugInfo | null> => {
    if (!import.meta.env.DEV) {
        console.warn('Role debugging is only available in development mode');
        return null;
    }

    try {
        const response = await api.get('/debug/user-roles');
        return response.data.data;
    } catch (error) {
        console.error('Failed to get role debug info:', error);
        return null;
    }
};

/**
 * Test role checking with custom roles
 */
export const testRoleChecking = async (
    testRoles: string[],
    requiredRole?: string
): Promise<RoleTestResult | null> => {
    if (!import.meta.env.DEV) {
        console.warn('Role debugging is only available in development mode');
        return null;
    }

    try {
        const response = await api.post('/debug/test-roles', {
            testRoles,
            requiredRole
        });
        return response.data.data;
    } catch (error) {
        console.error('Failed to test role checking:', error);
        return null;
    }
};

/**
 * Log role check information to console (development only)
 */
export const logRoleCheck = (
    context: string,
    userRoles: string[],
    requiredRole: string,
    hasAccess: boolean,
    additionalInfo?: any
) => {
    if (import.meta.env.DEV) {
        console.group(`🔐 Role Check: ${context}`);
        console.log('User Roles:', userRoles);
        console.log('Required Role:', requiredRole);
        console.log('Access Granted:', hasAccess ? '✅' : '❌');
        if (additionalInfo) {
            console.log('Additional Info:', additionalInfo);
        }
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();
    }
};

/**
 * Debug role-based component visibility
 */
export const debugComponentVisibility = (
    componentName: string,
    userRoles: string[],
    requiredRoles: string[],
    isVisible: boolean
) => {
    if (import.meta.env.DEV) {
        console.group(`👁️ Component Visibility: ${componentName}`);
        console.log('User Roles:', userRoles);
        console.log('Required Roles:', requiredRoles);
        console.log('Is Visible:', isVisible ? '✅' : '❌');
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();
    }
};

/**
 * Create a debug panel for role information (React component helper)
 */
export const createRoleDebugPanel = (userRoles: string[]) => {
    if (!import.meta.env.DEV) {
        return null;
    }

    return {
        userRoles,
        hasStudent: userRoles.includes('student'),
        hasTeacher: userRoles.includes('teacher'),
        hasAdmin: userRoles.includes('admin'),
        hasTeacherPrivileges: userRoles.includes('teacher') || userRoles.includes('admin'),
        hasAdminPrivileges: userRoles.includes('admin'),
        highestRole: userRoles.includes('admin') ? 'admin' :
            userRoles.includes('teacher') ? 'teacher' :
                userRoles.includes('student') ? 'student' : null
    };
};

/**
 * Validate role array format
 */
export const validateRoles = (roles: any): boolean => {
    if (!Array.isArray(roles)) {
        console.warn('Roles should be an array, got:', typeof roles);
        return false;
    }

    const validRoles = ['student', 'teacher', 'admin'];
    const invalidRoles = roles.filter(role => !validRoles.includes(role));

    if (invalidRoles.length > 0) {
        console.warn('Invalid roles found:', invalidRoles);
        return false;
    }

    return true;
};

export default {
    getUserRoleDebugInfo,
    testRoleChecking,
    logRoleCheck,
    debugComponentVisibility,
    createRoleDebugPanel,
    validateRoles
};