import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getAllAssignments,
  getAssignment,
  submitAssignment,
  unsubmitAssignment,
  getMySubmissions,
} from "../controllers/student.assignment.controller.js";
import {
  handleSubmissionUpload,
  processSubmissionUploads,
} from "../middleware/assignmentUpload.middleware.js";

const router = express.Router();

// Student assignment routes
router.get("/assignments", protect, getAllAssignments);
router.get("/assignments/:id", protect, getAssignment);
router.post(
  "/assignments/:id/submit",
  protect,
  handleSubmissionUpload,
  processSubmissionUploads,
  submitAssignment
);
router.delete("/assignments/:id/submit", protect, unsubmitAssignment);
router.get("/assignments/submissions", protect, getMySubmissions);

export default router;
