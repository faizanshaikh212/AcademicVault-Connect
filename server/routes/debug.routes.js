/**
 * Debug Routes - Development Only
 * Provides debugging endpoints for role checking and access control
 */

import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
    hasRole,
    hasAnyRole,
    getHighestRole,
    shouldUseTeacherPrivileges,
    shouldUseAdminPrivileges,
    getAcademicNoteDefaults,
    isValidRoleArray
} from "../utils/roleUtils.js";

const router = express.Router();

// Only enable debug routes in development
if (process.env.NODE_ENV === 'development') {

    /**
     * Get current user's role information
     */
    router.get("/user-roles", protect, (req, res) => {
        const userRoles = req.user?.role || [];

        res.json({
            success: true,
            data: {
                userId: req.user._id,
                username: req.user.username,
                roles: userRoles,
                roleChecks: {
                    isValidRoleArray: isValidRoleArray(userRoles),
                    hasStudentRole: hasRole(userRoles, 'student'),
                    hasTeacherRole: hasRole(userRoles, 'teacher'),
                    hasAdminRole: hasRole(userRoles, 'admin'),
                    hasAnyTeacherOrAdmin: hasAnyRole(userRoles, ['teacher', 'admin']),
                    highestRole: getHighestRole(userRoles),
                    shouldUseTeacherPrivileges: shouldUseTeacherPrivileges(userRoles),
                    shouldUseAdminPrivileges: shouldUseAdminPrivileges(userRoles)
                },
                academicNoteDefaults: getAcademicNoteDefaults(userRoles),
                timestamp: new Date().toISOString()
            }
        });
    });

    /**
     * Test role checking with custom roles
     */
    router.post("/test-roles", protect, (req, res) => {
        const { testRoles, requiredRole } = req.body;

        if (!Array.isArray(testRoles)) {
            return res.status(400).json({
                success: false,
                message: "testRoles must be an array"
            });
        }

        const results = {
            testRoles,
            requiredRole,
            checks: {
                isValidRoleArray: isValidRoleArray(testRoles),
                hasRequiredRole: requiredRole ? hasRole(testRoles, requiredRole) : null,
                hasStudentRole: hasRole(testRoles, 'student'),
                hasTeacherRole: hasRole(testRoles, 'teacher'),
                hasAdminRole: hasRole(testRoles, 'admin'),
                hasAnyTeacherOrAdmin: hasAnyRole(testRoles, ['teacher', 'admin']),
                highestRole: getHighestRole(testRoles),
                shouldUseTeacherPrivileges: shouldUseTeacherPrivileges(testRoles),
                shouldUseAdminPrivileges: shouldUseAdminPrivileges(testRoles)
            },
            academicNoteDefaults: getAcademicNoteDefaults(testRoles),
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: results
        });
    });

    /**
     * Get role checking logs (if implemented)
     */
    router.get("/role-logs", protect, (req, res) => {
        // This would require implementing a log storage mechanism
        // For now, just return a message
        res.json({
            success: true,
            message: "Role logging is enabled. Check server console for logs.",
            note: "To implement persistent logging, add a logging storage mechanism to roleUtils.js"
        });
    });

} else {
    // In production, return 404 for all debug routes
    router.use("*", (req, res) => {
        res.status(404).json({
            success: false,
            message: "Debug endpoints are only available in development mode"
        });
    });
}

export default router;