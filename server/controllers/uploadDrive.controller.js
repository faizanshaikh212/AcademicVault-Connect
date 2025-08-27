import logger from "../utils/logger.js";

/**
 * Placeholder controller for Drive uploads.
 * If GOOGLE_SERVICE_ACCOUNT env var is provided with JSON, this would upload using googleapis.
 * For now, accept a multipart file and return metadata + a mock driveFileId so frontend can continue.
 */
export const uploadToDrive = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    // Build response metadata
    const meta = {
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileUrl: req.file.path || null,
      driveFileId: process.env.GOOGLE_DRIVE_MOCK_ID || `mock-${Date.now()}`,
    };

    // In a production setup we'd upload to Drive and return the file id and webViewLink
    logger.info("Drive upload placeholder used", {
      user: req.user._id,
      file: meta.filename,
    });
    res.status(201).json(meta);
  } catch (error) {
    logger.error("Drive upload failed", error);
    res.status(500).json({ message: "Drive upload failed" });
  }
};
