import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface RoleContextType {
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    isTeacher: boolean;
    isAdmin: boolean;
    isStudent: boolean;
    getHighestRole: () => string | null;
    shouldUseTeacherPrivileges: () => boolean;
    shouldUseAdminPrivileges: () => boolean;
    getAcademicNoteDefaults: () => {
        status: string;
        type: string;
        isAdminUploaded: boolean;
        isApproved: boolean;
    };
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
    children: ReactNode;
}

/**
 * Role precedence order (highest to lowest)
 */
const ROLE_PRECEDENCE: Record<string, number> = {
    admin: 3,
    teacher: 2,
    student: 1
};

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const userRoles = user?.role || [];

    const hasRole = (role: string): boolean => {
        return Array.isArray(userRoles) && userRoles.includes(role);
    };

    const hasAnyRole = (roles: string[]): boolean => {
        return Array.isArray(userRoles) && roles.some(role => userRoles.includes(role));
    };

    const getHighestRole = (): string | null => {
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

    const shouldUseTeacherPrivileges = (): boolean => {
        return hasAnyRole(['teacher', 'admin']);
    };

    const shouldUseAdminPrivileges = (): boolean => {
        return hasRole('admin');
    };

    const getAcademicNoteDefaults = () => {
        if (shouldUseTeacherPrivileges()) {
            return {
                status: "Approved",
                type: "Official",
                isAdminUploaded: shouldUseAdminPrivileges(),
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

    const value: RoleContextType = {
        hasRole,
        hasAnyRole,
        isTeacher: hasRole('teacher'),
        isAdmin: hasRole('admin'),
        isStudent: hasRole('student'),
        getHighestRole,
        shouldUseTeacherPrivileges,
        shouldUseAdminPrivileges,
        getAcademicNoteDefaults
    };

    return (
        <RoleContext.Provider value={value}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = (): RoleContextType => {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
};

export default RoleContext;