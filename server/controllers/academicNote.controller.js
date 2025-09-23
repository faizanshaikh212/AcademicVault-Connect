/**
 * Academic Notes Controller
 * Handles CRUD operations for academic notes
 */

import AcademicNote from "../models/academicNote.model.js";
import fileStorageService from "../services/fileStorage.service.js";
import multer from "multer";
import { createNotification } from "./notification.controller.js";
import {
  shouldUseTeacherPrivileges,
  shouldUseAdminPrivileges,
  getAcademicNoteDefaults,
  logRoleCheck
} from "../utils/roleUtils.js";

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
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, and TXT files are allowed."
        )
      );
    }
  },
});

/**
 * Get all academic notes with search and filtering
 */
export const getAllNotes = async (req, res) => {
  try {
    const {
      search,
      course,
      subject,
      semester,
      academicYear,
      tags,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      uploader,
      excludeUploader,
      isApproved,
    } = req.query;

    // Build query
    let query = {};

    // Handle approval filter for management interface
    if (isApproved !== undefined) {
      if (isApproved === "false") {
        // For management, show both "In Review" and "Disapproved" when isApproved=false
        query.status = { $in: ["In for Review", "Disapproved"] };
      } else if (isApproved === "true") {
        query.status = "Approved";
      }
    } else {
      // For public access (non-admin users), show approved and "In Review" notes
      if (
        !req.user ||
        (!req.user.role.includes("admin") && !req.user.role.includes("teacher"))
      ) {
        query.status = { $in: ["Approved", "In for Review"] };
      }
      // For admin/teacher users, show all notes by default (no status filter)
    }

    // Handle uploader filtering
    if (uploader) {
      query.uploader = uploader;
    }

    // Handle exclude uploader filtering
    if (excludeUploader) {
      query.uploader = { $ne: excludeUploader };
    }

    // Flexible search: accept `search` or `keyword` and perform case-insensitive
    // substring matching across common fields (title, course, subject, description, tags)
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
        orClauses.push({ subject: { $regex: escapedFull, $options: "i" } });
        orClauses.push({ description: { $regex: escapedFull, $options: "i" } });
        orClauses.push({ tags: { $regex: escapedFull, $options: "i" } });

        const tokens = raw.split(/\s+/).filter(Boolean);
        tokens.forEach((t) => {
          const esc = escapeRegex(t);
          orClauses.push({ title: { $regex: esc, $options: "i" } });
          orClauses.push({ course: { $regex: esc, $options: "i" } });
          orClauses.push({ subject: { $regex: esc, $options: "i" } });
          orClauses.push({ description: { $regex: esc, $options: "i" } });
          orClauses.push({ tags: { $regex: esc, $options: "i" } });
        });

        // If numeric token present, match academicYear
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
    if (subject) query.subject = new RegExp(subject, "i");
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    // Diagnostic logging: show qParam and constructed query when debugging search
    try {
      console.debug(
        "getAllNotes qParam=",
        qParam,
        "query=",
        JSON.stringify(query)
      );
    } catch (e) {
      console.debug("getAllNotes qParam=", qParam, "query=(unserializable)");
    }

    const notes = await AcademicNote.find(query)
      .populate("uploader", "firstName lastName username avatar")
      .populate("approvedBy", "firstName lastName username")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AcademicNote.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notes,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notes",
      error: error.message,
    });
  }
};

/**
 * Get single academic note by ID
 */
export const getNoteById = async (req, res) => {
  try {
    const note = await AcademicNote.findById(req.params.id)
      .populate("uploader", "firstName lastName username avatar")
      .populate("approvedBy", "firstName lastName username");

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Increment view count
    await note.incrementViewCount();

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Error fetching note:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching note",
      error: error.message,
    });
  }
};

/**
 * Upload new academic note
 */
