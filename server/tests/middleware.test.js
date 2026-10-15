/**
 * Middleware Integration Tests
 * Tests for authentication and authorization middleware
 */

import request from 'supertest';
import express from 'express';
import teacher from '../middleware/teacher.middleware.js';
import { admin } from '../middleware/admin.middleware.js';

// Mock app for testing middleware
const createTestApp = (middleware, user) => {
    const app = express();
    app.use(express.json());

    if (user !== undefined) {
        app.use((req, res, next) => {
            req.user = user;
            next();
        });
    }

    // Test route with middleware
    app.get('/test', middleware, (req, res) => {
        res.json({ success: true, message: 'Access granted' });
    });

    return app;
};

// Mock user objects
const mockUsers = {
    student: {
        _id: 'student123',
        username: 'student',
        role: ['student']
    },
    teacher: {
        _id: 'teacher123',
        username: 'teacher',
        role: ['teacher']
    },
    admin: {
        _id: 'admin123',
        username: 'admin',
        role: ['admin']
    },
    teacherAdmin: {
        _id: 'teacherAdmin123',
        username: 'teacherAdmin',
        role: ['teacher', 'admin']
    },
    studentTeacher: {
        _id: 'studentTeacher123',
        username: 'studentTeacher',
        role: ['student', 'teacher']
    }
};

describe('Teacher Middleware', () => {
    test('should allow access for teacher role', async () => {
        const app = createTestApp(teacher, mockUsers.teacher);

        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should allow access for admin role', async () => {
        const app = createTestApp(teacher, mockUsers.admin);

        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should allow access for user with both teacher and admin roles', async () => {
        const app = createTestApp(teacher, mockUsers.teacherAdmin);

        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should allow access for user with student and teacher roles', async () => {
        const app = createTestApp(teacher, mockUsers.studentTeacher);

        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should deny access for student only role', async () => {
        const app = createTestApp(teacher, mockUsers.student);

        const response = await request(app).get('/test');
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny access when no user object', async () => {
        const response = await request(createTestApp(teacher)).get('/test');
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('NO_USER_OBJECT');
    });

    test('should deny access when user has no role property', async () => {
        const app = createTestApp(teacher, { _id: 'user123', username: 'user' });

        const response = await request(app).get('/test');
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('NO_ROLE_PROPERTY');
    });
});

describe('Admin Middleware', () => {
    test('should allow access for admin role', async () => {
        const app = createTestApp(admin, mockUsers.admin);

        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should allow access for user with both teacher and admin roles', async () => {
        const app = createTestApp(admin, mockUsers.teacherAdmin);

        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should deny access for teacher only role', async () => {
        const app = createTestApp(admin, mockUsers.teacher);

        const response = await request(app).get('/test');
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny access for student only role', async () => {
        const app = createTestApp(admin, mockUsers.student);

        const response = await request(app).get('/test');
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny access for student+teacher roles', async () => {
        const app = createTestApp(admin, mockUsers.studentTeacher);

        const response = await request(app).get('/test');
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INSUFFICIENT_PERMISSIONS');
    });
});

describe('Middleware Error Response Format', () => {
    test('teacher middleware should return standardized error format', async () => {
        const app = createTestApp(teacher, mockUsers.student);

        const response = await request(app).get('/test');

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('requiredRole');
        expect(response.body).toHaveProperty('userRoles');

        // In development, should include debug info
        if (process.env.NODE_ENV === 'development') {
            expect(response.body).toHaveProperty('debug');
            expect(response.body.debug).toHaveProperty('userId');
            expect(response.body.debug).toHaveProperty('endpoint');
            expect(response.body.debug).toHaveProperty('timestamp');
        }
    });

    test('admin middleware should return standardized error format', async () => {
        const app = createTestApp(admin, mockUsers.teacher);

        const response = await request(app).get('/test');

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('requiredRole');
        expect(response.body).toHaveProperty('userRoles');
    });
});

export default {};