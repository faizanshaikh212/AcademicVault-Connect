import mongoose from "mongoose";
import Course from "../models/course.model.js";
import Semester from "../models/semester.model.js";
import Subject from "../models/subject.model.js";
import User from "../models/user.model.js";
import { shouldUseAdminPrivileges } from "../utils/roleUtils.js";

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
    // Get ALL courses with creator and sharedWith populated
    const allCourses = await Course.find()
      .populate('creator', 'firstName lastName username')
      .populate('sharedWith.user', 'firstName lastName username')
      .populate('sharedWith.grantedBy', 'firstName lastName username')
      .sort({ createdAt: -1 });

    // Add access control information to each course
    const coursesWithAccess = allCourses.map(course => {
      const courseObj = course.toObject();

      // Check if user is admin using role utilities
      const userRoles = req.user.role || []; // role is an array in the User model
      const isAdmin = shouldUseAdminPrivileges(userRoles);

      // Check if user is the creator
      const isCreator = course.creator && course.creator._id.toString() === req.user._id.toString();

      // Check if user has shared access (safely handle missing sharedWith field)
      let hasSharedAccess = false;
      try {
        if (courseObj.sharedWith && Array.isArray(courseObj.sharedWith)) {
          hasSharedAccess = courseObj.sharedWith.some(share => {
            const userId = share.user?._id || share.user;
            return userId && userId.toString() === req.user._id.toString();
          });
        }
      } catch (shareErr) {
        console.warn('Error checking shared access for course:', courseObj._id, shareErr.message);
        hasSharedAccess = false;
      }

      // If course has no creator, assign current user as creator
      if (!course.creator) {
        courseObj.creator = {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          username: req.user.username
        };
        // Update in database asynchronously
        Course.findByIdAndUpdate(course._id, { creator: req.user._id }).catch(console.error);
      }

      // Ensure sharedWith is an array (for backward compatibility)
      if (!courseObj.sharedWith) {
        courseObj.sharedWith = [];
      }

      // Add access control flags
      courseObj.userAccess = {
        canEdit: isAdmin || isCreator || hasSharedAccess,
        canDelete: isAdmin || isCreator, // Only owner/admin can delete
        canManage: isAdmin || isCreator || hasSharedAccess,
        canGrantAccess: isAdmin || isCreator, // Only owner/admin can grant access
        isOwner: isCreator,
        isAdmin: isAdmin,
        hasSharedAccess: hasSharedAccess
      };

      return courseObj;
    });

    res.json(coursesWithAccess);
  } catch (err) {
    console.error('Error in getCourses:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Not found" });

    // Check if user has permission to update (owner or admin)
    const userRoles = req.user.role || []; // role is an array in the User model
    const isAdmin = shouldUseAdminPrivileges(userRoles);
    const isOwner = course.creator && course.creator.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Not authorized" });
    }

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

    // Check if user has permission to delete (owner or admin)
    const userRoles = req.user.role || []; // role is an array in the User model
    const isAdmin = shouldUseAdminPrivileges(userRoles);
    const isOwner = course.creator && course.creator.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Not authorized" });
    }

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

    // Check if user has access to manage this course (admin, creator, or shared access)
    const userRoles = req.user.role || [];
    const isAdmin = shouldUseAdminPrivileges(userRoles);
    const isCreator = course.creator && course.creator.toString() === req.user._id.toString();

    // Check if user has shared access
    let hasSharedAccess = false;
    if (course.sharedWith && Array.isArray(course.sharedWith)) {
      hasSharedAccess = course.sharedWith.some(share => {
        const userId = share.user?._id || share.user;
        return userId && userId.toString() === req.user._id.toString();
      });
    }

    const hasAccess = isAdmin || isCreator || hasSharedAccess;
    if (!hasAccess) {
      return res.status(403).json({ message: "Not authorized to create semesters for this course" });
    }
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

    // First check if user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if user has access to this course (admin, creator, or shared access)
    const userRoles = req.user.role || [];
    const isAdmin = shouldUseAdminPrivileges(userRoles);
    const isCreator = course.creator && course.creator.toString() === req.user._id.toString();

    // Check if user has shared access
    let hasSharedAccess = false;
    if (course.sharedWith && Array.isArray(course.sharedWith)) {
      hasSharedAccess = course.sharedWith.some(share => {
        const userId = share.user?._id || share.user;
        return userId && userId.toString() === req.user._id.toString();
      });
    }

    const hasAccess = isAdmin || isCreator || hasSharedAccess || !course.creator; // Allow access if no creator set

    if (!hasAccess) {
      return res.status(403).json({ message: "Not authorized to view this course's semesters" });
    }

    // Get all semesters for this course
    let semesters = await Semester.find({ course: courseId }).sort({ createdAt: 1 });

    // Update semesters without creator to have course creator as creator
    if (semesters.length > 0) {
      await Semester.updateMany(
        {
          course: courseId,
          $or: [
            { creator: { $exists: false } },
            { creator: null }
          ]
        },
        { creator: course.creator || req.user._id }
      );
    }

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

    // Get the course to check permissions
    const course = await Course.findById(sem.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Check if user has permission to update (semester creator, course creator, or admin)
    const userRoles = req.user.role || [];
    const isAdmin = shouldUseAdminPrivileges(userRoles);
    const isSemesterCreator = isOwner(sem, req.user._id);
    const isCourseCreator = course.creator && course.creator.toString() === req.user._id.toString();

    if (!isAdmin && !isSemesterCreator && !isCourseCreator) {
      return res.status(403).json({ message: "Not authorized" });
    }

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

    // Get the course to check permissions
    const course = await Course.findById(sem.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Check if user has permission to delete (semester creator, course creator, or admin)
    const userRoles = req.user.role || [];
    const isAdmin = shouldUseAdminPrivileges(userRoles);
    const isSemesterCreator = isOwner(sem, req.user._id);
    const isCourseCreator = course.creator && course.creator.toString() === req.user._id.toString();

    if (!isAdmin && !isSemesterCreator && !isCourseCreator) {
      return res.status(403).json({ message: "Not authorized" });
    }

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

    // Check if user has access to the course
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Check if user has access to manage this course (admin, creator, or shared access)
    const userRoles = req.user.role || [];
    const isAdmin = shouldUseAdminPrivileges(userRoles);
    const isCreator = course.creator && course.creator.toString() === req.user._id.toString();

    // Check if user has shared access
    let hasSharedAccess = false;
    if (course.sharedWith && Array.isArray(course.sharedWith)) {
      hasSharedAccess = course.sharedWith.some(share => {
        const userId = share.user?._id || share.user;
        return userId && userId.toString() === req.user._id.toString();
      });
    }

    const hasAccess = isAdmin || isCreator || hasSharedAccess;
    if (!hasAccess) {
      return res.status(403).json({ message: "Not authorized to create subjects for this course" });
    }
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

    // Get the course to check permissions
    const course = await Course.findById(subject.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Check if user has access to manage this course (admin, creator, or shared access)
    const userRoles = req.user.role || [];
    const isAdmin = shouldUseAdminPrivileges(userRoles);
    const isCourseCreator = course.creator && course.creator.toString() === req.user._id.toString();
    const isSubjectCreator = isOwner(subject, req.user._id);

    // Check if user has shared access to the course
    let hasSharedAccess = false;
    if (course.sharedWith && Array.isArray(course.sharedWith)) {
      hasSharedAccess = course.sharedWith.some(share => {
        const userId = share.user?._id || share.user;
        return userId && userId.toString() === req.user._id.toString();
      });
    }

    const hasAccess = isAdmin || isCourseCreator || isSubjectCreator || hasSharedAccess;
    if (!hasAccess) {
      return res.status(403).json({ message: "Not authorized to delete this subject" });
    }

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

    // First get the semester to find the course
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: "Semester not found" });
    }

    // Then check if user has access to the course
    const course = await Course.findById(semester.course);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if user has access to this course (admin, creator, or shared access)
    const userRoles = req.user.role || [];
    const isAdmin = shouldUseAdminPrivileges(userRoles);
    const isCreator = course.creator && course.creator.toString() === req.user._id.toString();

    // Check if user has shared access
    let hasSharedAccess = false;
    if (course.sharedWith && Array.isArray(course.sharedWith)) {
      hasSharedAccess = course.sharedWith.some(share => {
        const userId = share.user?._id || share.user;
        return userId && userId.toString() === req.user._id.toString();
      });
    }

    const hasAccess = isAdmin || isCreator || hasSharedAccess || !course.creator;

    if (!hasAccess) {
      return res.status(403).json({ message: "Not authorized to view this semester's subjects" });
    }

    // Get all subjects for this semester
    const subjects = await Subject.find({ semester: semesterId }).sort({ createdAt: -1 });

    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Not found" });

    // Get the course to check permissions
    const course = await Course.findById(subject.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Check if user has access to manage this course (admin, creator, or shared access)
    const userRoles = req.user.role || [];
    const isAdmin = shouldUseAdminPrivileges(userRoles);
    const isCourseCreator = course.creator && course.creator.toString() === req.user._id.toString();
    const isSubjectCreator = isOwner(subject, req.user._id);

    // Check if user has shared access to the course
    let hasSharedAccess = false;
    if (course.sharedWith && Array.isArray(course.sharedWith)) {
      hasSharedAccess = course.sharedWith.some(share => {
        const userId = share.user?._id || share.user;
        return userId && userId.toString() === req.user._id.toString();
      });
    }

    const hasAccess = isAdmin || isCourseCreator || isSubjectCreator || hasSharedAccess;
    if (!hasAccess) {
      return res.status(403).json({ message: "Not authorized to update this subject" });
    }

    Object.assign(subject, req.body);
    await subject.save();
    res.json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Course Access Management
const getTeachersForAccess = async (req, res) => {
  try {
    // Find all users who have teacher role (can have other roles too)
    const teachers = await User.find({
      $or: [
        { role: "teacher" },
        { roles: { $in: ["teacher"] } }
      ]
    }).select('firstName lastName username email').sort({ firstName: 1, lastName: 1 });

    res.json(teachers);
  } catch (err) {
    console.error('Error in getTeachersForAccess:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const grantCourseAccess = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Validate courseId and userId are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if the user to be granted access exists
    const userToGrant = await User.findById(userId);
    if (!userToGrant) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has permission to grant access (owner or admin)
    const userRoles = req.user.role || [];
    const isAdmin = shouldUseAdminPrivileges(userRoles);
    const isOwner = course.creator && course.creator.toString() === req.user._id.toString();

    // Debug logging
    console.log('DEBUG grantCourseAccess:', {
      userId: req.user._id,
      userRoles,
      isAdmin,
      isOwner,
      courseCreator: course.creator,
      courseId
    });

    if (!isAdmin && !isOwner) {
      console.log('Access denied - user is neither admin nor owner');
      return res.status(403).json({
        message: "Not authorized to grant access to this course",
        debug: {
          userRoles,
          isAdmin,
          isOwner,
          courseCreator: course.creator?.toString(),
          currentUser: req.user._id.toString()
        }
      });
    }

    // Initialize sharedWith if it doesn't exist or is not an array
    if (!Array.isArray(course.sharedWith)) {
      course.sharedWith = [];
    }

    // Check if user already has access
    const existingAccess = course.sharedWith.find(share => {
      const shareUserId = share.user?._id || share.user;
      return shareUserId && shareUserId.toString() === userId.toString();
    });

    if (existingAccess) {
      return res.status(400).json({ message: "User already has access to this course" });
    }

    // Don't allow granting access to the course creator
    if (course.creator && course.creator.toString() === userId.toString()) {
      return res.status(400).json({ message: "Cannot grant access to course creator - they already own the course" });
    }

    // Add user to shared access
    course.sharedWith.push({
      user: userId,
      grantedBy: req.user._id,
      grantedAt: new Date()
    });

    await course.save();

    // Return updated course with populated shared users
    const updatedCourse = await Course.findById(courseId)
      .populate('creator', 'firstName lastName username')
      .populate('sharedWith.user', 'firstName lastName username')
      .populate('sharedWith.grantedBy', 'firstName lastName username');

    res.json(updatedCourse);
  } catch (err) {
    console.error('Error in grantCourseAccess:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const revokeCourseAccess = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Validate courseId and userId are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if user has permission to revoke access (owner or admin)
    const userRoles = req.user.role || [];
    const isAdmin = shouldUseAdminPrivileges(userRoles);
    const isOwner = course.creator && course.creator.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Not authorized to revoke access to this course" });
    }

    // Initialize sharedWith if it doesn't exist or is not an array
    if (!Array.isArray(course.sharedWith)) {
      course.sharedWith = [];
    }

    // Check if user actually has shared access to revoke
    const hasAccess = course.sharedWith.find(share => {
      const shareUserId = share.user?._id || share.user;
      return shareUserId && shareUserId.toString() === userId.toString();
    });

    if (!hasAccess) {
      return res.status(400).json({ message: "User does not have shared access to this course" });
    }

    // Remove user from shared access
    course.sharedWith = course.sharedWith.filter(share => {
      const shareUserId = share.user?._id || share.user;
      return !(shareUserId && shareUserId.toString() === userId.toString());
    });

    await course.save();

    // Return updated course with populated shared users
    const updatedCourse = await Course.findById(courseId)
      .populate('creator', 'firstName lastName username')
      .populate('sharedWith.user', 'firstName lastName username')
      .populate('sharedWith.grantedBy', 'firstName lastName username');

    res.json(updatedCourse);
  } catch (err) {
    console.error('Error in revokeCourseAccess:', err);
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
  getTeachersForAccess,
  grantCourseAccess,
  revokeCourseAccess,
};
