/**
 * Syllabus Controller
 * Handles CRUD operations for syllabus documents
 */

import Syllabus from "../models/syllabus.model.js";
import fileStorageService from "../services/fileStorage.service.js";
import multer from "multer";
import { createNotification } from "./notification.controller.js";

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, and DOCX files are allowed."
        )
      );
    }
  },
});

/**
 * Get all syllabus documents with search and filtering
 */
export const getAllSyllabus = async (req, res) => {
  try {
    const {
      search,
      course,
      academicYear,
      semester,
      degreeType,
      tags,
      uploader,
      excludeUploader,
      isApproved,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    let query = {};

    // Handle approval status filtering
    if (isApproved !== undefined) {
      query.isApproved = isApproved === "true";
    } else {
      // For admin/teacher users, show all by default. For others, show approved only
      if (
        !req.user ||
        (!req.user.role.includes("admin") && !req.user.role.includes("teacher"))
      ) {
        query.isApproved = true;
      }
      // Admin/teacher users see all syllabus by default (no isApproved filter)
    }

    // Flexible keyword search (accept both `search` and `keyword`) and perform
    // case-insensitive substring matches across title/course/description/tags
    const qParam = search || req.query.keyword;
    if (qParam) {
      const escapeRegex = (s) =>
        String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const raw = String(qParam).trim();
      if (raw.length > 0) {
        const orClauses = [];
        const escapedFull = escapeRegex(raw);
        orClauses.push({ title: { $regex: escapedFull, $options: "i" } });
        orClauses.push({ course: { $regex: escapedFull, $options: "i" } });
        orClauses.push({ description: { $regex: escapedFull, $options: "i" } });
        orClauses.push({ tags: { $regex: escapedFull, $options: "i" } });

        const tokens = raw.split(/\s+/).filter(Boolean);
        tokens.forEach((t) => {
          const esc = escapeRegex(t);
          orClauses.push({ title: { $regex: esc, $options: "i" } });
          orClauses.push({ course: { $regex: esc, $options: "i" } });
          orClauses.push({ description: { $regex: esc, $options: "i" } });
          orClauses.push({ tags: { $regex: esc, $options: "i" } });
        });

        // numeric tokens may match academicYear
        if (!Number.isNaN(Number(raw))) {
          orClauses.push({ academicYear: raw });
        } else {
          tokens.forEach((t) => {
            if (!Number.isNaN(Number(t))) {
              orClauses.push({ academicYear: t });
            }
          });
        }

        query.$or = orClauses;
      }
    }

    // Filters
    if (course) query.course = new RegExp(course, "i");
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (degreeType) query.degreeType = degreeType;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Handle uploader filtering
    if (uploader) {
      query.uploader = uploader;
    }

    // Handle exclude uploader filtering
    if (excludeUploader) {
      query.uploader = { $ne: excludeUploader };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    try {
      console.debug(
        "getAllSyllabus qParam=",
        qParam,
        "query=",
        JSON.stringify(query)
      );
    } catch (e) {
      console.debug("getAllSyllabus qParam=", qParam, "query=(unserializable)");
    }

    const syllabusDocuments = await Syllabus.find(query)
      .populate("uploader", "firstName lastName username avatar")
      .populate("approvedBy", "firstName lastName username")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Syllabus.countDocuments(query);

    res.status(200).json({
      success: true,
      data: syllabusDocuments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching syllabus documents:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching syllabus documents",
      error: error.message,
    });
  }
};

/**
 * Get single syllabus by ID
 */
export const getSyllabusById = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id)
      .populate("uploader", "firstName lastName username avatar")
      .populate("approvedBy", "firstName lastName username");

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: "Syllabus not found",
      });
    }

    // Increment view count
    await syllabus.incrementViewCount();

    res.status(200).json({
      success: true,
      data: syllabus,
    });
  } catch (error) {
    console.error("Error fetching syllabus:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching syllabus",
      error: error.message,
    });
  }
};

/**
 * Upload new syllabus
 */