export const uploadNote = async (req, res) => {
  try {
    const {
      title,
      description,
      course,
      subject,
      semester,
      academicYear,
      tags,
      type,
      status,
    } = req.body;

    // Support either an uploaded file (multipart) or a provided fileUrl
    if (!req.file && !req.body.fileUrl) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or fileUrl provided",
      });
    }

    // Parse tags if it's a string
    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
    }

    let uploadedFile;
    let fileExtension = "";
    let fileSize = 0;
    let originalFileName = "";

    if (req.file) {
      // Get file extension
      fileExtension = req.file.originalname.split(".").pop().toLowerCase();
      const fileName = `${Date.now()}-${req.file.originalname}`;

      // Upload to storage (Google Drive with local fallback)
      uploadedFile = await fileStorageService.uploadFile(
        req.file.buffer,
        fileName,
        req.file.mimetype,
        "notes",
        { course, subject, description }
      );
      fileSize = req.file.size;
      originalFileName = req.file.originalname;
    } else if (req.body.fileUrl) {
      // If user provided an external link, use it as public/download URL
      const fileUrl = req.body.fileUrl;
      uploadedFile = {
        fileId: `external-${Date.now()}`,
        publicUrl: fileUrl,
        downloadUrl: fileUrl,
      };
      // Try to derive extension from URL
      const maybeExt = fileUrl.split("?")[0].split(".").pop();
      const extLower = maybeExt ? maybeExt.toLowerCase() : null;
      // Allowed extensions for notes model
      const allowedExts = ["pdf", "doc", "docx", "ppt", "pptx", "txt"];
      fileExtension = allowedExts.includes(extLower) ? extLower : "url";
      originalFileName = fileUrl.split("/").pop() || fileUrl;
      fileSize = 0;
    }

    // Determine status and type based on user role precedence
    const userRoles = req.user.role || [];
    const noteDefaults = getAcademicNoteDefaults(userRoles);

    logRoleCheck(
      req.user._id,
      userRoles,
      'academic_note_upload',
      true,
      `Academic Note Upload - ${title}`
    );

    // Use provided values or defaults based on role precedence
    let noteStatus = status || noteDefaults.status;
    let noteType = type || noteDefaults.type;
    let isApproved = noteDefaults.isApproved;

    // If user has teacher privileges, they can override defaults
    if (shouldUseTeacherPrivileges(userRoles)) {
      // Teachers and admins can set custom status and type
      if (status) noteStatus = status;
      if (type) noteType = type;
      isApproved = noteStatus === "Approved";
    } else {
      // Students always get "In for Review" status and "Unofficial" type
      noteStatus = "In for Review";
      noteType = "Unofficial";
      isApproved = false;
    }

    console.log("DEBUG: uploadNote - role precedence applied:", {
      userRoles,
      hasTeacherPrivileges: shouldUseTeacherPrivileges(userRoles),
      hasAdminPrivileges: shouldUseAdminPrivileges(userRoles),
      finalType: noteType,
      finalStatus: noteStatus,
      finalIsApproved: isApproved,
    });

    // Create note record
    const note = new AcademicNote({
      title,
      description,
      course,
      subject,
      semester,
      academicYear: academicYear || new Date().getFullYear().toString(), // Default to current year if not provided
      type: noteType,
      status: noteStatus,
      tags: parsedTags,
      fileType: fileExtension,
      fileSize: fileSize,
      originalFileName: originalFileName,
      fileId: uploadedFile.fileId,
      publicUrl: uploadedFile.publicUrl,
      downloadUrl: uploadedFile.downloadUrl,
      uploader: req.user._id,
      isAdminUploaded: shouldUseAdminPrivileges(userRoles),
      isApproved: isApproved,
    });

    await note.save();

    // Populate uploader info
    await note.populate("uploader", "firstName lastName username avatar");

    // Create notification for admin if non-admin upload
    if (!shouldUseAdminPrivileges(userRoles)) {
      // Find all admins
      const User = (await import("../models/user.model.js")).default;
      const admins = await User.find({ role: "admin" });

      for (const admin of admins) {
        await createNotification({
          recipient: admin._id,
          sender: req.user._id,
          type: "academic_note_uploaded",
          message: `New academic note "${title}" uploaded by ${req.user.firstName} ${req.user.lastName}`,
          link: `/admin/academic/notes/${note._id}`,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Note uploaded successfully",
      data: note,
    });
  } catch (error) {
    console.error("Error uploading note:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading note",
      error: error.message,
    });
  }
};

