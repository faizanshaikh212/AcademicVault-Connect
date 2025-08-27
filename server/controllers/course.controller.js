import Course from "../models/course.model.js";
import { validationResult } from "express-validator";

/**
 * @desc    Create a new course
 * @route   POST /api/courses
 * @access  Admin only
 */
export const createCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, batch, totalSemesters } = req.body;

    // Check if course with same name and batch exists
    const existingCourse = await Course.findOne({ name, batch });
    if (existingCourse) {
      return res.status(400).json({
        message: "A course with this name and batch already exists",
      });
    }

    const course = new Course({
      name,
      description,
      batch,
      totalSemesters,
      createdBy: req.user._id,
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error("Error in createCourse:", error);
    res.status(500).json({ message: "Failed to create course" });
  }
};

/**
 * @desc    Get all courses
 * @route   GET /api/courses
 * @access  Admin, Teacher
 */
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "firstName lastName");

    res.json(courses);
  } catch (error) {
    console.error("Error in getCourses:", error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};

/**
 * @desc    Get course by ID
 * @route   GET /api/courses/:id
 * @access  Admin, Teacher
 */
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName"
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error in getCourseById:", error);
    res.status(500).json({ message: "Failed to fetch course" });
  }
};

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Admin only
 */
export const updateCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, batch, totalSemesters } = req.body;

    // Check if another course with same name and batch exists
    const existingCourse = await Course.findOne({
      name,
      batch,
      _id: { $ne: req.params.id },
    });

    if (existingCourse) {
      return res.status(400).json({
        message: "Another course with this name and batch already exists",
      });
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { name, description, batch, totalSemesters },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error in updateCourse:", error);
    res.status(500).json({ message: "Failed to update course" });
  }
};

/**
 * @desc    Delete course
 * @route   DELETE /api/courses/:id
 * @access  Admin only
 */
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCourse:", error);
    res.status(500).json({ message: "Failed to delete course" });
  }
};
