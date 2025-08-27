import multer from "multer";
import { uploadFile } from "../config/googleDrive.js";
import "dotenv/config";

// Configure multer for assignments (30MB limit)
const assignmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB limit for assignments
  },
}).array("attachments", 5);

// Configure multer for submissions (30MB limit)
const submissionUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB limit for submissions
  },
}).array("attachments", 1);

// Handle assignment file uploads
export const handleAssignmentUpload = (req, res, next) => {
  assignmentUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(500).json({ message: "Failed to upload files" });
    }
    next();
  });
};

// Handle submission file uploads
export const handleSubmissionUpload = (req, res, next) => {
  submissionUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(500).json({ message: "Failed to upload files" });
    }
    next();
  });
};

// Process assignment uploads and save to Google Drive
export const processAssignmentUploads = async (req, res, next) => {
  try {
    console.log("Processing assignment uploads...");
    console.log("Files received:", req.files?.length || 0);

    if (req.files?.length > 0) {
      const uploadedFiles = [];

      for (const file of req.files) {
        try {
          console.log(`Processing file: ${file.originalname}`);

          // Validate file data
          if (!file.buffer) {
            throw new Error(`Missing file buffer for ${file.originalname}`);
          }

          const uploaded = await uploadFile(file);

          if (!uploaded || !uploaded.fileId) {
            throw new Error(
              `Failed to get upload details for ${file.originalname}`
            );
          }

          uploadedFiles.push({
            filename: uploaded.filename,
            fileUrl: uploaded.webViewLink,
            driveFileId: uploaded.fileId,
            mimeType: uploaded.mimeType,
            size: uploaded.size,
          });

          console.log(`Successfully uploaded ${file.originalname}`);
        } catch (fileError) {
          console.error(
            `Error processing file ${file.originalname}:`,
            fileError
          );
          return res.status(500).json({
            message: "Failed to process file uploads",
            detail: fileError.message,
            file: file.originalname,
          });
        }
      }

      req.body.attachments = uploadedFiles;
      console.log("All files processed successfully");
    }

    next();
  } catch (error) {
    console.error("Error in processAssignmentUploads:", error);
    res.status(500).json({
      message: "Failed to process file uploads",
      detail: error.message,
    });
  }
};

// Process submission uploads and save to Google Drive
export const processSubmissionUploads = async (req, res, next) => {
  try {
    console.log("Processing submission uploads...");
    console.log("Files received:", req.files?.length || 0);

    if (req.files?.length > 0) {
      const uploadedFiles = [];

      for (const file of req.files) {
        try {
          console.log(`Processing submission file: ${file.originalname}`);

          // Validate file data
          if (!file.buffer) {
            throw new Error(`Missing file buffer for ${file.originalname}`);
          }

          const uploaded = await uploadFile(file);

          if (!uploaded || !uploaded.fileId) {
            throw new Error(
              `Failed to get upload details for ${file.originalname}`
            );
          }

          uploadedFiles.push({
            filename: file.originalname,
            fileUrl: uploaded.webViewLink || uploaded.webContentLink,
            driveFileId: uploaded.fileId,
            mimeType: file.mimetype,
            size: file.size,
          });

          console.log(`Successfully uploaded submission ${file.originalname}`);
        } catch (fileError) {
          console.error(
            `Error processing submission file ${file.originalname}:`,
            fileError
          );
          return res.status(500).json({
            message: "Failed to process file uploads",
            detail: fileError.message,
            file: file.originalname,
          });
        }
      }

      req.body.attachments = uploadedFiles;
      console.log("All submission files processed successfully");
    }

    next();
  } catch (error) {
    console.error("Error in processSubmissionUploads:", error);
    res.status(500).json({
      message: "Failed to process file uploads",
      detail: error.message,
    });
  }
};