export const uploadSyllabus = async (req, res) => {
  try {
    const {
      title,
      course,
      description,
      academicYear,
      semester,
      degreeType,
      tags,
      credits,
      duration,
      prerequisites,
    } = req.body;

    // Allow either uploaded file or an external file URL
    if (!req.file && !req.body.fileUrl) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or fileUrl provided",
      });
    }

    // Parse arrays if they're strings
    let parsedTags = [];
    let parsedPrerequisites = [];

    if (tags) {
      parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
    }
    if (prerequisites) {
      parsedPrerequisites =
        typeof prerequisites === "string"
          ? JSON.parse(prerequisites)
          : prerequisites;
    }

    let uploadedFile;
    let fileExtension = "";
    let fileSize = 0;
    let originalFileName = "";

    if (req.file) {
      fileExtension = req.file.originalname.split(".").pop().toLowerCase();
      const fileName = `${Date.now()}-${req.file.originalname}`;

      // Upload to storage (Google Drive)
      uploadedFile = await fileStorageService.uploadFile(
        req.file.buffer,
        fileName,
        req.file.mimetype,
        "syllabus",
        { course, academicYear, description }
      );
      fileSize = req.file.size;
      originalFileName = req.file.originalname;
    } else if (req.body.fileUrl) {
      const fileUrl = req.body.fileUrl;
      uploadedFile = {
        fileId: `external-${Date.now()}`,
        publicUrl: fileUrl,
        downloadUrl: fileUrl,
      };
      const maybeExt = fileUrl.split("?")[0].split(".").pop();
      const extLower = maybeExt ? maybeExt.toLowerCase() : null;
      const allowedExts = ["pdf", "doc", "docx"];
      fileExtension = allowedExts.includes(extLower) ? extLower : "url";
      originalFileName = fileUrl.split("/").pop() || fileUrl;
      fileSize = 0;
    }

    // Create syllabus record
    const syllabus = new Syllabus({
      title,
      course,
      description,
      academicYear,
      semester,
      degreeType,
      tags: parsedTags,
      credits: credits ? parseInt(credits) : undefined,
      duration,
      prerequisites: parsedPrerequisites,
      fileType: fileExtension,
      fileSize: fileSize,
      originalFileName: originalFileName,
      fileId: uploadedFile.fileId,
      publicUrl: uploadedFile.publicUrl,
      downloadUrl: uploadedFile.downloadUrl,
      uploader: req.user._id,
      isAdminUploaded: req.user.role.includes("admin"),
      isApproved: req.user.role.includes("admin"), // Auto-approve admin uploads
    });

    await syllabus.save();

    // Populate uploader info
    await syllabus.populate("uploader", "firstName lastName username avatar");

    // Create notification for admin if user upload
    if (!req.user.role.includes("admin")) {
      const User = (await import("../models/user.model.js")).default;
      const admins = await User.find({ role: "admin" });

      for (const admin of admins) {
        await createNotification({
          recipient: admin._id,
          sender: req.user._id,
          type: "syllabus_uploaded",
          message: `New syllabus "${title}" uploaded by ${req.user.firstName} ${req.user.lastName}`,
          link: `/admin/academic/syllabus/${syllabus._id}`,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Syllabus uploaded successfully",
      data: syllabus,
    });
  } catch (error) {
    console.error("Error uploading syllabus:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading syllabus",
      error: error.message,
    });
  }
};

/**
 * Update syllabus
 */
export const updateSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: "Syllabus not found",
      });
    }

    // Check permissions - teachers and admins can update any syllabus
    if (
      !req.user.role.includes("admin") &&
      !req.user.role.includes("teacher")
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this syllabus",
      });
    }

    const {
      title,
      course,
      description,
      academicYear,
      semester,
      degreeType,
      tags,
      credits,
      duration,
      prerequisites,
      isApproved,
    } = req.body;

    // Parse arrays if they're strings
    let parsedTags = syllabus.tags;
    let parsedPrerequisites = syllabus.prerequisites;

    if (tags) {
      parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
    }
    if (prerequisites) {
      parsedPrerequisites =
        typeof prerequisites === "string"
          ? JSON.parse(prerequisites)
          : prerequisites;
    }

    // Update syllabus
    const updatedSyllabus = await Syllabus.findByIdAndUpdate(
      req.params.id,
      {
        title: title || syllabus.title,
        course: course || syllabus.course,
        description: description || syllabus.description,
        academicYear: academicYear || syllabus.academicYear,
        semester: semester !== undefined ? semester : syllabus.semester, // Allow empty string to clear semester
        degreeType: degreeType || syllabus.degreeType,
        tags: parsedTags,
        credits: credits ? parseInt(credits) : syllabus.credits,
        duration: duration || syllabus.duration,
        prerequisites: parsedPrerequisites,
        isApproved: isApproved !== undefined ? isApproved : syllabus.isApproved,
      },
      { new: true, runValidators: true }
    ).populate("uploader", "firstName lastName username avatar");

    res.status(200).json({
      success: true,
      message: "Syllabus updated successfully",
      data: updatedSyllabus,
    });
  } catch (error) {
    console.error("Error updating syllabus:", error);
    res.status(500).json({
      success: false,
      message: "Error updating syllabus",
      error: error.message,
    });
  }
};

