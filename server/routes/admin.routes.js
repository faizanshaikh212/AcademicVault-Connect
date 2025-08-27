/**
 * Admin Routes Module
 * Handles all administrative operations
 * All routes require authentication and admin privileges
 * @module routes/admin
 */

import express from "express";
import Blog from "../models/blog.model.js";
import Project from "../models/project.model.js";
import {
  getAllUsers,
  updateUserRole,
  getDashboardStats,
  getRoleRequests,
  handleRoleRequest,
  getPremiumUsers,
  createUser,
  updateUser,
  deleteUser,
  renewPremium,
  revokePremium,
  deletePremiumRequest,
} from "../controllers/admin.controller.js";
import {
  getTeachers,
  assignCourseToTeacher,
} from "../controllers/teacher.controller.js";
import {
  getAllPremiumRequests,
  updatePremiumRequestStatus,
} from "../controllers/premium.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/admin.middleware.js";

const router = express.Router();

/**
 * Apply middleware to all admin routes
 * @middleware protect - Ensures user is authenticated
 * @middleware admin - Ensures user has admin privileges
 */
router.use(protect, admin);

/**
 * @route GET /api/admin/stats
 * @description Get admin dashboard statistics
 * @access Private/Admin
 * @returns {Object} Dashboard stats including user counts, content metrics
 */
router.get("/stats", getDashboardStats);

/**
 * Content Management Routes
 */

/**
 * @route GET /api/admin/content/blogs
 * @description Get all blogs for content management
 * @access Private/Admin
 * @returns {Array<Object>} Array of blog posts with author details
 */
router.get("/content/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "firstName lastName username")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching blogs", error: error.message });
  }
});

/**
 * @route GET /api/admin/content/projects
 * @description Get all projects for content management
 * @access Private/Admin
 * @returns {Array<Object>} Array of projects with author details
 */
router.get("/content/projects", async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("author", "firstName lastName username")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching projects", error: error.message });
  }
});

/**
 * User Management Routes
 */

/**
 * @route GET /api/admin/users
 * @description Get all users
 * @access Private/Admin
 * @returns {Array<Object>} Array of user objects
 */
router.get("/users", getAllUsers);

/**
 * @route POST /api/admin/users
 * @description Create a new user
 * @access Private/Admin
 * @body User data
 * @returns {Object} Created user
 */
router.post("/users", createUser);

/**
 * @route PUT /api/admin/users/:id
 * @description Update user details
 * @access Private/Admin
 * @param {string} id - User ID
 * @body Updated user data
 * @returns {Object} Updated user
 */
router.put("/users/:id", updateUser);

/**
 * @route DELETE /api/admin/users/:id
 * @description Delete a user
 * @access Private/Admin
 * @param {string} id - User ID
 * @returns {Object} Success message
 */
router.delete("/users/:id", deleteUser);

/**
 * @route PUT /api/admin/users/:id/role
 * @description Update user's role
 * @access Private/Admin
 * @param {string} id - User ID
 * @body {string} role - New role
 * @returns {Object} Updated user
 */
router.put("/users/:id/role", updateUserRole);

/**
 * Premium User Management Routes
 */

/**
 * @route GET /api/admin/premium-users
 * @description Get all premium users
 * @access Private/Admin
 * @returns {Array<Object>} Array of premium users
 */
router.get("/premium-users", getPremiumUsers);

/**
 * @route POST /api/admin/users/:id/renew-premium
 * @description Renew a user's premium status
 * @access Private/Admin
 * @param {string} id - User ID
 * @returns {Object} Updated user
 */
router.post("/users/:id/renew-premium", renewPremium);

/**
 * @route POST /api/admin/users/:id/revoke-premium
 * @description Revoke a user's premium status
 * @access Private/Admin
 * @param {string} id - User ID
 * @returns {Object} Updated user
 */
router.post("/users/:id/revoke-premium", revokePremium);

/**
 * Role Request Management Routes
 */

/**
 * @route GET /api/admin/rolerequests
 * @description Get all role upgrade requests
 * @access Private/Admin
 * @returns {Array<Object>} Array of role requests
 */
router.get("/rolerequests", getRoleRequests);

/**
 * @route POST /api/admin/rolerequests/:id
 * @description Handle a role request
 * @access Private/Admin
 * @param {string} id - Request ID
 * @body {string} status - New status
 * @returns {Object} Updated role request
 */
router.post("/rolerequests/:id", handleRoleRequest);

/**
 * Premium Request Management Routes
 */

/**
 * @route GET /api/admin/premium-requests
 * @description Get all premium requests
 * @access Private/Admin
 * @returns {Array<Object>} Array of premium requests
 */
router.get("/premium-requests", getAllPremiumRequests);

/**
 * @route PUT /api/admin/premium-requests/:id
 * @description Update status of a premium request
 * @access Private/Admin
 * @param {string} id - Request ID
 * @body {string} status - New status
 * @returns {Object} Updated premium request
 */
router.put("/premium-requests/:id", updatePremiumRequestStatus);

/**
 * @route DELETE /api/admin/premium-requests/:id
 * @description Delete a premium request
 * @access Private/Admin
 * @param {string} id - Request ID
 * @returns {Object} Success message
 */
router.delete("/premium-requests/:id", deletePremiumRequest);

/**
 * Teacher Management Routes
 */

/**
 * @route GET /api/admin/teachers
 * @description Get all teachers with their courses
 * @access Private/Admin
 * @returns {Array<Object>} Array of teachers with their assigned courses
 */
router.get("/teachers", getTeachers);

/**
 * @route POST /api/admin/teachers/:teacherId/courses
 * @description Assign a course to a teacher
 * @access Private/Admin
 * @param {string} teacherId - Teacher ID
 * @body {Object} courseId - Course ID to assign
 * @body {Array} semesters - Array of semester numbers
 * @returns {Object} Updated teacher with courses
 */
router.post("/teachers/:teacherId/courses", assignCourseToTeacher);

export default router;
