import express from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";

// Initialize the express router
const router = express.Router();

// Define the routes
// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);

export default router;
