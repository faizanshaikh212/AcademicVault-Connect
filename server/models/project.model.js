/**
 * Project Model Module
 * Defines the schema for user projects with comprehensive metadata
 * Includes search indexing and social media integration
 * @module models/project
 */

import mongoose from "mongoose";

/**
 * Extra Link Schema Definition
 * Used for additional project-related links
 * @typedef {Object} ExtraLinkSchema
 * @property {string} title - Display name for the link
 * @property {string} url - URL of the resource
 */
const extraLinkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

/**
 * Project Schema Definition
 * Comprehensive project information schema with media support
 *
 * @typedef {Object} ProjectSchema
 * @property {ObjectId} author - Reference to project creator
 * @property {string} title - Project title
 * @property {string} description - Project description
 * @property {string} coverImage - Cloudinary URL for main image
 * @property {string[]} screenshots - Array of Cloudinary image URLs
 * @property {string} projectLink - Live project URL
 * @property {string} sourceCodeLink - Repository URL
 * @property {string[]} tags - Categorization tags
 * @property {ExtraLink[]} extraLinks - Additional project links
 * @property {Object} socialMediaLinks - Platform-specific links
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
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
    /**
     * Additional external links for the project
     */
    extraLinks: [extraLinkSchema],

    /**
     * Social media profiles associated with the project
     * Each field represents a different platform link
     */
    socialMediaLinks: {
      github: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      twitter: { type: String, trim: true },
      instagram: { type: String, trim: true },
      facebook: { type: String, trim: true },
      youtube: { type: String, trim: true },
      website: { type: String, trim: true },
    },
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
