/**
 * Blog Routes Module
 * Handles all blog-related endpoints
 * Includes public and protected routes
 * @module routes/blog
 */

import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getBlogsByUserId,
} from "../controllers/blog.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Root blog routes
 * @name blog-root-routes
 * @description Endpoints for listing and creating blogs
 */
router
  .route("/")
  /**
   * @route GET /api/blogs
   * @description Get all blog posts
   * @access Public
   * @returns Array of blog posts
   */
  .get(getAllBlogs)
  /**
   * @route POST /api/blogs
   * @description Create a new blog post
   * @access Private
   * @body
   * - title: string
   * - content: string
   * - coverImage: string (URL)
   * - tags: string[]
   * @returns Created blog post
   */
  .post(protect, createBlog);

/**
 * @route GET /api/blogs/user/:userId
 * @description Get all blogs by a specific user
 * @access Public
 * @params userId - User's MongoDB ID
 * @returns Array of user's blog posts
 */
router.get("/user/:userId", getBlogsByUserId);

/**
 * Individual blog routes
 * @name blog-id-routes
 * @description Endpoints for managing specific blog posts
 */
router
  .route("/:id")
  /**
   * @route GET /api/blogs/:id
   * @description Get a specific blog post
   * @access Public
   * @params id - Blog post ID
   * @returns Blog post object
   */
  .get(getBlogById)
  /**
   * @route PUT /api/blogs/:id
   * @description Update a blog post
   * @access Private
   * @params id - Blog post ID
   * @body Blog post fields to update
   * @returns Updated blog post
   */
  .put(protect, updateBlog)
  /**
   * @route DELETE /api/blogs/:id
   * @description Delete a blog post
   * @access Private
   * @params id - Blog post ID
   * @returns Success message
   */
  .delete(protect, deleteBlog);

export default router;