/**
 * Update academic note
 */
export const updateNote = async (req, res) => {
  try {
    const note = await AcademicNote.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Check permissions - teachers and admins can update any note
    if (
      !req.user.role.includes("admin") &&
      !req.user.role.includes("teacher")
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this note",
      });
    }

    const {
      title,
      description,
      course,
      subject,
      semester,
      academicYear,
      tags,
      type,
      status,
    } = req.body;

    // Parse tags if it's a string
    let parsedTags = note.tags;
    if (tags) {
      parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
    }

    // Handle status update and approval logic
    let updateData = {
      title: title || note.title,
      description: description || note.description,
      course: course || note.course,
      subject: subject || note.subject,
      semester: semester || note.semester,
      academicYear: academicYear || note.academicYear,
      type: type !== undefined ? type : note.type, // Use type if provided, otherwise keep existing
      tags: parsedTags,
    };

    // Handle status field for approval logic
    if (status !== undefined) {
      if (req.user.role.includes("admin")) {
        // Admins can set any status
        updateData.status = status;
        updateData.isApproved = status === "Approved";
      } else if (req.user.role.includes("teacher")) {
        // Teachers can set any status
        updateData.status = status;
        updateData.isApproved = status === "Approved";
      }
      // Students cannot change approval status
    }

    // Update note
    const updatedNote = await AcademicNote.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("uploader", "firstName lastName username avatar");

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: updatedNote,
    });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({
      success: false,
      message: "Error updating note",
      error: error.message,
    });
  }
};

/**
 * Delete academic note
 */
export const deleteNote = async (req, res) => {
  try {
    const note = await AcademicNote.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Check permissions - teachers and admins can delete any note
    if (
      !req.user.role.includes("admin") &&
      !req.user.role.includes("teacher")
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this note",
      });
    }

    // Delete from storage
    try {
      await fileStorageService.deleteFile(note.fileId, "notes");
    } catch (storageError) {
      console.error("Error deleting file from storage:", storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await AcademicNote.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting note",
      error: error.message,
    });
  }
};

/**
 * Approve academic note (Admin only)
 */
export const approveNote = async (req, res) => {
  try {
    const note = await AcademicNote.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    note.isApproved = true;
    note.approvedBy = req.user._id;
    note.approvedAt = new Date();
    await note.save();

    // Notify uploader
    await createNotification({
      recipient: note.uploader,
      sender: req.user._id,
      type: "academic_note_approved",
      message: `Your academic note "${note.title}" has been approved`,
      link: `/academic/notes/${note._id}`,
    });

    res.status(200).json({
      success: true,
      message: "Note approved successfully",
      data: note,
    });
  } catch (error) {
    console.error("Error approving note:", error);
    res.status(500).json({
      success: false,
      message: "Error approving note",
      error: error.message,
    });
  }
};

/**
 * Reject academic note (Admin only)
 */
export const rejectNote = async (req, res) => {
  try {
    const { reason } = req.body;
    const note = await AcademicNote.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Delete from storage
    try {
      await fileStorageService.deleteFile(note.fileId, "notes");
    } catch (storageError) {
      console.error("Error deleting file from storage:", storageError);
    }

    // Notify uploader
    await createNotification({
      recipient: note.uploader,
      sender: req.user._id,
      type: "academic_note_rejected",
      message: `Your academic note "${note.title}" has been rejected. Reason: ${reason || "No reason provided"
        }`,
      link: "/academic/notes",
    });

    // Delete from database
    await AcademicNote.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Note rejected and deleted successfully",
    });
  } catch (error) {
    console.error("Error rejecting note:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting note",
      error: error.message,
    });
  }
};

/**
 * Track note download
 */
export const trackDownload = async (req, res) => {
  try {
    const note = await AcademicNote.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    await note.incrementDownloadCount();

    res.status(200).json({
      success: true,
      downloadUrl: note.downloadUrl,
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
  getAllNotes,
  getNoteById,
  uploadNote,
  updateNote,
  deleteNote,
  approveNote,
  rejectNote,
  trackDownload,
  uploadMiddleware,
};
