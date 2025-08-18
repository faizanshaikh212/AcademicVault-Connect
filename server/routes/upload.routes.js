import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js";
import { uploadFile } from "../controllers/upload.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage });

// General file upload route
router.post("/", protect, upload.single("file"), uploadFile);

// Specific avatar upload route that will trigger the 1:1 aspect ratio transformation
router.post("/avatar", protect, upload.single("file"), uploadFile);

export default router;
