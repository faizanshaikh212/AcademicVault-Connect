import express from "express";
import {
  registerUser,
  loginUser,
  verifyPassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

// Initialize the express router
const router = express.Router();

// Define the routes
// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);

// POST /api/auth/verify-password
router.post("/verify-password", protect, verifyPassword);

export default router;
