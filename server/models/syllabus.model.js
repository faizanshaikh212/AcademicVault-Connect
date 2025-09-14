/**
 * Syllabus Model
 * Schema for course syllabus documents
 */

import mongoose from "mongoose";

const syllabusSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Syllabus title is required"],
      trim: true,
      index: true,
    },
    course: {
      type: String,
      required: [true, "Course is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      index: true,
    },
    semester: {
      type: String,
      trim: true,
      index: true,
    },
    degreeType: {
      type: String,
      enum: ["BE", "BSC", "PG", "Commerce", "Diploma", "Other"],
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
      // Support external links as 'url'
      enum: ["pdf", "doc", "docx", "url"],
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

    // Additional metadata
    credits: {
      type: Number,
    },
    duration: {
      type: String, // e.g., "3 months", "1 semester"
    },
    prerequisites: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Text search index
syllabusSchema.index({
  title: "text",
  course: "text",
  description: "text",
  tags: "text",
});

// Compound indexes for efficient queries
syllabusSchema.index({ course: 1, academicYear: -1, semester: 1 });
syllabusSchema.index({ uploader: 1, createdAt: -1 });
syllabusSchema.index({ isApproved: 1, createdAt: -1 });

// Methods
syllabusSchema.methods.incrementDownloadCount = function () {
  this.downloadCount += 1;
  return this.save();
};

syllabusSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

const Syllabus = mongoose.model("Syllabus", syllabusSchema);

export default Syllabus;
