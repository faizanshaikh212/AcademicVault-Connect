import { validationResult } from "express-validator";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import Notice from "../models/notice.model.js";
import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";
import CourseRequest from "../models/courseRequest.model.js";

/**
 * @desc    Assign course to teacher
 * @route   POST /api/admin/assign-course
 * @access  Admin only
 */
export const assignCourseToTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { courseId, semesters } = req.body;

    if (!courseId || !Array.isArray(semesters) || semesters.length === 0) {
      return res.status(400).json({
        message: "Course ID and semesters array are required",
      });
    }

    // Fetch teacher and course
    const teacher = await User.findOne({ _id: teacherId, role: "teacher" });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Validate semester numbers
    const invalidSemesters = semesters.filter(
      (sem) => sem < 1 || sem > course.totalSemesters
    );
    if (invalidSemesters.length > 0) {
      return res.status(400).json({
        message: `Invalid semesters: ${invalidSemesters.join(", ")}`,
      });
    }

    // Check if course is already assigned
    const existingCourse = teacher.teacherCourses?.find(
      (tc) => tc.course.toString() === courseId
    );

    if (existingCourse) {
      // Update semesters for existing course
      existingCourse.semesters = [
        ...new Set([...existingCourse.semesters, ...semesters]),
      ];
    } else {
      // Add new course
      if (!teacher.teacherCourses) {
        teacher.teacherCourses = [];
      }
      teacher.teacherCourses.push({
        course: courseId,
        semesters: semesters,
      });
    }

    await teacher.save();

    // Return updated teacher with populated courses
    const updatedTeacher = await User.findById(teacherId)
      .select("_id firstName lastName email username teacherCourses")
      .populate({
        path: "teacherCourses.course",
        select: "_id name batch totalSemesters",
      });

    res.json(updatedTeacher);
  } catch (error) {
    console.error("Error in assignCourseToTeacher:", error);
    res.status(500).json({ message: "Failed to assign course" });
  }
};

/**
 * @desc    Get all teachers
 * @route   GET /api/admin/teachers
 * @access  Admin only
 */
export const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" })
      .select("_id firstName lastName email username teacherCourses")
      .populate({
        path: "teacherCourses.course",
        select: "_id name batch totalSemesters",
      });

    res.json(teachers);
  } catch (error) {
    console.error("Error in getTeachers:", error);
    res.status(500).json({ message: "Failed to fetch teachers" });
  }
};

/**
 * @desc    Get students enrolled in teacher's courses
 * @route   GET /api/teacher/students
 * @access  Teachers only
 */
