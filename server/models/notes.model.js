/**
 * Academic Notes Model Module
 * Defines the schema for academic notes with Google Drive integration
 * @module models/notes
 */

import mongoose from "mongoose";

/**
 * Academic Notes Schema
 * Comprehensive notes model with Google Drive file storage and academic categorization
 */
const notesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notes title is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Notes description is required"],
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
      required: [true, "File type is required"],
      enum: ["pdf", "doc", "docx", "ppt", "pptx", "txt"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },
    originalFileName: {
      type: String,
      required: [true, "Original file name is required"],
    },

    // Google Drive integration
    googleDriveFileId: {
      type: String,
      required: [true, "Google Drive file ID is required"],
      unique: true,
    },
    publicUrl: {
      type: String,
      required: [true, "Public URL is required"],
    },
    embedUrl: {
      type: String,
      required: [true, "Embed URL is required"],
    },
    downloadUrl: {
      type: String,
      required: [true, "Download URL is required"],
    },
    directUrl: {
      type: String,
      required: [true, "Direct URL is required"],
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

    // Academic year
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      index: true,
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for better query performance
notesSchema.index({ course: 1, subject: 1, semester: 1 });
notesSchema.index({ academicYear: 1, course: 1 });
notesSchema.index({ uploader: 1, status: 1 });
notesSchema.index({ isApproved: 1, isAdminUploaded: 1 });

// Text search index for full-text search
notesSchema.index({
  title: "text",
  description: "text",
  course: "text",
  subject: "text",
  tags: "text",
});

// Virtual for formatted file size
notesSchema.virtual("formattedFileSize").get(function () {
  const bytes = this.fileSize;
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
});

// Virtual for uploader name
notesSchema.virtual("uploaderName", {
  ref: "User",
  localField: "uploader",
  foreignField: "_id",
  justOne: true,
});

// Methods
notesSchema.methods.incrementDownloadCount = function () {
  this.downloadCount += 1;
  return this.save();
};

notesSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

notesSchema.methods.approve = function (approvedBy) {
  this.status = "approved";
  this.isApproved = true;
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.rejectionReason = undefined;
  return this.save();
};

notesSchema.methods.reject = function (rejectionReason) {
  this.status = "rejected";
  this.isApproved = false;
  this.rejectionReason = rejectionReason;
  this.approvedBy = undefined;
  this.approvedAt = undefined;
  return this.save();
};

// Static methods
notesSchema.statics.findByUploader = function (uploaderId) {
  return this.find({ uploader: uploaderId }).populate("uploader", "firstName lastName username");
};

notesSchema.statics.findPending = function () {
  return this.find({ status: "pending" }).populate("uploader", "firstName lastName username");
};

notesSchema.statics.findApproved = function () {
  return this.find({ status: "approved" }).populate("uploader", "firstName lastName username");
};

notesSchema.statics.searchNotes = function (searchTerm, filters = {}) {
  const query = { status: "approved" };

  // Add text search if search term provided
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  // Add filters
  if (filters.course) query.course = new RegExp(filters.course, "i");
  if (filters.subject) query.subject = new RegExp(filters.subject, "i");
  if (filters.semester) query.semester = filters.semester;
  if (filters.academicYear) query.academicYear = filters.academicYear;
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  if (filters.uploader) query.uploader = filters.uploader;

  return this.find(query)
    .populate("uploader", "firstName lastName username")
    .sort(searchTerm ? { score: { $meta: "textScore" } } : { createdAt: -1 });
};

// Pre-save middleware
notesSchema.pre("save", function (next) {
  // Auto-approve admin uploads
  if (this.isAdminUploaded && this.isNew) {
    this.status = "approved";
    this.isApproved = true;
    this.approvedAt = new Date();
  }
  next();
});

// Ensure virtual fields are serialized
notesSchema.set("toJSON", { virtuals: true });
notesSchema.set("toObject", { virtuals: true });

const Notes = mongoose.model("Notes", notesSchema);

export default Notes;