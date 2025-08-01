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

router.route("/").get(getAllBlogs).post(protect, createBlog);

// This is the crucial route that was missing.
router.get("/user/:userId", getBlogsByUserId);

router
  .route("/:id")
  .get(getBlogById)
  .put(protect, updateBlog)
  .delete(protect, deleteBlog);

export default router;
