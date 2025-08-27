import Assignment from "../models/assignment.model.js";
import AssignmentSubmission from "../models/assignmentSubmission.model.js";
import {
  uploadFile as uploadFileToGoogleDrive,
  deleteFile as deleteFileFromGoogleDrive,
} from "../config/googleDrive.js";
import logger from "../utils/logger.js";

const handleError = (res, error) => {
  logger.error("Assignment controller error:", error);
  return res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? error : undefined,
  });
};

export const createAssignment = async (req, res) => {
  try {
    logger.info("Creating new assignment - Request body:", {
      body: req.body,
      attachments: req.body.attachments,
      user: req.user?._id,
    });

    // Validate required fields
    if (
      !req.body.title ||
      !req.body.description ||
      !req.body.dueDate ||
      !req.body.target
    ) {
      logger.error("Missing required fields:", {
        title: !!req.body.title,
        description: !!req.body.description,
        dueDate: !!req.body.dueDate,
        target: !!req.body.target,
      });
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Create base assignment data
    const assignmentData = {
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
      lateSubmissionAppealEmail: req.body.lateSubmissionAppealEmail,
      points: Number(req.body.points) || 0,
      target:
        typeof req.body.target === "string"
          ? JSON.parse(req.body.target)
          : req.body.target,
      createdBy: req.user._id,
      attachments: Array.isArray(req.body.attachments)
        ? req.body.attachments
        : [],
    };

    logger.info("Processed assignment data:", assignmentData);

    const assignment = new Assignment(assignmentData);
    await assignment.save();
    await assignment.populate("createdBy", "firstName lastName username");

    logger.info("Assignment created successfully", {
      assignmentId: assignment._id,
      title: assignment.title,
      target: assignment.target,
    });

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const listTeacherAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      createdBy: req.user._id,
      isDeleted: false,
    })
      .populate("createdBy", "firstName lastName username")
      .populate("target.course", "name batch")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("createdBy", "firstName lastName username")
      .populate("target.course", "name batch");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    return res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Parse target if it's a string
    if (typeof updates.target === "string") {
      updates.target = JSON.parse(updates.target);
    }

    // Handle file updates if any
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const uploadResult = await uploadFileToGoogleDrive(file);
        return {
          filename: file.originalname,
          fileUrl: uploadResult.webViewLink,
          driveFileId: uploadResult.id,
          mimeType: file.mimetype,
          size: file.size,
        };
      });

      updates.attachments = await Promise.all(uploadPromises);
    }

    const assignment = await Assignment.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id,
        isDeleted: false,
      },
      updates,
      { new: true }
    )
      .populate("createdBy", "firstName lastName username")
      .populate("target.course", "name batch");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    return res.json({
      success: true,
      message: "Assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id,
        isDeleted: false,
      },
      { isDeleted: true },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Delete files from Google Drive if any
    if (assignment.attachments && assignment.attachments.length > 0) {
      const deletePromises = assignment.attachments.map((attachment) =>
        deleteFileFromGoogleDrive(attachment.driveFileId)
      );
      await Promise.all(deletePromises);
    }

    return res.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getStudentAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      isDeleted: false,
      dueDate: { $gte: new Date() },
    })
      .populate("createdBy", "firstName lastName username")
      .populate("target.course", "name batch")
      .sort({ dueDate: 1 });

    return res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const listSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await AssignmentSubmission.find({
      assignment: assignmentId,
    })
      .populate("student", "firstName lastName username")
      .sort({ submittedAt: -1 });

    return res.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const createSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user._id;

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      isDeleted: false,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (new Date() > assignment.dueDate) {
      return res.status(400).json({
        success: false,
        message: "Assignment submission deadline has passed",
      });
    }

    // Handle file uploads
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      const uploadResult = await uploadFileToGoogleDrive(
        file.buffer,
        file.mimetype,
        file.originalname
      );
      return {
        filename: file.originalname,
        fileUrl: uploadResult.viewLink,
        driveFileId: uploadResult.fileId,
        mimeType: file.mimetype,
        size: file.size,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    // Create submission record
    const submission = await AssignmentSubmission.create({
      assignment: assignmentId,
      student: studentId,
      files: uploadedFiles,
      submittedAt: new Date(),
      status: "submitted",
    });

    await submission.populate("student", "firstName lastName username");

    return res.json({
      success: true,
      message: "Assignment submitted successfully",
      data: submission,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { grade, feedback } = req.body;

    // Verify the assignment exists and user has permission
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      createdBy: req.user._id,
      isDeleted: false,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message:
          "Assignment not found or you don't have permission to grade it",
      });
    }

    // Update the submission with grade and feedback
    const submission = await AssignmentSubmission.findOneAndUpdate(
      { _id: submissionId, assignment: assignmentId },
      {
        grade,
        feedback,
        status: "graded",
        gradedAt: new Date(),
        gradedBy: req.user._id,
      },
      { new: true }
    ).populate("student", "firstName lastName username");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    return res.json({
      success: true,
      message: "Submission graded successfully",
      data: submission,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
