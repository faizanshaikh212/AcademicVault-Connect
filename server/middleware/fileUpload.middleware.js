import multer from "multer";
import { uploadFile } from "../services/googleDrive.service.js";

// Configure multer storage
const storage = multer.memoryStorage();

// Single file upload middleware
const fileUploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for single files
  },
}).single("file");

// Multiple files upload middleware
const multiUploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
  },
}).fields([
  { name: "coverImage", maxCount: 1 },
  { name: "attachments", maxCount: 10 },
]);

// Handler for single file upload
const fileUploadHandler = async (req, res, next) => {
  try {
    if (req.file) {
      const uploadedFile = await uploadFile(req.file);
      req.driveFileId = uploadedFile.id;
      req.driveFileUrl = uploadedFile.webContentLink;
    }
    next();
  } catch (error) {
    console.error("Error uploading single file:", error);
    res.status(500).json({ message: "Failed to upload file" });
  }
};

// Handler for multiple files upload
const multiUploadHandler = async (req, res, next) => {
  try {
    const files = {
      coverImage: req.files?.coverImage?.[0],
      attachments: req.files?.attachments || [],
    };

    // Process cover image
    if (files.coverImage) {
      const uploadedCover = await uploadFile(files.coverImage);
      req.body.coverImage = {
        url: uploadedCover.webContentLink,
        fileId: uploadedCover.id,
        mimeType: uploadedCover.mimeType,
      };
    }

    // Process attachments
    if (files.attachments.length > 0) {
      const uploadedAttachments = await Promise.all(
        files.attachments.map((file) => uploadFile(file))
      );
      req.body.attachments = uploadedAttachments.map((file) => ({
        name: file.originalFilename,
        fileId: file.id,
        mimeType: file.mimeType,
        url: file.webContentLink,
      }));
    }

    next();
  } catch (error) {
    console.error("Error processing multiple uploads:", error);
    res.status(500).json({ message: "Failed to process file uploads" });
  }
};

export {
  fileUploadMiddleware,
  fileUploadHandler,
  multiUploadMiddleware,
  multiUploadHandler,
};
