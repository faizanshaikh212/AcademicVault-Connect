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
    // and GIF animation based on premium status in cloudinary.js config.
    // Support two flows:
    // 1) multer-storage-cloudinary: multer has already uploaded the file to Cloudinary
    //    and `req.file` contains cloud upload metadata (e.g., path/secure_url, filename/public_id)
    // 2) memoryStorage: `req.file.buffer` exists and we upload via fileStorageService (which now uploads images to Cloudinary)

    const fileStorageService = (
      await import("../services/fileStorage.service.js")
    ).default;

    let uploadResult;

    // Detect if multer-storage-cloudinary uploaded the file already
    const cloudUrl =
      req.file.path || req.file.secure_url || req.file.url || req.file.location;
    const cloudPublicId =
      req.file.filename || req.file.public_id || req.file.originalname;

    if (cloudUrl) {
      // Build a normalized response similar to fileStorageService
      const publicUrl = cloudUrl;
      const downloadUrl = cloudUrl;
      const fileId = cloudPublicId
        ? `cloudinary:${cloudPublicId}`
        : `cloudinary:${Date.now()}`;

      uploadResult = {
        fileId,
        fileName:
          req.file.originalname ||
          req.file.name ||
          req.file.originalname ||
          "file",
        fileSize: req.file.size || 0,
        mimeType: req.file.mimetype || "image",
        publicUrl,
        downloadUrl,
        storageType: "cloudinary",
        raw: req.file,
      };
    } else if (req.file && req.file.buffer) {
      // Fallback: original flow — upload via fileStorageService (handles images -> Cloudinary)
      const result = await fileStorageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "uploads",
        {}
      );
      uploadResult = result;
    } else {
      return res.status(400).json({ message: "No file data available" });
    }

    res.status(200).json({
      message: "File uploaded successfully.",
      filePath: uploadResult.publicUrl,
      fileType: uploadResult.mimeType || req.file.mimetype,
      originalName: req.file.originalname || uploadResult.fileName,
      fileSize: uploadResult.fileSize || req.file.size,
      isAvatar: req.path.includes("avatar"),
      downloadUrl: uploadResult.downloadUrl,
      embedUrl: uploadResult.embedUrl,
      storageType: uploadResult.storageType,
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
