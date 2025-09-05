/**
 * Upload Routes Module
 * Handles file uploads using Multer and Cloudinary
 * All routes require authentication
 * @module routes/upload
 */

import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js";
import { uploadFile } from "../controllers/upload.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage });

/**
 * @route POST /api/upload
 * @description Upload a general file
 * @access Private
 * @body {multipart/form-data} file - File to upload
 * @returns {Object} Uploaded file details with Cloudinary URL
 */
router.post("/", protect, upload.single("file"), uploadFile);

/**
 * @route POST /api/upload/avatar
 * @description Upload a profile avatar with 1:1 aspect ratio transformation
 * @access Private
 * @body {multipart/form-data} file - Image file to upload
 * @returns {Object} Uploaded avatar details with Cloudinary URL
 */
router.post("/avatar", protect, upload.single("file"), uploadFile);

export default router;
