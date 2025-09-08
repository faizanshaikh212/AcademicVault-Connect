import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import mongoose from "mongoose";

const isValidYear = (y) => Number.isInteger(y) && y > 1900 && y < 3000;

// List students (teachers only)
const listStudents = async (req, res) => {
  try {
    const students = await User.find({ role: { $in: ["student"] } }).select(
      "firstName lastName username email studentInfo profile premium updatedAt"
    );
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Assign course and academic year to a student
const assignCourseToStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, academicYearStart, academicYearEnd } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      return res.status(400).json({ message: "Invalid id" });
    }
    if (
      !isValidYear(academicYearStart) ||
      !isValidYear(academicYearEnd) ||
      academicYearEnd < academicYearStart
    ) {
      return res.status(400).json({ message: "Invalid academic year range" });
    }

    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ message: "Student not found" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Assign course and academic years, set assignedSemester based on current time
    const now = new Date();
    const currentSemester = computeSemesterFromAcademicYear(
      course.semesterCount || 0,
      academicYearStart,
      academicYearEnd,
      now
    );

    user.studentInfo = {
      assignedCourse: course._id,
      assignedSemester: currentSemester,
      academicYearStart,
      academicYearEnd,
    };

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Unassign course from student (clear fields)
const unassignCourseFromStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId))
      return res.status(400).json({ message: "Invalid student id" });
    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ message: "Student not found" });
    user.studentInfo = {
      assignedCourse: null,
      assignedSemester: null,
      academicYearStart: null,
      academicYearEnd: null,
    };
    await user.save();
    res.json({ message: "Unassigned" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Compute semester index based on academic years and real-time date
// We map quarters across years sequentially to semester numbers: each semester corresponds to one quarter (Q1->sem1, Q2->sem2, ...)
// Suppose academicYearStart=2023, academicYearEnd=2026, and course.semesterCount=6 -> total semesters=6 across the entire span.
// We'll compute an approximate mapping by splitting the span into semCount equal periods and determining which period 'now' falls into.
const computeSemesterFromAcademicYear = (
  semCount,
  startYear,
  endYear,
  nowDate
) => {
  if (!semCount || semCount <= 0) return null;
  const start = new Date(startYear, 6, 1); // mid-year start (July 1) to approximate academic year start
  const end = new Date(endYear, 6, 1);
  if (nowDate < start) return 0; // not started
  if (nowDate >= end) return null; // finished
  const totalMs = end - start;
  const perSemMs = totalMs / semCount;
  const idx = Math.floor((nowDate - start) / perSemMs) + 1; // 1-based semester
  return Math.min(Math.max(idx, 1), semCount);
};

export default {
  listStudents,
  assignCourseToStudent,
  unassignCourseFromStudent,
  computeSemesterFromAcademicYear,
};
