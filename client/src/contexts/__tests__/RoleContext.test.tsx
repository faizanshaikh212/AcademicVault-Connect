/**
 * Role Context Test Suite
 * Tests for client-side role management and checking
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { RoleProvider, useRole } from '../RoleContext';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Test component that uses the role context
const TestComponent: React.FC = () => {
    const {
        hasRole,
        hasAnyRole,
        isTeacher,
        isAdmin,
        isStudent,
        getHighestRole,
        shouldUseTeacherPrivileges,
        shouldUseAdminPrivileges,
        getAcademicNoteDefaults
    } = useRole();

    return (
        <div>
            <div data-testid="has-student">{hasRole('student').toString()}</div>
            <div data-testid="has-teacher">{hasRole('teacher').toString()}</div>
            <div data-testid="has-admin">{hasRole('admin').toString()}</div>
            <div data-testid="has-any-teacher-admin">{hasAnyRole(['teacher', 'admin']).toString()}</div>
            <div data-testid="is-teacher">{isTeacher.toString()}</div>
            <div data-testid="is-admin">{isAdmin.toString()}</div>
            <div data-testid="is-student">{isStudent.toString()}</div>
            <div data-testid="highest-role">{getHighestRole() || 'none'}</div>
            <div data-testid="teacher-privileges">{shouldUseTeacherPrivileges().toString()}</div>
            <div data-testid="admin-privileges">{shouldUseAdminPrivileges().toString()}</div>
            <div data-testid="note-defaults">{JSON.stringify(getAcademicNoteDefaults())}</div>
        </div>
    );
};

const renderWithRoleProvider = (user: any) => {
    mockUseAuth.mockReturnValue({
        user,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn()
    });

    return render(
        <RoleProvider>
            <TestComponent />
        </RoleProvider>
    );
};

describe('RoleContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Student Role', () => {
        test('should handle student-only user correctly', () => {
            const user = {
                _id: 'student123',
                username: 'student',
                role: ['student']
            };

            renderWithRoleProvider(user);

            expect(screen.getByTestId('has-student')).toHaveTextContent('true');
            expect(screen.getByTestId('has-teacher')).toHaveTextContent('false');
            expect(screen.getByTestId('has-admin')).toHaveTextContent('false');
            expect(screen.getByTestId('has-any-teacher-admin')).toHaveTextContent('false');
            expect(screen.getByTestId('is-student')).toHaveTextContent('true');
            expect(screen.getByTestId('is-teacher')).toHaveTextContent('false');
            expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
            expect(screen.getByTestId('highest-role')).toHaveTextContent('student');
            expect(screen.getByTestId('teacher-privileges')).toHaveTextContent('false');
            expect(screen.getByTestId('admin-privileges')).toHaveTextContent('false');

            const noteDefaults = JSON.parse(screen.getByTestId('note-defaults').textContent || '{}');
            expect(noteDefaults).toEqual({
                status: "In for Review",
                type: "Unofficial",
                isAdminUploaded: false,
                isApproved: false
            });
        });
    });

    describe('Teacher Role', () => {
        test('should handle teacher-only user correctly', () => {
            const user = {
                _id: 'teacher123',
                username: 'teacher',
                role: ['teacher']
            };

            renderWithRoleProvider(user);

            expect(screen.getByTestId('has-student')).toHaveTextContent('false');
            expect(screen.getByTestId('has-teacher')).toHaveTextContent('true');
            expect(screen.getByTestId('has-admin')).toHaveTextContent('false');
            expect(screen.getByTestId('has-any-teacher-admin')).toHaveTextContent('true');
            expect(screen.getByTestId('is-student')).toHaveTextContent('false');
            expect(screen.getByTestId('is-teacher')).toHaveTextContent('true');
            expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
            expect(screen.getByTestId('highest-role')).toHaveTextContent('teacher');
            expect(screen.getByTestId('teacher-privileges')).toHaveTextContent('true');
            expect(screen.getByTestId('admin-privileges')).toHaveTextContent('false');

            const noteDefaults = JSON.parse(screen.getByTestId('note-defaults').textContent || '{}');
            expect(noteDefaults).toEqual({
                status: "Approved",
                type: "Official",
                isAdminUploaded: false,
                isApproved: true
            });
        });
    });

    describe('Admin Role', () => {
        test('should handle admin-only user correctly', () => {
            const user = {
                _id: 'admin123',
                username: 'admin',
                role: ['admin']
            };

            renderWithRoleProvider(user);

            expect(screen.getByTestId('has-student')).toHaveTextContent('false');
            expect(screen.getByTestId('has-teacher')).toHaveTextContent('false');
            expect(screen.getByTestId('has-admin')).toHaveTextContent('true');
            expect(screen.getByTestId('has-any-teacher-admin')).toHaveTextContent('true');
            expect(screen.getByTestId('is-student')).toHaveTextContent('false');
            expect(screen.getByTestId('is-teacher')).toHaveTextContent('false');
            expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
            expect(screen.getByTestId('highest-role')).toHaveTextContent('admin');
            expect(screen.getByTestId('teacher-privileges')).toHaveTextContent('true');
            expect(screen.getByTestId('admin-privileges')).toHaveTextContent('true');

            const noteDefaults = JSON.parse(screen.getByTestId('note-defaults').textContent || '{}');
            expect(noteDefaults).toEqual({
                status: "Approved",
                type: "Official",
                isAdminUploaded: true,
                isApproved: true
            });
        });
    });

    describe('Multiple Roles', () => {
        test('should handle student+teacher user with teacher precedence', () => {
            const user = {
                _id: 'studentTeacher123',
                username: 'studentTeacher',
                role: ['student', 'teacher']
            };

            renderWithRoleProvider(user);

            expect(screen.getByTestId('has-student')).toHaveTextContent('true');
            expect(screen.getByTestId('has-teacher')).toHaveTextContent('true');
            expect(screen.getByTestId('has-admin')).toHaveTextContent('false');
            expect(screen.getByTestId('has-any-teacher-admin')).toHaveTextContent('true');
            expect(screen.getByTestId('is-student')).toHaveTextContent('true');
            expect(screen.getByTestId('is-teacher')).toHaveTextContent('true');
            expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
            expect(screen.getByTestId('highest-role')).toHaveTextContent('teacher');
            expect(screen.getByTestId('teacher-privileges')).toHaveTextContent('true');
            expect(screen.getByTestId('admin-privileges')).toHaveTextContent('false');

            // Should use teacher defaults, not student defaults
            const noteDefaults = JSON.parse(screen.getByTestId('note-defaults').textContent || '{}');
            expect(noteDefaults).toEqual({
                status: "Approved",
                type: "Official",
                isAdminUploaded: false,
                isApproved: true
            });
        });

        test('should handle teacher+admin user with admin precedence', () => {
            const user = {
                _id: 'teacherAdmin123',
                username: 'teacherAdmin',
                role: ['teacher', 'admin']
            };

            renderWithRoleProvider(user);

            expect(screen.getByTestId('has-student')).toHaveTextContent('false');
            expect(screen.getByTestId('has-teacher')).toHaveTextContent('true');
            expect(screen.getByTestId('has-admin')).toHaveTextContent('true');
            expect(screen.getByTestId('has-any-teacher-admin')).toHaveTextContent('true');
            expect(screen.getByTestId('is-student')).toHaveTextContent('false');
            expect(screen.getByTestId('is-teacher')).toHaveTextContent('true');
            expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
            expect(screen.getByTestId('highest-role')).toHaveTextContent('admin');
            expect(screen.getByTestId('teacher-privileges')).toHaveTextContent('true');
            expect(screen.getByTestId('admin-privileges')).toHaveTextContent('true');

            // Should use admin defaults
            const noteDefaults = JSON.parse(screen.getByTestId('note-defaults').textContent || '{}');
            expect(noteDefaults).toEqual({
                status: "Approved",
                type: "Official",
                isAdminUploaded: true,
                isApproved: true
            });
        });

        test('should handle all roles with admin precedence', () => {
            const user = {
                _id: 'allRoles123',
                username: 'allRoles',
                role: ['student', 'teacher', 'admin']
            };

            renderWithRoleProvider(user);

            expect(screen.getByTestId('has-student')).toHaveTextContent('true');
            expect(screen.getByTestId('has-teacher')).toHaveTextContent('true');
            expect(screen.getByTestId('has-admin')).toHaveTextContent('true');
            expect(screen.getByTestId('highest-role')).toHaveTextContent('admin');
            expect(screen.getByTestId('teacher-privileges')).toHaveTextContent('true');
            expect(screen.getByTestId('admin-privileges')).toHaveTextContent('true');
        });
    });

    describe('Edge Cases', () => {
        test('should handle user with no roles', () => {
            const user = {
                _id: 'noRoles123',
                username: 'noRoles',
                role: []
            };

            renderWithRoleProvider(user);

            expect(screen.getByTestId('has-student')).toHaveTextContent('false');
            expect(screen.getByTestId('has-teacher')).toHaveTextContent('false');
            expect(screen.getByTestId('has-admin')).toHaveTextContent('false');
            expect(screen.getByTestId('highest-role')).toHaveTextContent('none');
            expect(screen.getByTestId('teacher-privileges')).toHaveTextContent('false');
            expect(screen.getByTestId('admin-privileges')).toHaveTextContent('false');
        });

        test('should handle null user', () => {
            renderWithRoleProvider(null);

            expect(screen.getByTestId('has-student')).toHaveTextContent('false');
            expect(screen.getByTestId('has-teacher')).toHaveTextContent('false');
            expect(screen.getByTestId('has-admin')).toHaveTextContent('false');
            expect(screen.getByTestId('highest-role')).toHaveTextContent('none');
            expect(screen.getByTestId('teacher-privileges')).toHaveTextContent('false');
            expect(screen.getByTestId('admin-privileges')).toHaveTextContent('false');
        });

        test('should handle user with undefined role', () => {
            const user = {
                _id: 'undefinedRole123',
                username: 'undefinedRole'
                // role property is undefined
            };

            renderWithRoleProvider(user);

            expect(screen.getByTestId('has-student')).toHaveTextContent('false');
            expect(screen.getByTestId('has-teacher')).toHaveTextContent('false');
            expect(screen.getByTestId('has-admin')).toHaveTextContent('false');
            expect(screen.getByTestId('highest-role')).toHaveTextContent('none');
            expect(screen.getByTestId('teacher-privileges')).toHaveTextContent('false');
            expect(screen.getByTestId('admin-privileges')).toHaveTextContent('false');
        });
    });

    describe('useRole hook error handling', () => {
        test('should throw error when used outside RoleProvider', () => {
            // Mock console.error to avoid test output noise
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            expect(() => {
                render(<TestComponent />);
            }).toThrow('useRole must be used within a RoleProvider');

            consoleSpy.mockRestore();
        });
    });
});

export default {};