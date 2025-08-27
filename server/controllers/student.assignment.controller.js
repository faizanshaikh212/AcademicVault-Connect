import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";
import { uploadFile } from "../config/googleDrive.js";

// Get all assignments for a student's courses
export const getAllAssignments = async (req, res) => {
  try {
    const { courseId, semester } = req.query;
    const query = {
      status: "published",
      isDeleted: { $ne: true },
      "target.course": { $in: req.user.courses.map((c) => c.courseId) },
    };

    if (courseId) {
      query["target.course"] = courseId;
    }

    if (semester) {
      query["target.semesters"] = parseInt(semester);
    }

    const assignments = await Assignment.find(query)
      .populate("target.course", "name semester")
      .populate("createdBy", "firstName lastName username")
      .sort({ dueDate: 1 });

    // Get submissions for all assignments
    const submissions = await Submission.find({
      student: req.user._id,
      assignment: { $in: assignments.map((a) => a._id) },
    });

    const submissionsMap = new Map(
      submissions.map((s) => [s.assignment.toString(), s])
    );

    // Combine assignments with their submissions
    const assignmentsWithSubmissions = assignments.map((assignment) => ({
      ...assignment.toObject(),
      submission: submissionsMap.get(assignment._id.toString()),
    }));

    res.json(assignmentsWithSubmissions);
  } catch (error) {
    console.error("Failed to fetch assignments:", error);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
};

// Get a specific assignment
export const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      status: "published",
      isDeleted: { $ne: true },
    })
      .populate("target.course", "name semester")
      .populate("createdBy", "firstName lastName username");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Get student's submission if it exists
    const submission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });

    res.json({
      ...assignment.toObject(),
      submission,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch assignment" });
  }
};

// Submit an assignment
export const submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if assignment is past due date
    const isLate = new Date() > new Date(assignment.dueDate);

    // Upload files to Google Drive and create attachments array
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadFile(
          file.buffer,
          file.mimetype,
          file.originalname
        );
        attachments.push({
          filename: file.originalname,
          fileUrl: uploadResult.viewLink,
          driveFileId: uploadResult.fileId,
          mimeType: file.mimetype,
          size: file.size,
        });
      }
    }

    // Check if submission already exists
    let submission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });

    if (submission) {
      // Update existing submission
      submission.attachments = attachments;
      submission.isLate = isLate;
      submission.submittedAt = new Date();
    } else {
      // Create new submission
      submission = new Submission({
        assignment: assignment._id,
        student: req.user._id,
        attachments,
        isLate,
      });
    }

    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    console.error("Failed to submit assignment:", error);
    res.status(500).json({ message: "Failed to submit assignment" });
  }
};

// Unsubmit an assignment
export const unsubmitAssignment = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      assignment: req.params.id,
      student: req.user._id,
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Delete files from Google Drive
    for (const attachment of submission.attachments) {
      if (attachment.driveFileId) {
        try {
          await deleteFile(attachment.driveFileId);
        } catch (error) {
          console.error(`Failed to delete file ${attachment.filename}:`, error);
        }
      }
    }

    await submission.delete();
    res.json({ message: "Submission deleted" });
  } catch (error) {
    console.error("Failed to delete submission:", error);
    res.status(500).json({ message: "Failed to delete submission" });
  }
};

// Get all submissions for the current student
export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate({
        path: "assignment",
        select: "title dueDate points",
      })
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
};