export const getTeacherStudents = async (req, res) => {
  try {
    // Get courses assigned to this teacher
    const teacher = await User.findById(req.user._id).populate(
      "teacherCourses.course"
    );
    if (
      !teacher ||
      !teacher.teacherCourses ||
      teacher.teacherCourses.length === 0
    ) {
      return res.json([]);
    }

    // Get all students enrolled in the teacher's courses
    const courseIds = teacher.teacherCourses.map((tc) => tc.course._id);
    const students = await User.find({
      "studentCourses.course": { $in: courseIds },
      role: { $in: ["student"] },
    })
      .populate("studentCourses.course")
      .select("-password -settings -premium");

    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

/**
 * @desc    Get all students (for student management)
 * @route   GET /api/teacher/all-students
 * @access  Teachers only
 */
export const getAllStudents = async (req, res) => {
  try {
    // First get the teacher's courses
    const teacher = await User.findById(req.user._id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Get the course IDs this teacher is assigned to
    const teacherCourseIds = teacher.teacherCourses.map((tc) =>
      tc.course.toString()
    );

    // Find students who are enrolled in any of the teacher's courses
    const students = await User.find({
      role: "student",
      "studentCourses.course": { $in: teacherCourseIds },
    })
      .select("firstName lastName username email studentCourses")
      .populate({
        path: "studentCourses.course",
        select: "name batch totalSemesters",
      })
      .lean();

    console.log(
      `Found ${students.length} students for teacher courses:`,
      teacherCourseIds
    );
    res.json(students);
  } catch (error) {
    console.error("Error in getAllStudents:", error);
    res.status(500).json({ message: "Failed to fetch all students" });
  }
};

/**
 * @desc    Assign a course to a student
 * @route   POST /api/teacher/assign-course
 * @access  Teachers only
 */
export const assignCourseToStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, courseId } = req.body;

    // Verify student exists
    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get the course and verify it exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Get teacher and verify the course is assigned to them
    const teacher = await User.findById(req.user._id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const hasPermission = teacher.teacherCourses.some(
      (tc) => tc.course.toString() === courseId
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: "You are not authorized to assign this course",
      });
    }

    // Check if student is already enrolled in this course
    const isEnrolled = student.studentCourses.some(
      (sc) => sc.course.toString() === courseId
    );

    if (isEnrolled) {
      return res.status(400).json({
        message: "Student is already enrolled in this course",
      });
    }

    // Add the course to student's courses
    const newCourseEnrollment = {
      course: courseId,
      semester: 1,
      status: "active",
    };

    student.studentCourses.push(newCourseEnrollment);
    await student.save();

    // Get the updated student data with populated courses
    const updatedStudent = await User.findById(studentId)
      .populate("studentCourses.course")
      .select("firstName lastName email studentCourses");

    const newCourse = updatedStudent.studentCourses.find(
      (sc) => sc.course._id.toString() === courseId
    );

    res.status(200).json({
      message: "Course assigned successfully",
      newCourse,
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error in assignCourseToStudent:", error);
    res.status(500).json({ message: "Failed to assign course" });
  }
};

/**
 * @desc    Get teacher's assigned courses
 * @route   GET /api/teacher/courses
 * @access  Teachers only
 */
export const getTeacherCourses = async (req, res) => {
  try {
    console.log("Getting courses for teacher:", req.user._id);

    const teacher = await User.findById(req.user._id);

    if (!teacher) {
      console.log("Teacher not found");
      return res.status(404).json({ message: "Teacher not found" });
    }

    console.log("Teacher found:", teacher.firstName, teacher.lastName);
    console.log("Raw teacherCourses:", teacher.teacherCourses);

    // Fetch all courses assigned to this teacher
    const teacherWithCourses = await User.findById(req.user._id)
      .populate({
        path: "teacherCourses.course",
        model: "Course",
        select: "name batch totalSemesters",
      })
      .select("teacherCourses");

    if (
      !teacherWithCourses.teacherCourses ||
      teacherWithCourses.teacherCourses.length === 0
    ) {
      console.log("No courses found for teacher");
      return res.json({ teacherCourses: [] });
    }

    // Format the response
    const formattedCourses = teacherWithCourses.teacherCourses
      .filter((tc) => tc.course) // Filter out any null courses
      .map((tc) => ({
        _id: tc.course._id,
        name: tc.course.name,
        batch: tc.course.batch,
        totalSemesters: tc.course.totalSemesters,
        semesters: tc.semesters || [],
      }));

    console.log("Formatted courses:", formattedCourses);

    // Send the courses array directly
    res.json(formattedCourses);
  } catch (error) {
    console.error("Error in getTeacherCourses:", error);
    res.status(500).json({ message: "Failed to fetch teacher courses" });
  }
};

/**
 * @desc    Get stats for teacher dashboard
 * @route   GET /api/teacher/stats
 * @access  Teachers only
 */
/**
 * @desc    Get course requests for teacher
 * @route   GET /api/teacher/course-requests
 * @access  Teachers only
 */
export const getCourseRequests = async (req, res) => {
  try {
    const requests = await CourseRequest.find({ teacher: req.user._id })
      .populate("student", "firstName lastName email username")
      .populate("course", "name batch")
      .sort("-createdAt");

    res.json(requests);
  } catch (error) {
    console.error("Error in getCourseRequests:", error);
    res.status(500).json({ message: "Failed to fetch course requests" });
  }
};

/**
 * @desc    Handle course request (approve/reject)
 * @route   PUT /api/teacher/course-requests/:requestId
 * @access  Teachers only
 */

export const updateStudentCourse = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const { semester, status } = req.body;

    // Verify teacher has access to this course
    const teacher = await User.findById(req.user._id);
    const teacherCourse = teacher.teacherCourses.find(
      (tc) => tc.course.toString() === courseId
    );

    if (!teacherCourse) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this course" });
    }

    // Verify semester is valid for this course
    if (semester) {
      const course = await Course.findById(courseId);
      if (semester < 1 || semester > course.totalSemesters) {
        return res.status(400).json({ message: "Invalid semester number" });
      }
    }

    // Update student's course
    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const courseIndex = student.studentCourses.findIndex(
      (sc) => sc.course.toString() === courseId
    );

    if (courseIndex === -1) {
      return res
        .status(404)
        .json({ message: "Course not found for this student" });
    }

    // Update the course details
    if (semester) student.studentCourses[courseIndex].semester = semester;
    if (status) student.studentCourses[courseIndex].status = status;

    await student.save();

    // Return updated course details
    const updatedStudent = await User.findById(studentId).populate({
      path: "studentCourses.course",
      select: "name batch totalSemesters",
    });

    const updatedCourse = updatedStudent.studentCourses.find(
      (sc) => sc.course._id.toString() === courseId
    );

    res.json(updatedCourse);
  } catch (error) {
    console.error("Error in updateStudentCourse:", error);
    res.status(500).json({ message: "Failed to update course" });
  }
};

