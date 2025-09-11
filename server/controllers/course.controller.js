import mongoose from "mongoose";
import Course from "../models/course.model.js";
import Semester from "../models/semester.model.js";
import Subject from "../models/subject.model.js";

const isOwner = (doc, userId) =>
  doc && doc.creator && doc.creator.toString() === userId.toString();

// Courses
const normalizeType = (t) => {
  if (!t) return undefined;
  const s = String(t).trim();
  if (s === "COM" || s.toLowerCase() === "com") return "Commerce";
  if (s.toUpperCase() === "BE") return "BE";
  if (s.toUpperCase() === "BSC") return "BSC";
  if (s.toUpperCase() === "PG") return "PG";
  return s;
};

const createCourse = async (req, res) => {
  try {
    const { title, description, metadata, semesterCount } = req.body;
    // accept legacy fields 'type' or 'degreeType'
    const rawType = req.body.type || req.body.degreeType || req.body.category;
    const type = normalizeType(rawType);
    if (!title) return res.status(400).json({ message: "Title is required" });

    let semCount = 0;
    if (semesterCount !== undefined && semesterCount !== null) {
      semCount = parseInt(semesterCount, 10);
      if (isNaN(semCount) || semCount < 0 || semCount > 100) {
        return res.status(400).json({
          message: "semesterCount must be an integer between 0 and 100",
        });
      }
    }

    const course = await Course.create({
      title,
      description,
      metadata,
      semesterCount: semCount,
      creator: req.user._id,
      ...(type ? { type } : {}),
    });

    // if semesterCount provided, auto-create Semester documents
    let createdSemesters = [];
    if (semCount > 0) {
      const semDocs = [];
      for (let i = 1; i <= semCount; i++) {
        semDocs.push({
          title: `Semester ${i}`,
          course: course._id,
          description: `Auto-generated semester ${i}`,
          creator: req.user._id,
        });
      }
      // insertMany for performance
      createdSemesters = await Semester.insertMany(semDocs);
    }

    res.status(201).json({ course, semesters: createdSemesters });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// FIXED: Public endpoint for listing all courses (for question paper viewing)
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({
      createdAt: -1,
    });
    res.json({ success: true, data: courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ creator: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Not found" });
    if (!isOwner(course, req.user._id))
      return res.status(403).json({ message: "Not authorized" });
    // normalize incoming type/degreeType
    const rawType = req.body.type || req.body.degreeType || req.body.category;
    const type = normalizeType(rawType);
    if (type !== undefined) req.body.type = type;
    Object.assign(course, req.body);
    await course.save();
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid course id" });
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Not found" });
    if (!isOwner(course, req.user._id))
      return res.status(403).json({ message: "Not authorized" });
    // delete dependent resources
    await Subject.deleteMany({ course: course._id });
    await Semester.deleteMany({ course: course._id });
    // delete the course itself
    await Course.findByIdAndDelete(id);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Semesters
const createSemester = async (req, res) => {
  try {
    const { title, course: courseId, description } = req.body;
    if (!title || !courseId)
      return res.status(400).json({ message: "Title and course required" });
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user._id))
      return res.status(403).json({ message: "Not authorized" });
    const semester = await Semester.create({
      title,
      course: courseId,
      description,
      creator: req.user._id,
    });
    res.status(201).json(semester);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// FIXED: Public endpoint for getting semesters for a course (for question paper viewing)
const getAllSemestersForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if courseId is a valid ObjectId or if it's a course name/title
    let query = {};
    if (mongoose.Types.ObjectId.isValid(courseId)) {
      query = { course: courseId };
    } else {
      // Try to find course by name/title first
      const course = await Course.findOne({
        $or: [
          { title: { $regex: new RegExp(courseId, "i") } },
          { name: { $regex: new RegExp(courseId, "i") } },
        ],
      });
      if (course) {
        query = { course: course._id };
      } else {
        // Return empty array if course not found
        return res.json({ success: true, data: [] });
      }
    }

    const semesters = await Semester.find(query).sort({ createdAt: 1 });
    res.json({ success: true, data: semesters });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getSemestersForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const semesters = await Semester.find({
      course: courseId,
      creator: req.user._id,
    }).sort({ createdAt: 1 });
    res.json(semesters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateSemester = async (req, res) => {
  try {
    const sem = await Semester.findById(req.params.id);
    if (!sem) return res.status(404).json({ message: "Not found" });
    if (!isOwner(sem, req.user._id))
      return res.status(403).json({ message: "Not authorized" });
    Object.assign(sem, req.body);
    await sem.save();
    res.json(sem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteSemester = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid semester id" });
    const sem = await Semester.findById(id);
    if (!sem) return res.status(404).json({ message: "Not found" });
    if (!isOwner(sem, req.user._id))
      return res.status(403).json({ message: "Not authorized" });
    await Subject.deleteMany({ semester: sem._id });
    await Semester.findByIdAndDelete(id);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Subjects
const createSubject = async (req, res) => {
  try {
    const {
      title,
      code,
      semester: semId,
      course: courseId,
      description,
      credits,
    } = req.body;
    if (!title || !semId || !courseId)
      return res
        .status(400)
        .json({ message: "Title, semester and course required" });
    const sem = await Semester.findById(semId);
    if (!sem) return res.status(404).json({ message: "Semester not found" });
    if (!isOwner(sem, req.user._id))
      return res.status(403).json({ message: "Not authorized" });
    const subject = await Subject.create({
      title,
      code,
      semester: semId,
      course: courseId,
      description,
      credits,
      creator: req.user._id,
    });
    res.status(201).json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid subject id" });
    const subject = await Subject.findById(id);
    if (!subject) return res.status(404).json({ message: "Not found" });
    if (!isOwner(subject, req.user._id))
      return res.status(403).json({ message: "Not authorized" });
    await Subject.findByIdAndDelete(id);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// FIXED: Public endpoint for getting subjects for a semester (for question paper viewing)
const getAllSubjectsForSemester = async (req, res) => {
  try {
    const { semesterId } = req.params;

    // Check if semesterId is valid ObjectId or try to find by name
    let query = {};
    if (mongoose.Types.ObjectId.isValid(semesterId)) {
      query = { semester: semesterId };
    } else {
      // Try to find semester by name/title first
      const semester = await Semester.findOne({
        $or: [
          { title: { $regex: new RegExp(semesterId, "i") } },
          { name: { $regex: new RegExp(semesterId, "i") } },
        ],
      });
      if (semester) {
        query = { semester: semester._id };
      } else {
        // Return empty array if semester not found
        return res.json({ success: true, data: [] });
      }
    }

    const subjects = await Subject.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: subjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getSubjectsForSemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const subjects = await Subject.find({
      semester: semesterId,
      creator: req.user._id,
    }).sort({ createdAt: -1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Not found" });
    if (!isOwner(subject, req.user._id))
      return res.status(403).json({ message: "Not authorized" });
    Object.assign(subject, req.body);
    await subject.save();
    res.json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export default {
  createCourse,
  getAllCourses,
  getCourses,
  updateCourse,
  deleteCourse,
  createSemester,
  getAllSemestersForCourse,
  getSemestersForCourse,
  updateSemester,
  deleteSemester,
  createSubject,
  getAllSubjectsForSemester,
  getSubjectsForSemester,
  updateSubject,
  deleteSubject,
};
