/**
 * Role Utilities Test Suite
 * Tests for role validation and precedence logic
 */

import {
    hasRole,
    hasAnyRole,
    getHighestRole,
    shouldUseTeacherPrivileges,
    shouldUseAdminPrivileges,
    getAcademicNoteDefaults,
    isValidRoleArray
} from '../utils/roleUtils.js';

describe('Role Utilities', () => {

    describe('hasRole', () => {
        test('should return true when user has the required role', () => {
            expect(hasRole(['student', 'teacher'], 'teacher')).toBe(true);
            expect(hasRole(['admin'], 'admin')).toBe(true);
        });

        test('should return false when user does not have the required role', () => {
            expect(hasRole(['student'], 'teacher')).toBe(false);
            expect(hasRole(['teacher'], 'admin')).toBe(false);
        });

        test('should handle invalid inputs gracefully', () => {
            expect(hasRole(null, 'teacher')).toBe(false);
            expect(hasRole(undefined, 'teacher')).toBe(false);
            expect(hasRole('not-array', 'teacher')).toBe(false);
            expect(hasRole([], 'teacher')).toBe(false);
        });
    });

    describe('hasAnyRole', () => {
        test('should return true when user has any of the required roles', () => {
            expect(hasAnyRole(['student', 'teacher'], ['teacher', 'admin'])).toBe(true);
            expect(hasAnyRole(['admin'], ['teacher', 'admin'])).toBe(true);
        });

        test('should return false when user has none of the required roles', () => {
            expect(hasAnyRole(['student'], ['teacher', 'admin'])).toBe(false);
        });

        test('should handle invalid inputs gracefully', () => {
            expect(hasAnyRole(null, ['teacher'])).toBe(false);
            expect(hasAnyRole(['teacher'], null)).toBe(false);
            expect(hasAnyRole('not-array', ['teacher'])).toBe(false);
        });
    });

    describe('getHighestRole', () => {
        test('should return admin as highest role', () => {
            expect(getHighestRole(['student', 'teacher', 'admin'])).toBe('admin');
            expect(getHighestRole(['admin', 'student'])).toBe('admin');
        });

        test('should return teacher when no admin role', () => {
            expect(getHighestRole(['student', 'teacher'])).toBe('teacher');
            expect(getHighestRole(['teacher'])).toBe('teacher');
        });

        test('should return student when only student role', () => {
            expect(getHighestRole(['student'])).toBe('student');
        });

        test('should return null for invalid inputs', () => {
            expect(getHighestRole([])).toBe(null);
            expect(getHighestRole(null)).toBe(null);
            expect(getHighestRole(undefined)).toBe(null);
        });
    });

    describe('shouldUseTeacherPrivileges', () => {
        test('should return true for teacher role', () => {
            expect(shouldUseTeacherPrivileges(['teacher'])).toBe(true);
            expect(shouldUseTeacherPrivileges(['student', 'teacher'])).toBe(true);
        });

        test('should return true for admin role', () => {
            expect(shouldUseTeacherPrivileges(['admin'])).toBe(true);
            expect(shouldUseTeacherPrivileges(['student', 'admin'])).toBe(true);
        });

        test('should return false for student only', () => {
            expect(shouldUseTeacherPrivileges(['student'])).toBe(false);
        });

        test('should handle invalid inputs', () => {
            expect(shouldUseTeacherPrivileges([])).toBe(false);
            expect(shouldUseTeacherPrivileges(null)).toBe(false);
        });
    });

    describe('shouldUseAdminPrivileges', () => {
        test('should return true only for admin role', () => {
            expect(shouldUseAdminPrivileges(['admin'])).toBe(true);
            expect(shouldUseAdminPrivileges(['student', 'admin'])).toBe(true);
            expect(shouldUseAdminPrivileges(['teacher', 'admin'])).toBe(true);
        });

        test('should return false for non-admin roles', () => {
            expect(shouldUseAdminPrivileges(['student'])).toBe(false);
            expect(shouldUseAdminPrivileges(['teacher'])).toBe(false);
            expect(shouldUseAdminPrivileges(['student', 'teacher'])).toBe(false);
        });
    });

    describe('getAcademicNoteDefaults', () => {
        test('should return teacher defaults for teacher role', () => {
            const result = getAcademicNoteDefaults(['teacher']);
            expect(result).toEqual({
                status: "Approved",
                type: "Official",
                isAdminUploaded: false,
                isApproved: true
            });
        });

        test('should return admin defaults for admin role', () => {
            const result = getAcademicNoteDefaults(['admin']);
            expect(result).toEqual({
                status: "Approved",
                type: "Official",
                isAdminUploaded: true,
                isApproved: true
            });
        });

        test('should return teacher defaults when user has both student and teacher roles', () => {
            const result = getAcademicNoteDefaults(['student', 'teacher']);
            expect(result).toEqual({
                status: "Approved",
                type: "Official",
                isAdminUploaded: false,
                isApproved: true
            });
        });

        test('should return admin defaults when user has all roles', () => {
            const result = getAcademicNoteDefaults(['student', 'teacher', 'admin']);
            expect(result).toEqual({
                status: "Approved",
                type: "Official",
                isAdminUploaded: true,
                isApproved: true
            });
        });

        test('should return student defaults for student only', () => {
            const result = getAcademicNoteDefaults(['student']);
            expect(result).toEqual({
                status: "In for Review",
                type: "Unofficial",
                isAdminUploaded: false,
                isApproved: false
            });
        });

        test('should return student defaults for empty roles', () => {
            const result = getAcademicNoteDefaults([]);
            expect(result).toEqual({
                status: "In for Review",
                type: "Unofficial",
                isAdminUploaded: false,
                isApproved: false
            });
        });
    });

    describe('isValidRoleArray', () => {
        test('should return true for valid role arrays', () => {
            expect(isValidRoleArray(['student'])).toBe(true);
            expect(isValidRoleArray(['teacher'])).toBe(true);
            expect(isValidRoleArray(['admin'])).toBe(true);
            expect(isValidRoleArray(['student', 'teacher'])).toBe(true);
            expect(isValidRoleArray(['teacher', 'admin'])).toBe(true);
            expect(isValidRoleArray(['student', 'teacher', 'admin'])).toBe(true);
            expect(isValidRoleArray([])).toBe(true);
        });

        test('should return false for invalid inputs', () => {
            expect(isValidRoleArray(null)).toBe(false);
            expect(isValidRoleArray(undefined)).toBe(false);
            expect(isValidRoleArray('not-array')).toBe(false);
            expect(isValidRoleArray(['invalid-role'])).toBe(false);
            expect(isValidRoleArray(['student', 'invalid-role'])).toBe(false);
        });
    });

    describe('Role Precedence Integration Tests', () => {
        test('should handle complex role combinations correctly', () => {
            const testCases = [
                {
                    roles: ['student'],
                    expectedHighest: 'student',
                    expectedTeacherPrivileges: false,
                    expectedAdminPrivileges: false,
                    expectedNoteDefaults: {
                        status: "In for Review",
                        type: "Unofficial",
                        isAdminUploaded: false,
                        isApproved: false
                    }
                },
                {
                    roles: ['teacher'],
                    expectedHighest: 'teacher',
                    expectedTeacherPrivileges: true,
                    expectedAdminPrivileges: false,
                    expectedNoteDefaults: {
                        status: "Approved",
                        type: "Official",
                        isAdminUploaded: false,
                        isApproved: true
                    }
                },
                {
                    roles: ['admin'],
                    expectedHighest: 'admin',
                    expectedTeacherPrivileges: true,
                    expectedAdminPrivileges: true,
                    expectedNoteDefaults: {
                        status: "Approved",
                        type: "Official",
                        isAdminUploaded: true,
                        isApproved: true
                    }
                },
                {
                    roles: ['student', 'teacher'],
                    expectedHighest: 'teacher',
                    expectedTeacherPrivileges: true,
                    expectedAdminPrivileges: false,
                    expectedNoteDefaults: {
                        status: "Approved",
                        type: "Official",
                        isAdminUploaded: false,
                        isApproved: true
                    }
                },
                {
                    roles: ['student', 'teacher', 'admin'],
                    expectedHighest: 'admin',
                    expectedTeacherPrivileges: true,
                    expectedAdminPrivileges: true,
                    expectedNoteDefaults: {
                        status: "Approved",
                        type: "Official",
                        isAdminUploaded: true,
                        isApproved: true
                    }
                }
            ];

            testCases.forEach(({ roles, expectedHighest, expectedTeacherPrivileges, expectedAdminPrivileges, expectedNoteDefaults }) => {
                expect(getHighestRole(roles)).toBe(expectedHighest);
                expect(shouldUseTeacherPrivileges(roles)).toBe(expectedTeacherPrivileges);
                expect(shouldUseAdminPrivileges(roles)).toBe(expectedAdminPrivileges);
                expect(getAcademicNoteDefaults(roles)).toEqual(expectedNoteDefaults);
            });
        });
    });
});

export default {};