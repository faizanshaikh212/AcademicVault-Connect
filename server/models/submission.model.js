import mongoose from "mongoose";

const submissionAttachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    fileUrl: { type: String, required: true },
    driveFileId: { type: String },
    mimeType: { type: String },
    size: { type: Number },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
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
    attachments: [submissionAttachmentSchema],
    message: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },
    grade: { type: String },
    feedback: { type: String },
  },
  { timestamps: true }
);

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
