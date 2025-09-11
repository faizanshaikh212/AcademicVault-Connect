/**
 * Academic Notes Model
 * Schema for academic notes with Google Drive integration
 */

import mongoose from "mongoose";

const academicNoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Note description is required"],
      trim: true,
    },
    course: {
      type: String,
      required: [true, "Course is required"],
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      index: true,
    },
    semester: {
      type: String,
      trim: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        index: true,
      },
    ],

    // File information
    fileType: {
      type: String,
      required: true,
      // Allow external links to be represented as 'url'
      enum: ["pdf", "doc", "docx", "ppt", "pptx", "txt", "url"],
    },
    fileSize: {
      type: Number,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },

    // File storage information
    fileId: {
      type: String,
      required: true,
      unique: true,
    },
    publicUrl: {
      type: String,
      required: true,
    },
    downloadUrl: {
      type: String,
      required: true,
    },

    // Metadata
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isAdminUploaded: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Approved", "In for Review", "Disapproved"],
      default: "In for Review",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },

    // Analytics
    downloadCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },

    // Academic year
    academicYear: {
      type: String,
      required: true,
      index: true,
    },

    // Type classification
    type: {
      type: String,
      enum: ["Official", "Unofficial"],
      default: "Unofficial",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text search index
academicNoteSchema.index({
  title: "text",
  description: "text",
  course: "text",
  subject: "text",
  tags: "text",
});

// Compound indexes for efficient queries
academicNoteSchema.index({ course: 1, subject: 1, semester: 1 });
academicNoteSchema.index({ uploader: 1, createdAt: -1 });
academicNoteSchema.index({ isApproved: 1, createdAt: -1 });

// Methods
academicNoteSchema.methods.incrementDownloadCount = function () {
  this.downloadCount += 1;
  return this.save();
};

academicNoteSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

const AcademicNote = mongoose.model("AcademicNote", academicNoteSchema);

export default AcademicNote;