/**
 * Update syllabus with new file (creates new version)
 */
export const updateSyllabusFile = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: "Syllabus not found",
      });
    }

    // Check permissions - teachers and admins can update any syllabus
    if (
      !req.user.role.includes("admin") &&
      !req.user.role.includes("teacher")
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this syllabus",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Get file extension
    const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
    const fileName = `${Date.now()}-${req.file.originalname}`;

    // Upload new file to storage (Google Drive)
    const uploadedFile = await fileStorageService.uploadFile(
      req.file.buffer,
      fileName,
      req.file.mimetype,
      "syllabus",
      { course: syllabus.course, academicYear: syllabus.academicYear }
    );

    // Update file data directly
    syllabus.fileType = fileExtension;
    syllabus.fileSize = req.file.size;
    syllabus.originalFileName = req.file.originalname;
    syllabus.fileId = uploadedFile.fileId;
    syllabus.publicUrl = uploadedFile.publicUrl;
    syllabus.downloadUrl = uploadedFile.downloadUrl;

    await syllabus.save();

    res.status(200).json({
      success: true,
      message: "Syllabus file updated successfully",
      data: syllabus,
    });
  } catch (error) {
    console.error("Error updating syllabus file:", error);
    res.status(500).json({
      success: false,
      message: "Error updating syllabus file",
      error: error.message,
    });
  }
};

/**
 * Delete syllabus
 */
export const deleteSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: "Syllabus not found",
      });
    }

    // Check permissions - teachers and admins can delete any syllabus
    if (
      !req.user.role.includes("admin") &&
      !req.user.role.includes("teacher")
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this syllabus",
      });
    }

    // Delete current file from storage
    try {
      await fileStorageService.deleteFile(syllabus.fileId, "syllabus");
    } catch (storageError) {
      console.error("Error deleting current file from storage:", storageError);
    }

    // Delete from database
    await Syllabus.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Syllabus deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting syllabus:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting syllabus",
      error: error.message,
    });
  }
};

/**
 * Approve syllabus (Admin only)
 */
export const approveSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: "Syllabus not found",
      });
    }

    syllabus.isApproved = true;
    syllabus.approvedBy = req.user._id;
    syllabus.approvedAt = new Date();
    await syllabus.save();

    // Notify uploader
    await createNotification({
      recipient: syllabus.uploader,
      sender: req.user._id,
      type: "syllabus_approved",
      message: `Your syllabus "${syllabus.title}" has been approved`,
      link: `/academic/syllabus/${syllabus._id}`,
    });

    res.status(200).json({
      success: true,
      message: "Syllabus approved successfully",
      data: syllabus,
    });
  } catch (error) {
    console.error("Error approving syllabus:", error);
    res.status(500).json({
      success: false,
      message: "Error approving syllabus",
      error: error.message,
    });
  }
};

/**
 * Track syllabus download
 */
export const trackDownload = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: "Syllabus not found",
      });
    }

    await syllabus.incrementDownloadCount();

    res.status(200).json({
      success: true,
      downloadUrl: syllabus.downloadUrl,
    });
  } catch (error) {
    console.error("Error tracking download:", error);
    res.status(500).json({
      success: false,
      message: "Error tracking download",
      error: error.message,
    });
  }
};

// Export multer upload middleware
export const uploadMiddleware = upload.single("file");

export default {
  getAllSyllabus,
  getSyllabusById,
  uploadSyllabus,
  updateSyllabus,
  updateSyllabusFile,
  deleteSyllabus,
  approveSyllabus,
  trackDownload,
  uploadMiddleware,
};
