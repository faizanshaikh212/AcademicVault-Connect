import Assignment from "../models/assignment.model.js";
import Notice from "../models/notice.model.js";
import User from "../models/user.model.js";

export const getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const totalNotices = await Notice.countDocuments({
      createdBy: teacherId,
      isDeleted: { $ne: true },
    });
    const totalAssignments = await Assignment.countDocuments({
      createdBy: teacherId,
      isDeleted: { $ne: true },
    });
    // Count students in courses taught by this teacher
    const courseIds = (req.user?.teacherCourses || []).map((tc) => tc.course);
    const totalStudents = await User.countDocuments({
      role: { $in: ["student"] },
      "studentCourses.course": { $in: courseIds },
    });
    const assignedCourses = req.user?.teacherCourses?.length || 0;
    const activeAssignments = await Assignment.countDocuments({
      createdBy: teacherId,
      isDeleted: { $ne: true },
      dueDate: { $gte: new Date() },
    });
    const pendingSubmissions = 0; // can be implemented later
    const upcomingDeadlines = await Assignment.countDocuments({
      createdBy: teacherId,
      dueDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const courseRequests = 0; // placeholder

    res.json({
      totalNotices,
      totalAssignments,
      totalStudents,
      assignedCourses,
      activeAssignments,
      pendingSubmissions,
      upcomingDeadlines,
      courseRequests,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch teacher stats" });
  }
};
