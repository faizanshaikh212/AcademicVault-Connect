import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  updateUserSettings,
  followUser,
  handleFriendRequest,
  blockUser,
  getAllPublicUsers,
  submitRoleRequest,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Add the new public route to get all users
router.get("/all", getAllPublicUsers);

// Public route to get a single user's profile
router.get("/:username", getUserProfile);

// Private routes for the logged-in user
router.put("/profile", protect, updateUserProfile);
router.put("/settings", protect, updateUserSettings);

// Social Interaction Routes
router.post("/:id/follow", protect, followUser);
router.post("/:id/friend", protect, handleFriendRequest);
router.post("/:id/block", protect, blockUser);
router.post("/request-teacher-role", protect, submitRoleRequest);

export default router;
