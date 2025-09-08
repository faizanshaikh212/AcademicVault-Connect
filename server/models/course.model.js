/**
 * Course Model
 */
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    semesterCount: { type: Number, default: 0 },
    // Academic category / degree type for this course (e.g. BE, BSC, PG, Commerce)
    type: {
      type: String,
      enum: ["BE", "BSC", "PG", "Commerce"],
      index: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    metadata: { type: Object },
  },
  { timestamps: true }
);

courseSchema.index({ creator: 1, createdAt: -1 });

const Course = mongoose.model("Course", courseSchema);
export default Course;
