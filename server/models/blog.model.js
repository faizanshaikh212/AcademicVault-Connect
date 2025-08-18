import mongoose from "mongoose";

// Define the main Blog Schema
const blogSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
    },
    content: {
      type: String, // Supports Markdown
      required: [true, "Blog content is required"],
    },
    coverImage: {
      type: String, // URL to Cloudinary image
      required: [true, "A cover image is required"],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    // Add timestamps for createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create a text index on title and tags for searching
blogSchema.index({ title: "text", tags: "text" });

// Create and export the Blog model
const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
