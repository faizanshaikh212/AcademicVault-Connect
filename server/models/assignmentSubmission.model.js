import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    driveFileId: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    files: [fileSchema],
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["submitted", "graded"],
      default: "submitted",
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
    },
    gradedAt: {
      type: Date,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficiently querying submissions by assignment
assignmentSubmissionSchema.index({ assignment: 1, submittedAt: -1 });
// Index for finding student's submissions
assignmentSubmissionSchema.index({ student: 1, submittedAt: -1 });
// Compound index for finding unique student submissions per assignment
assignmentSubmissionSchema.index(
  { assignment: 1, student: 1 },
  { unique: true }
);

const AssignmentSubmission = mongoose.model(
  "AssignmentSubmission",
  assignmentSubmissionSchema
);

export default AssignmentSubmission;
