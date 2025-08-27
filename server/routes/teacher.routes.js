import express from "express";
import { body } from "express-validator";
import { protect } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/admin.middleware.js";
import {
  assignCourseToTeacher,
  getTeachers,
  getTeacherStats,
  getAllStudents,
  assignCourseToStudent,
  getTeacherCourses,
  getCourseRequests,
  handleCourseRequest,
  getStudentCourseDetails,
  updateStudentCourse,
} from "../controllers/teacher.controller.js";

const router = express.Router();

// Validation middleware for course assignment
const validateCourseAssignment = [
  body("teacherId").notEmpty().withMessage("Teacher ID is required"),
  body("courses").isArray().withMessage("Courses must be an array"),
  body("courses.*.course")
    .notEmpty()
    .withMessage("Course ID is required for each course"),
  body("courses.*.semesters")
    .isArray()
    .withMessage("Semesters must be an array")
    .custom((semesters) => {
      if (!semesters.every(Number.isInteger)) {
        throw new Error("All semester values must be integers");
      }
      return true;
    }),
];

// Get teacher dashboard stats
router.get("/stats", protect, getTeacherStats);

// Get all teachers
router.get("/teachers", protect, admin, getTeachers);

// Assign course to teacher
router.post(
  "/teachers/:teacherId/courses",
  protect,
  admin,
  assignCourseToTeacher
);

// Get teacher's courses
router.get("/courses", protect, async (req, res, next) => {
  console.log("Teacher courses route hit by:", req.user._id);
  return getTeacherCourses(req, res, next);
});

// Get all students for student management
router.get("/all-students", protect, getAllStudents);

// Assign a course to a student
router.post(
  "/assign-course",
  protect,
  [
    body("studentId")
      .notEmpty()
      .withMessage("Student ID is required")
      .isMongoId()
      .withMessage("Invalid student ID format"),
    body("courseId")
      .notEmpty()
      .withMessage("Course ID is required")
      .isMongoId()
      .withMessage("Invalid course ID format"),
  ],
  assignCourseToStudent
);

// Course request routes
router.get("/course-requests", protect, getCourseRequests);
router.put(
  "/course-requests/:requestId",
  protect,
  [
    body("status")
      .isIn(["approved", "rejected"])
      .withMessage("Status must be either approved or rejected"),
  ],
  handleCourseRequest
);

// Student course management routes
router.get(
  "/students/:studentId/courses/:courseId",
  protect,
  getStudentCourseDetails
);
router.put(
  "/students/:studentId/courses/:courseId",
  protect,
  [
    body("semester")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Semester must be a positive integer"),
    body("status")
      .optional()
      .isIn(["active", "completed", "dropped"])
      .withMessage("Invalid status"),
  ],
  updateStudentCourse
);

export default router;
