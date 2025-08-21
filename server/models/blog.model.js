/**
 * Blog Model Module
 * Defines the schema for blog posts in the application
 * Includes text indexing for search functionality
 * @module models/blog
 */

import mongoose from "mongoose";

/**
 * Blog Schema Definition
 * @typedef {Object} BlogSchema
 * @property {ObjectId} author - Reference to User model
 * @property {string} title - Blog post title
 * @property {string} content - Blog post content in Markdown
 * @property {string} coverImage - Cloudinary URL for blog cover
 * @property {string[]} tags - Array of categorization tags
 * @property {Date} createdAt - Automatic timestamp
 * @property {Date} updatedAt - Automatic timestamp
 */
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
