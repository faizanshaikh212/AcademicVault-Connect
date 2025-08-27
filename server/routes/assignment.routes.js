import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  listTeacherAssignments,
  createAssignment,
  getAssignment,
  deleteAssignment,
  listSubmissions,
  createSubmission,
  gradeSubmission,
} from "../controllers/assignment.controller.js";
import {
  handleAssignmentUpload,
  processAssignmentUploads,
  handleSubmissionUpload,
  processSubmissionUploads,
} from "../middleware/assignmentUpload.middleware.js";

const router = express.Router();

// Teacher assignment management
router.get("/teacher/assignments", protect, listTeacherAssignments);
router.post(
  "/teacher/assignments",
  protect,
  handleAssignmentUpload,
  processAssignmentUploads,
  createAssignment
);
router.get("/teacher/assignments/:id", protect, getAssignment);
router.delete("/teacher/assignments/:id", protect, deleteAssignment);

// Submissions
router.get(
  "/teacher/assignments/:assignmentId/submissions",
  protect,
  listSubmissions
);
router.post(
  "/teacher/assignments/:assignmentId/submissions",
  protect,
  handleSubmissionUpload,
  processSubmissionUploads,
  createSubmission
);
router.post(
  "/teacher/assignments/:assignmentId/submissions/:submissionId/grade",
  protect,
  gradeSubmission
);

export default router;
