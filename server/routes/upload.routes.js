import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js";
import { uploadFile } from "../controllers/upload.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage });

// Define the file upload route
// It's protected, so only logged-in users can upload.
// 'file' is the field name that the frontend form will use for the file input.
router.post("/", protect, upload.single("file"), uploadFile);

export default router;
