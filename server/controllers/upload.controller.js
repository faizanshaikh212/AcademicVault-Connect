/**
 * @desc    Up    // Always get fresh user data to check current premium status
    const User = (await import('../models/user.model.js')).default;
    const user = await User.findById(req.user._id);
    const isPremium = user?.premium?.isPremium || false;

    // Define allowed file types based on premium status
    const basicTypes = ["image/jpeg", "image/png", "image/gif"];
    const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    const allowedTypes = isPremium 
      ? [...basicTypes, ...videoTypes]  // Premium users can upload videos
      : basicTypes;                     // Basic users can only upload images get its details
 * @route   POST /api/upload
 * @access  Private
 */
/**
 * Handles file uploads with premium user considerations
 * @function uploadFile
 * @async
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} When file upload fails or validation fails
 */
const uploadFile = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check if file was provided
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No file uploaded. Please select a file." });
    }

    // Always get fresh user data to check current premium status
    const User = (await import("../models/user.model.js")).default;
    const user = await User.findById(req.user._id);
    const isPremium = user?.premium?.isPremium || false;

    // Define allowed file types based on premium status and upload type
    const basicAllowedTypes = ["image/jpeg", "image/png", "image/gif"];
    const premiumAllowedTypes = [
      ...basicAllowedTypes,
      "video/mp4",
      "video/webm",
    ];
    const contentTypes = ["text/markdown", "text/html", "text/plain"]; // Allow text files for content

    // Determine allowed types based on request path and premium status
    const isContent = req.path.includes("content");
    const allowedTypes = isContent
      ? [...basicAllowedTypes, ...contentTypes]
      : isPremium
      ? premiumAllowedTypes
      : basicAllowedTypes;

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: isPremium
          ? "Invalid file type. Please upload a JPEG, PNG, GIF, MP4, or WEBM file."
          : "Invalid file type. Please upload a JPEG, PNG, or GIF image.",
      });
    }

    // Check if it's a video file
    const isVideo = req.file.mimetype.startsWith("video/");
    if (isVideo && !isPremium) {
      return res.status(400).json({
        message: "Video uploads are only available for premium users.",
      });
    }

    // Validate file size based on premium status
    const maxSize = isPremium ? 20 * 1024 * 1024 : 5 * 1024 * 1024; // 20MB for premium, 5MB for non-premium
    if (req.file.size > maxSize) {
      return res.status(400).json({
        message: isPremium
          ? "File size exceeds 20MB limit for premium users."
          : "File size exceeds 5MB limit for basic users.",
      });
    }

    // For avatar uploads, Cloudinary will automatically handle the 1:1 aspect ratio
    // and GIF animation based on premium status in cloudinary.js config

    // Send back the details of the uploaded file provided by Cloudinary
    res.status(200).json({
      message: "File uploaded successfully.",
      filePath: req.file.path, // The URL of the uploaded file
      fileType: req.file.mimetype,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      isAvatar: req.path.includes("avatar"), // Indicate if this was an avatar upload
    });
  } catch (error) {
    logger.error("Upload error:", error);
    res.status(500).json({
      message: "Error uploading file. Please try again.",
      error: error.message,
    });
  }
};

import logger from "../utils/logger.js";

export { uploadFile };
