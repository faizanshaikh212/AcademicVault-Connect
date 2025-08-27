import express from "express";
import { check } from "express-validator";
import * as courseController from "../controllers/course.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/admin.middleware.js";

const router = express.Router();

// Course input validation rules
const courseValidation = [
  check("name")
    .trim()
    .notEmpty()
    .withMessage("Course name is required")
    .isLength({ max: 100 })
    .withMessage("Course name cannot exceed 100 characters"),
  check("description")
    .trim()
    .notEmpty()
    .withMessage("Course description is required"),
  check("batch")
    .trim()
    .notEmpty()
    .withMessage("Batch is required")
    .matches(/^\d{4}-\d{4}$/)
    .withMessage("Batch must be in format YYYY-YYYY"),
  check("totalSemesters")
    .notEmpty()
    .withMessage("Total semesters is required")
    .isInt({ min: 1, max: 12 })
    .withMessage("Total semesters must be between 1 and 12")
    .custom((value) => {
      if (isNaN(value)) {
        throw new Error("Total semesters must be a number");
      }
      return true;
    }),
];

// Routes
router
  .route("/")
  .post(protect, admin, courseValidation, courseController.createCourse)
  .get(protect, courseController.getCourses);

router
  .route("/:id")
  .get(protect, courseController.getCourseById)
  .put(protect, admin, courseValidation, courseController.updateCourse)
  .delete(protect, admin, courseController.deleteCourse);

export default router;
