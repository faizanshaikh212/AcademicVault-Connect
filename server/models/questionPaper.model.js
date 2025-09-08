/**
 * Question Papers Model Module
 * Defines the schema for question papers with academic categorization
 * @module models/questionPapers
 */

import mongoose from "mongoose";

/**
 * Question Papers Schema
 * Comprehensive question papers model with degree-based organization
 */
const questionPaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      index: true,
    },

    // Academic categorization
    degreeType: {
      type: String,
      enum: ["BE", "BSC", "PG", "Commerce"],
      index: true,
    },
    course: {
      type: String,
      required: [true, "Course is required"],
      trim: true,
      index: true,
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      index: true,
    },
    // Optional month and year fields (month is human-readable, year duplicates examYear for compatibility)
    month: {
      type: String,
      trim: true,
      index: true,
    },
    year: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 1,
      index: true,
    },
    examYear: {
      type: Number,
      required: [true, "Exam year is required"],
      min: 2000,
      max: new Date().getFullYear() + 1,
      index: true,
    },
    examType: {
      type: String,
      enum: ["Mid-term", "Final", "Supplementary", "Model", "Internal"],
      default: "Final",
      index: true,
    },

    // Additional metadata
    description: {
      type: String,
      trim: true,
    },
    duration: {
      type: String, // e.g., "3 hours"
      trim: true,
    },
    maxMarks: {
      type: Number,
      min: 0,
    },
    instructions: {
      type: String,
      trim: true,
    },

    // File information
    fileType: {
      type: String,
      required: [true, "File type is required"],
      // Allow external links (represented as 'url')
      enum: ["pdf", "doc", "docx", "jpg", "jpeg", "png", "url"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },
    originalFileName: {
      type: String,
      required: [true, "Original file name is required"],
    },

    // File storage information
    fileId: {
      type: String,
      required: [true, "File ID is required"],
      unique: true,
    },
    publicUrl: {
      type: String,
      required: [true, "Public URL is required"],
    },
    downloadUrl: {
      type: String,
      required: [true, "Download URL is required"],
    },

    // Metadata
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader is required"],
      index: true,
    },
    isAdminUploaded: {
      type: Boolean,
      default: false,
      index: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },

    // Analytics
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    // Tags for additional categorization
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for better query performance
questionPaperSchema.index({ degreeType: 1, course: 1, semester: 1 });
questionPaperSchema.index({ examYear: 1, degreeType: 1, course: 1 });
questionPaperSchema.index({ subject: 1, examType: 1, examYear: 1 });
questionPaperSchema.index({ uploader: 1, status: 1 });
questionPaperSchema.index({ isApproved: 1, isAdminUploaded: 1 });

// Text search index
questionPaperSchema.index({
  title: "text",
  course: "text",
  subject: "text",
  description: "text",
});

// Virtual for formatted file size
questionPaperSchema.virtual("formattedFileSize").get(function () {
  const bytes = this.fileSize;
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
});

// Virtual for full academic info
questionPaperSchema.virtual("academicInfo").get(function () {
  return `${this.degreeType} - ${this.course} - Semester ${this.semester}`;
});

// Methods
questionPaperSchema.methods.incrementDownloadCount = function () {
  this.downloadCount += 1;
  return this.save();
};

questionPaperSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

questionPaperSchema.methods.approve = function (approvedBy) {
  this.status = "approved";
  this.isApproved = true;
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.rejectionReason = undefined;
  return this.save();
};

questionPaperSchema.methods.reject = function (rejectionReason) {
  this.status = "rejected";
  this.isApproved = false;
  this.rejectionReason = rejectionReason;
  this.approvedBy = undefined;
  this.approvedAt = undefined;
  return this.save();
};

// Static methods
questionPaperSchema.statics.findByCategory = function (
  degreeType,
  course = null,
  semester = null
) {
  const query = { degreeType, status: "approved" };
  if (course) query.course = course;
  if (semester) query.semester = semester;

  return this.find(query)
    .populate("uploader", "firstName lastName username")
    .sort({ examYear: -1, createdAt: -1 });
};

questionPaperSchema.statics.findByUploader = function (uploaderId) {
  return this.find({ uploader: uploaderId }).populate(
    "uploader",
    "firstName lastName username"
  );
};

questionPaperSchema.statics.findPending = function () {
  return this.find({ status: "pending" }).populate(
    "uploader",
    "firstName lastName username"
  );
};

questionPaperSchema.statics.searchQuestionPapers = function (
  searchTerm,
  filters = {}
) {
  const query = { status: "approved" };

  // Add text search if search term provided
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  // Add filters
  if (filters.degreeType) query.degreeType = filters.degreeType;
  if (filters.course) query.course = new RegExp(filters.course, "i");
  if (filters.semester) query.semester = filters.semester;
  if (filters.subject) query.subject = new RegExp(filters.subject, "i");
  if (filters.examYear) query.examYear = filters.examYear;
  if (filters.examType) query.examType = filters.examType;
  if (filters.uploader) query.uploader = filters.uploader;

  return this.find(query)
    .populate("uploader", "firstName lastName username")
    .sort(
      searchTerm
        ? { score: { $meta: "textScore" } }
        : { examYear: -1, createdAt: -1 }
    );
};

questionPaperSchema.statics.getAvailableCourses = function (degreeType) {
  return this.distinct("course", { degreeType, status: "approved" });
};

questionPaperSchema.statics.getAvailableSemesters = function (
  degreeType,
  course
) {
  return this.distinct("semester", { degreeType, course, status: "approved" });
};

questionPaperSchema.statics.getExamYears = function (
  degreeType,
  course,
  semester
) {
  return this.distinct("examYear", {
    degreeType,
    course,
    semester,
    status: "approved",
  });
};

// Pre-save middleware
questionPaperSchema.pre("save", function (next) {
  // Auto-approve admin uploads
  if (this.isAdminUploaded && this.isNew) {
    this.status = "approved";
    this.isApproved = true;
    this.approvedAt = new Date();
  }
  next();
});

// Ensure virtual fields are serialized
questionPaperSchema.set("toJSON", { virtuals: true });
questionPaperSchema.set("toObject", { virtuals: true });

const QuestionPaper = mongoose.model("QuestionPaper", questionPaperSchema);

export default QuestionPaper;