export const handleCourseRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, message } = req.body;

    const request = await CourseRequest.findOne({
      _id: requestId,
      teacher: req.user._id,
    });

    if (!request) {
      return res.status(404).json({ message: "Course request not found" });
    }

    request.status = status;
    if (message) request.message = message;

    // If approved, assign the course to the student
    if (status === "approved") {
      const student = await User.findById(request.student);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Check if student already has the course
      const existingCourse = student.studentCourses.find(
        (sc) => sc.course.toString() === request.course.toString()
      );

      if (!existingCourse) {
        student.studentCourses.push({
          course: request.course,
          semester: 1,
          status: "active",
        });
        await student.save();
      }
    }

    await request.save();

    res.json({
      message: `Course request ${status}`,
      request: await request
        .populate("student", "firstName lastName email username")
        .populate("course", "name batch")
        .execPopulate(),
    });
  } catch (error) {
    console.error("Error in handleCourseRequest:", error);
    res.status(500).json({ message: "Failed to handle course request" });
  }
};

/**
 * @desc    Get student course details
 * @route   GET /api/teacher/students/:studentId/courses/:courseId
 * @access  Teachers only
 */
export const getStudentCourseDetails = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    // Verify teacher has access to this course
    const teacher = await User.findById(req.user._id);
    const hasAccess = teacher.teacherCourses.some(
      (tc) => tc.course.toString() === courseId
    );

    if (!hasAccess) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this course" });
    }

    // Get student with course details
    const student = await User.findOne({
      _id: studentId,
      role: "student",
    }).populate({
      path: "studentCourses.course",
      select: "name batch totalSemesters",
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find the specific course
    const courseDetails = student.studentCourses.find(
      (sc) => sc.course._id.toString() === courseId
    );

    if (!courseDetails) {
      return res
        .status(404)
        .json({ message: "Course not found for this student" });
    }

    res.json(courseDetails);
  } catch (error) {
    console.error("Error in getStudentCourseDetails:", error);
    res.status(500).json({ message: "Failed to fetch course details" });
  }
};

export const getTeacherStats = async (req, res) => {
  try {
    // Get teacher's assigned courses
    const teacher = await User.findById(req.user._id).populate(
      "teacherCourses.course"
    );
    const teacherCourseIds =
      teacher.teacherCourses?.map((tc) => tc.course._id) || [];
    const currentDate = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Get all stats in parallel
    const [notices, assignments, students, submissions] = await Promise.all([
      // Total notices by this teacher
      Notice.countDocuments({ createdBy: req.user._id }),

      // Total and active assignments
      Assignment.aggregate([
        { $match: { createdBy: req.user._id } },
        {
          $facet: {
            total: [{ $count: "total" }],
            active: [
              {
                $match: {
                  dueDate: { $gte: currentDate },
                },
              },
              { $count: "active" },
            ],
            upcoming: [
              {
                $match: {
                  dueDate: {
                    $gte: currentDate,
                    $lte: nextWeek,
                  },
                },
              },
              { $count: "upcoming" },
            ],
          },
        },
      ]),

      // Total students in teacher's courses
      User.countDocuments({
        role: { $in: ["student"] },
        "studentCourses.course": { $in: teacherCourseIds },
      }),

      // Pending submissions count
      Submission.countDocuments({
        assignment: {
          $in: await Assignment.find({ createdBy: req.user._id }).distinct(
            "_id"
          ),
        },
        grade: null, // Ungraded submissions
      }),
    ]);

    // Get assignment stats
    const assignmentStats = assignments[0] || {
      total: [{ total: 0 }],
      active: [{ active: 0 }],
      upcoming: [{ upcoming: 0 }],
    };

    const stats = {
      totalNotices: notices || 0,
      totalAssignments: assignmentStats.total[0]?.total || 0,
      totalStudents: students || 0,
      assignedCourses: teacherCourseIds.length || 0,
      activeAssignments: assignmentStats.active[0]?.active || 0,
      pendingSubmissions: submissions || 0,
      upcomingDeadlines: assignmentStats.upcoming[0]?.upcoming || 0,
      courseRequests: 0, // Course requests feature not implemented yet
    };

    res.json(stats);
  } catch (error) {
    console.error("Error in getTeacherStats:", error);
    res.status(500).json({ message: "Failed to fetch teacher stats" });
  }
};
