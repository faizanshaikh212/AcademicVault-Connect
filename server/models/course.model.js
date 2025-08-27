import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    batch: {
      type: String,
      required: true,
      trim: true,
    },
    totalSemesters: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      validate: {
        validator: Number.isInteger,
        message: "Total semesters must be an integer between 1 and 12",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
courseSchema.index({ name: 1, batch: 1 }, { unique: true });

const Course = mongoose.model("Course", courseSchema);

export default Course;
