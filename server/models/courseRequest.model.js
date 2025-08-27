import mongoose from "mongoose";

const courseRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const CourseRequest = mongoose.model("CourseRequest", courseRequestSchema);

export default CourseRequest;
