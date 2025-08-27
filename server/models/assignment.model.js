import mongoose from "mongoose";

const targetAudienceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    // If allSemesters is true, the assignment is for all semesters of the course
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

const assignmentSchema = new mongoose.Schema(
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
    fileLink: {
      type: String,
      required: false,
    },
    target: targetAudienceSchema,
    dueDate: {
      type: Date,
      required: true,
    },
    lateSubmissionAppealEmail: {
      type: String,
      required: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
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

// Compound indexes for efficient querying
assignmentSchema.index({
  "target.course": 1,
  "target.semesters": 1,
  dueDate: 1,
});
assignmentSchema.index({ tags: 1 });
assignmentSchema.index({ isDeleted: 1 });

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
