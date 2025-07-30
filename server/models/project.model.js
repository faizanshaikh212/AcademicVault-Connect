import mongoose from "mongoose";

// Define a schema for extra links within a project
const extraLinkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

// Define the main Project Schema
const projectSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster queries on user's projects
    },
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
    },
    coverImage: {
      type: String, // URL to Cloudinary image
      required: [true, "A cover image is required"],
    },
    screenshots: [
      {
        type: String, // Array of URLs to Cloudinary images
      },
    ],
    projectLink: {
      type: String,
      trim: true,
    },
    sourceCodeLink: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    extraLinks: [extraLinkSchema],
  },
  {
    // Add timestamps for createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create a text index on title and description for searching
projectSchema.index({ title: "text", description: "text", tags: "text" });

// Create and export the Project model
const Project = mongoose.model("Project", projectSchema);

export default Project;
