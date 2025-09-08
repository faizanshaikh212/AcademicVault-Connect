import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import teacher from "../middleware/teacher.middleware.js";
import studentController from "../controllers/student.controller.js";

const router = express.Router();

router.get("/", protect, teacher, studentController.listStudents);
router.post(
  "/:studentId/assign",
  protect,
  teacher,
  studentController.assignCourseToStudent
);
router.post(
  "/:studentId/unassign",
  protect,
  teacher,
  studentController.unassignCourseFromStudent
);

export default router;
