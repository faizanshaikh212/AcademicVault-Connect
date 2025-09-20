/**
 * Middleware Integration Tests
 * Tests for authentication and authorization middleware
 */

import request from 'supertest';
import express from 'express';
import teacher from '../middleware/teacher.middleware.js';
import { admin } from '../middleware/admin.middleware.js';

// Mock app for testing middleware
const createTestApp = (middleware) => {
    const app = express();
    app.use(express.json());

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
    let app;

    beforeEach(() => {
        app = createTestApp(teacher);
    });

    test('should allow access for teacher role', async () => {
        // Mock request with teacher user
        app.use((req, res, next) => {
            req.user = mockUsers.teacher;
            next();
        });

        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should allow access for admin role', async () => {
        // Mock request with admin user
        app.use((req, res, next) => {
            req.user = mockUsers.admin;
            next();
        });

        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should allow access for user with both teacher and admin roles', async () => {
        // Mock request with teacher+admin user
        app.use((req, res, next) => {
            req.user = mockUsers.teacherAdmin;
            next();
        });

        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should allow access for user with student and teacher roles', async () => {
        // Mock request with student+teacher user
        app.use((req, res, next) => {
            req.user = mockUsers.studentTeacher;
            next();
        });

        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should deny access for student only role', async () => {
        // Mock request with student user
        app.use((req, res, next) => {
            req.user = mockUsers.student;
            next();
        });

        const response = await request(app).get('/test');
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny access when no user object', async () => {
        const response = await request(app).get('/test');
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('NO_USER_OBJECT');
    });

    test('should deny access when user has no role property', async () => {
        // Mock request with user without role
        app.use((req, res, next) => {
            req.user = { _id: 'user123', username: 'user' };
            next();
        });

        const response = await request(app).get('/test');
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('NO_ROLE_PROPERTY');
    });
});

describe('Admin Middleware', () => {
    let app;

    beforeEach(() => {
        app = createTestApp(admin);
    });

    test('should allow access for admin role', async () => {
        // Mock request with admin user
        app.use((req, res, next) => {
            req.user = mockUsers.admin;
            next();
        });

        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should allow access for user with both teacher and admin roles', async () => {
        // Mock request with teacher+admin user
        app.use((req, res, next) => {
            req.user = mockUsers.teacherAdmin;
            next();
        });

        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should deny access for teacher only role', async () => {
        // Mock request with teacher user
        app.use((req, res, next) => {
            req.user = mockUsers.teacher;
            next();
        });

        const response = await request(app).get('/test');
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny access for student only role', async () => {
        // Mock request with student user
        app.use((req, res, next) => {
            req.user = mockUsers.student;
            next();
        });

        const response = await request(app).get('/test');
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny access for student+teacher roles', async () => {
        // Mock request with student+teacher user
        app.use((req, res, next) => {
            req.user = mockUsers.studentTeacher;
            next();
        });

        const response = await request(app).get('/test');
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INSUFFICIENT_PERMISSIONS');
    });
});

describe('Middleware Error Response Format', () => {
    test('teacher middleware should return standardized error format', async () => {
        const app = createTestApp(teacher);

        // Mock request with student user
        app.use((req, res, next) => {
            req.user = mockUsers.student;
            next();
        });

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
        const app = createTestApp(admin);

        // Mock request with teacher user
        app.use((req, res, next) => {
            req.user = mockUsers.teacher;
            next();
        });

        const response = await request(app).get('/test');

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('requiredRole');
        expect(response.body).toHaveProperty('userRoles');
    });
});

export default {};