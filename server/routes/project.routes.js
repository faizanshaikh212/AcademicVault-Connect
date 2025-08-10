/**
 * Project Routes Module
 * Handles all project-related endpoints
 * Supports CRUD operations and user-specific queries
 * @module routes/project
 */

import express from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectsByUserId,
} from "../controllers/project.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Root project routes
 * @name project-root-routes
 * @description Endpoints for listing and creating projects
 */
router
  .route("/")
  /**
   * @route GET /api/projects
   * @description Get all projects
   * @access Public
   * @returns Array of project objects
   */
  .get(getAllProjects)
  /**
   * @route POST /api/projects
   * @description Create a new project
   * @access Private
   * @body
   * - title: string
   * - description: string
   * - coverImage: string (URL)
   * - screenshots: string[] (URLs)
   * - projectLink: string
   * - sourceCodeLink: string
   * - tags: string[]
   * - socialMediaLinks: Object
   * @returns Created project
   */
  .post(protect, createProject);

/**
 * @route GET /api/projects/user/:userId
 * @description Get all projects by a specific user
 * @access Public
 * @params userId - User's MongoDB ID
 * @returns Array of user's projects
 */
router.get("/user/:userId", getProjectsByUserId);

/**
 * Individual project routes
 * @name project-id-routes
 * @description Endpoints for managing specific projects
 */
router
  .route("/:id")
  /**
   * @route GET /api/projects/:id
   * @description Get a specific project
   * @access Public
   * @params id - Project ID
   * @returns Project object
   */
  .get(getProjectById)
  /**
   * @route PUT /api/projects/:id
   * @description Update a project
   * @access Private
   * @params id - Project ID
   * @body Project fields to update
   * @returns Updated project
   */
  .put(protect, updateProject)
  /**
   * @route DELETE /api/projects/:id
   * @description Delete a project
   * @access Private
   * @params id - Project ID
   * @returns Success message
   */
  .delete(protect, deleteProject);

export default router;
