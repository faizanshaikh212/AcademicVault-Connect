import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    description: { type: String },
    credits: { type: Number },
  },
  { timestamps: true }
);

subjectSchema.index({ semester: 1, course: 1, creator: 1 });

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;
