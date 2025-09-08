/**
 * Timetable Model
 * Schema for class timetables and schedules
 */

import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    // Add pre-save middleware for date validation
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
      trim: true,
      index: true,
    },
    degreeType: {
      type: String,
      enum: ["BE", "BSC", "PG", "Commerce", "Diploma", "Other"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Timetable specific fields
    timetableType: {
      type: String,
      enum: ["Regular", "Exam", "Special", "Holiday"],
      default: "Regular",
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    effectiveTo: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // File information
    fileType: {
      type: String,
      required: true,
      enum: ["pdf", "doc", "docx", "jpg", "jpeg", "png", "xlsx", "url"],
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

    // Notification tracking
    notificationsSent: [
      {
        type: {
          type: String,
          enum: ["created", "updated", "activated", "deactivated"],
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
        recipients: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
      },
    ],

    // Tags for categorization
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

// Text search index
timetableSchema.index({
  title: "text",
  course: "text",
  description: "text",
});

// Compound indexes for efficient queries
timetableSchema.index({ course: 1, semester: 1, academicYear: -1 });
timetableSchema.index({ uploader: 1, createdAt: -1 });
timetableSchema.index({ isApproved: 1, isActive: 1, effectiveFrom: -1 });
timetableSchema.index({ effectiveFrom: 1, effectiveTo: 1 });

// Methods
timetableSchema.methods.incrementDownloadCount = function () {
  this.downloadCount += 1;
  return this.save();
};

timetableSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

timetableSchema.methods.activate = function () {
  this.isActive = true;
  return this.save();
};

timetableSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

timetableSchema.methods.addNotificationRecord = function (type, recipients) {
  this.notificationsSent.push({
    type,
    recipients,
    sentAt: new Date(),
  });
  return this.save();
};

// Static methods
timetableSchema.statics.getActiveTimetables = function (
  course,
  semester,
  academicYear
) {
  const now = new Date();
  return this.find({
    course,
    semester,
    academicYear,
    isActive: true,
    isApproved: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveTo: { $exists: false } },
      { effectiveTo: null },
      { effectiveTo: { $gte: now } },
    ],
  }).sort({ effectiveFrom: -1 });
};

const Timetable = mongoose.model("Timetable", timetableSchema);

export default Timetable;
