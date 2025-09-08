/**
 * Timetables Model Module
 * Defines the schema for class timetables with semester organization
 * @module models/timetables
 */

import mongoose from "mongoose";

/**
 * Timetables Schema
 * Comprehensive timetables model with academic organization and notifications
 */
const timetablesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Timetable title is required"],
      trim: true,
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
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Additional academic information
    degreeType: {
      type: String,
      enum: ["BE", "BSC", "PG", "Commerce", "Diploma", "Certificate"],
      index: true,
    },
    department: {
      type: String,
      trim: true,
      index: true,
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
    },
    
    // Timetable specific information
    timetableType: {
      type: String,
      enum: ["Regular", "Exam", "Special", "Lab", "Tutorial"],
      default: "Regular",
      index: true,
    },
    
    // Time period information
    effectiveFrom: {
      type: Date,
      required: [true, "Effective from date is required"],
      index: true,
    },
    effectiveTo: {
      type: Date,
      index: true,
    },
    
    // File information
    fileType: {
      type: String,
      required: [true, "File type is required"],
      enum: ["pdf", "doc", "docx", "jpg", "jpeg", "png", "xlsx"],
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

    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "archived"],
      default: "pending",
      index: true,
    },

    // Notification settings
    notifyUsers: {
      type: Boolean,
      default: true,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notificationSentAt: {
      type: Date,
    },

    // Tags for categorization
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Additional metadata
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Version tracking for updates
    version: {
      type: Number,
      default: 1,
    },
    previousVersions: [
      {
        version: Number,
        fileId: String,
        updatedAt: Date,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changeNote: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for better query performance
timetablesSchema.index({ course: 1, semester: 1, academicYear: 1 });
timetablesSchema.index({ degreeType: 1, department: 1, section: 1 });
timetablesSchema.index({ effectiveFrom: 1, effectiveTo: 1 });
timetablesSchema.index({ uploader: 1, status: 1 });
timetablesSchema.index({ isApproved: 1, isActive: 1, isCurrent: 1 });

// Text search index
timetablesSchema.index({
  title: "text",
  course: "text",
  description: "text",
  department: "text",
});

// Virtual for formatted file size
timetablesSchema.virtual("formattedFileSize").get(function () {
  const bytes = this.fileSize;
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
});

// Virtual for academic info
timetablesSchema.virtual("academicInfo").get(function () {
  let info = `${this.course} - Semester ${this.semester}`;
  if (this.section) info += ` (Section ${this.section})`;
  return info;
});

// Virtual for current status
timetablesSchema.virtual("isCurrentlyActive").get(function () {
  if (!this.isActive) return false;
  const now = new Date();
  if (this.effectiveFrom && now < this.effectiveFrom) return false;
  if (this.effectiveTo && now > this.effectiveTo) return false;
  return true;
});

// Methods
timetablesSchema.methods.incrementDownloadCount = function () {
  this.downloadCount += 1;
  return this.save();
};

timetablesSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

timetablesSchema.methods.approve = function (approvedBy) {
  this.status = "approved";
  this.isApproved = true;
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.rejectionReason = undefined;
  return this.save();
};

timetablesSchema.methods.reject = function (rejectionReason) {
  this.status = "rejected";
  this.isApproved = false;
  this.rejectionReason = rejectionReason;
  this.approvedBy = undefined;
  this.approvedAt = undefined;
  return this.save();
};

timetablesSchema.methods.markAsCurrent = function () {
  // First, mark all other timetables for this course/semester as not current
  return this.constructor.updateMany(
    {
      course: this.course,
      semester: this.semester,
      academicYear: this.academicYear,
      _id: { $ne: this._id },
    },
    { isCurrent: false }
  ).then(() => {
    this.isCurrent = true;
    return this.save();
  });
};

timetablesSchema.methods.createNewVersion = function (newFileData, updatedBy, changeNote) {
  // Store current version in history
  this.previousVersions.push({
    version: this.version,
    fileId: this.googleDriveFileId,
    updatedAt: this.updatedAt,
    updatedBy: updatedBy,
    changeNote: changeNote || "Timetable update",
  });

  // Update to new version
  this.version += 1;

  // Update file information
  Object.assign(this, newFileData);
  this.status = "pending"; // Require re-approval for new versions
  this.isApproved = false;
  this.notificationSent = false; // Reset notification status

  return this.save();
};

// Static methods
timetablesSchema.statics.findByUploader = function (uploaderId) {
  return this.find({ uploader: uploaderId }).populate("uploader", "firstName lastName username");
};

timetablesSchema.statics.findPending = function () {
  return this.find({ status: "pending" }).populate("uploader", "firstName lastName username");
};

timetablesSchema.statics.findCurrent = function () {
  return this.find({ 
    status: "approved", 
    isActive: true,
    isCurrent: true,
    $or: [
      { effectiveFrom: { $lte: new Date() }, effectiveTo: { $gte: new Date() } },
      { effectiveFrom: { $lte: new Date() }, effectiveTo: null }
    ]
  }).populate("uploader", "firstName lastName username");
};

timetablesSchema.statics.findActive = function () {
  return this.find({ 
    status: "approved", 
    isActive: true,
    $or: [
      { effectiveFrom: { $lte: new Date() }, effectiveTo: { $gte: new Date() } },
      { effectiveFrom: { $lte: new Date() }, effectiveTo: null },
      { effectiveFrom: null, effectiveTo: { $gte: new Date() } },
      { effectiveFrom: null, effectiveTo: null }
    ]
  }).populate("uploader", "firstName lastName username");
};

timetablesSchema.statics.searchTimetables = function (searchTerm, filters = {}) {
  const query = { status: "approved", isActive: true };

  // Add text search if search term provided
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  // Add filters
  if (filters.course) query.course = new RegExp(filters.course, "i");
  if (filters.semester) query.semester = filters.semester;
  if (filters.academicYear) query.academicYear = filters.academicYear;
  if (filters.degreeType) query.degreeType = filters.degreeType;
  if (filters.department) query.department = new RegExp(filters.department, "i");
  if (filters.section) query.section = filters.section;
  if (filters.timetableType) query.timetableType = filters.timetableType;
  if (filters.isCurrent !== undefined) query.isCurrent = filters.isCurrent;
  if (filters.uploader) query.uploader = filters.uploader;

  return this.find(query)
    .populate("uploader", "firstName lastName username")
    .sort(searchTerm ? { score: { $meta: "textScore" } } : { isCurrent: -1, effectiveFrom: -1, createdAt: -1 });
};

timetablesSchema.statics.getAvailableCourses = function () {
  return this.distinct("course", { status: "approved", isActive: true });
};

timetablesSchema.statics.getAvailableSemesters = function (course) {
  const query = { status: "approved", isActive: true };
  if (course) query.course = course;
  return this.distinct("semester", query);
};

timetablesSchema.statics.getAvailableYears = function () {
  return this.distinct("academicYear", { status: "approved", isActive: true });
};

// Pre-save middleware
timetablesSchema.pre("save", function (next) {
  // Auto-approve admin uploads
  if (this.isAdminUploaded && this.isNew) {
    this.status = "approved";
    this.isApproved = true;
    this.approvedAt = new Date();
  }

  // Set effective dates if not provided
  if (this.isNew && !this.effectiveFrom) {
    this.effectiveFrom = new Date();
  }

  next();
});

// Post-save middleware for notifications
timetablesSchema.post("save", function (doc) {
  // Send notifications when timetable is approved and notifications are enabled
  if (doc.status === "approved" && doc.notifyUsers && !doc.notificationSent) {
    // This would trigger notification service
    // For now, we'll just mark as notification sent
    doc.notificationSent = true;
    doc.notificationSentAt = new Date();
    doc.save();
  }
});

// Ensure virtual fields are serialized
timetablesSchema.set("toJSON", { virtuals: true });
timetablesSchema.set("toObject", { virtuals: true });

const Timetables = mongoose.model("Timetables", timetablesSchema);

export default Timetables;