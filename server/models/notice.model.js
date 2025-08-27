import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
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

const targetAudienceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    // If allSemesters is true, the notice is for all semesters of the course
    // If false, only for specific semesters listed in the semesters array
    allSemesters: {
      type: Boolean,
      default: false,
    },
    semesters: [
      {
        type: Number,
        min: 1,
        max: 12,
      },
    ],
  },
  { _id: false }
);

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: "placeholderimage1234567890.png",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [attachmentSchema],
    target: targetAudienceSchema,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // For soft delete functionality
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
noticeSchema.index({
  "target.course": 1,
  "target.semesters": 1,
  createdAt: -1,
});
noticeSchema.index({ tags: 1 });
noticeSchema.index({ isDeleted: 1 });

const Notice = mongoose.model("Notice", noticeSchema);

export default Notice;
