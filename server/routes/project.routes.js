import express from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectsByUserId, // Import the new function
} from "../controllers/project.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/").get(getAllProjects).post(protect, createProject);

// Add the new route to get projects by user
router.get("/user/:userId", getProjectsByUserId);

router
  .route("/:id")
  .get(getProjectById)
  .put(protect, updateProject)
  .delete(protect, deleteProject);

export default router;
