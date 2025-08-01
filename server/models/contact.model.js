import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "on-going", "marked-for-deletion"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Contact", contactSchema);
