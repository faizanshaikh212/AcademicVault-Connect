import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import teacher from "../middleware/teacher.middleware.js";
import courseController from "../controllers/course.controller.js";

const router = express.Router();

// Courses
router.post("/", protect, teacher, courseController.createCourse);
router.get("/", protect, teacher, courseController.getCourses);
router.put("/:id", protect, teacher, courseController.updateCourse);
router.delete("/:id", protect, teacher, courseController.deleteCourse);

// Semesters
router.post("/semesters", protect, teacher, courseController.createSemester);
router.get(
  "/semesters/course/:courseId",
  protect,
  teacher,
  courseController.getSemestersForCourse
);
router.put("/semesters/:id", protect, teacher, courseController.updateSemester);
router.delete(
  "/semesters/:id",
  protect,
  teacher,
  courseController.deleteSemester
);

// Subjects
router.post("/subjects", protect, teacher, courseController.createSubject);
router.get(
  "/subjects/semester/:semesterId",
  protect,
  teacher,
  courseController.getSubjectsForSemester
);
router.put("/subjects/:id", protect, teacher, courseController.updateSubject);
router.delete(
  "/subjects/:id",
  protect,
  teacher,
  courseController.deleteSubject
);

export default router;
