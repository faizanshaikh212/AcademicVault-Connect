import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
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
  },
  { timestamps: true }
);

semesterSchema.index({ course: 1, creator: 1 });

const Semester = mongoose.model("Semester", semesterSchema);
export default Semester;
