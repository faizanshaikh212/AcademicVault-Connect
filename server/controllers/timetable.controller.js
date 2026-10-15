/**
 * Timetable Controller
 * Handles CRUD operations for timetables
 */

import Timetable from "../models/timetable.model.js";
import fileStorageService from "../services/fileStorage.service.js";
import multer from "multer";
import { createNotification } from "./notification.controller.js";
import { shouldUseTeacherPrivileges } from "../utils/roleUtils.js";

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
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, and PNG files are allowed."
        )
      );
    }
  },
});

/**
 * Get all timetables with search and filtering
 */
export const getAllTimetables = async (req, res) => {
  try {
    const {
      search,
      course,
      semester,
      academicYear,
      degreeType,
      timetableType,
      isActive,
      uploader,
      excludeUploader,
      isApproved,
      page = 1,
      limit = 20,
      sortBy = "effectiveFrom",
      sortOrder = "desc",
    } = req.query;

    // Build query
    let query = {};

    const canReviewResources = shouldUseTeacherPrivileges(req.user?.role);
    if (canReviewResources && isApproved !== undefined) {
      query.isApproved = isApproved === "true" || isApproved === true;
    } else {
      query.isApproved = true;
    }

    // Flexible keyword search (accept both `search` and `keyword`) and perform
    // case-insensitive substring matching across title/course/description/tags
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

        if (!Number.isNaN(Number(raw))) {
          orClauses.push({ academicYear: raw });
        } else {
          tokens.forEach((t) => {
            if (!Number.isNaN(Number(t))) {
              orClauses.push({ academicYear: t });
            }
          });
        }

        // If query already has an $or (e.g., active timetable constraints), merge them
        if (query.$or) {
          query.$and = [{ $or: query.$or }, { $or: orClauses }];
          delete query.$or;
        } else {
          query.$or = orClauses;
        }
      }
    }

    // Filters
    if (course) query.course = new RegExp(course, "i");
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    if (degreeType) query.degreeType = degreeType;
    if (timetableType) query.timetableType = timetableType;
    if (isActive !== undefined) query.isActive = isActive === "true";

    // Handle uploader filtering
    if (uploader) {
      query.uploader = uploader;
    }

    // Handle exclude uploader filtering
    if (excludeUploader) {
      query.uploader = { $ne: excludeUploader };
    }

    // Only show active timetables by default. However, if the caller
    // explicitly provided an isApproved parameter (either true or false),
    // we should not layer the default active/effectiveFrom constraints on
    // top of the approval filter. This mirrors how notes handle explicit
    // status/isApproved filtering and prevents hiding pending items.
    if (isActive === undefined) {
      const explicitIsApprovedProvided =
        canReviewResources && typeof isApproved !== "undefined";

      if (!explicitIsApprovedProvided) {
        const now = new Date();
        query.isActive = true;
        query.effectiveFrom = { $lte: now };

        const activeOr = [
          { effectiveTo: { $exists: false } },
          { effectiveTo: null },
          { effectiveTo: { $gte: now } },
        ];

        // If search already added a $or, combine them with $and so both conditions apply
        if (query.$or) {
          query.$and = [{ $or: query.$or }, { $or: activeOr }];
          delete query.$or;
        } else {
          query.$or = activeOr;
        }
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Diagnostic logging: incoming query and constructed Mongo query
    try {
      console.debug("getAllTimetables - incoming req.query =", req.query);
      console.debug(
        "getAllTimetables - constructed mongo query =",
        JSON.stringify(query)
      );
    } catch (e) {
      console.debug(
        "getAllTimetables - constructed mongo query (unserializable)"
      );
    }

    const timetables = await Timetable.find(query)
      .populate("uploader", "firstName lastName username avatar")
      .populate("approvedBy", "firstName lastName username")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Timetable.countDocuments(query);

    try {
      console.debug(
        `getAllTimetables - returned ${timetables.length} records (total ${total}). ids=`,
        timetables.map((t) => t._id?.toString())
      );
    } catch (e) {
      console.debug(
        "getAllTimetables - returned results (could not stringify ids)"
      );
    }

    res.status(200).json({
      success: true,
      data: timetables,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching timetables:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching timetables",
      error: error.message,
    });
  }
};

/**
 * Get active timetables for specific course and semester
 */
export const getActiveTimetables = async (req, res) => {
  try {
    const { course, semester, academicYear } = req.query;

    if (!course || !semester || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "Course, semester, and academic year are required",
      });
    }

    const timetables = await Timetable.getActiveTimetables(
      course,
      semester,
      academicYear
    ).populate("uploader", "firstName lastName username avatar");

    res.status(200).json({
      success: true,
      data: timetables,
    });
  } catch (error) {
    console.error("Error fetching active timetables:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active timetables",
      error: error.message,
    });
  }
};

/**
 * Get single timetable by ID
 */
export const getTimetableById = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate("uploader", "firstName lastName username avatar")
      .populate("approvedBy", "firstName lastName username")
      .populate("notificationsSent.recipients", "firstName lastName username");

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    if (
      !timetable.isApproved &&
      !shouldUseTeacherPrivileges(req.user?.role)
    ) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    // Increment view count
    await timetable.incrementViewCount();

    res.status(200).json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching timetable",
      error: error.message,
    });
  }
};

/**
 * Upload new timetable
 */
export const uploadTimetable = async (req, res) => {
  try {
    const {
      title,
      course,
      semester,
      academicYear,
      degreeType,
      description,
      timetableType,
      effectiveFrom,
      effectiveTo,
      tags,
    } = req.body;

    // Allow either an uploaded file or an external fileUrl
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

    // Parse and validate dates first
    const parsedEffectiveFrom = effectiveFrom
      ? new Date(effectiveFrom)
      : new Date();
    const parsedEffectiveTo = effectiveTo ? new Date(effectiveTo) : null;

    // Validate dates
    if (isNaN(parsedEffectiveFrom.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid effectiveFrom date",
      });
    }

    if (parsedEffectiveTo && isNaN(parsedEffectiveTo.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid effectiveTo date",
      });
    }

    // If dates are valid, proceed with file upload or use external link
    let uploadedFile;
    let fileExtension = "";
    let fileSize = 0;
    let originalFileName = "";

    if (req.file) {
      fileExtension = req.file.originalname.split(".").pop().toLowerCase();
      const fileName = `${Date.now()}-${req.file.originalname}`;

      uploadedFile = await fileStorageService.uploadFile(
        req.file.buffer,
        fileName,
        req.file.mimetype,
        "timetables",
        { course, semester, academicYear }
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
      const allowedExts = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "xlsx"];
      fileExtension = allowedExts.includes(extLower) ? extLower : "url";
      originalFileName = fileUrl.split("/").pop() || fileUrl;
      fileSize = 0;
    }

    // Create timetable record
    const timetable = new Timetable({
      title,
      course,
      semester,
      academicYear,
      degreeType,
      description,
      timetableType: timetableType || "Regular",
      effectiveFrom: parsedEffectiveFrom,
      effectiveTo: parsedEffectiveTo,
      tags: parsedTags,
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

    await timetable.save();

    // Populate uploader info
    await timetable.populate("uploader", "firstName lastName username avatar");

    // Create notification for admin if user upload
    if (!req.user.role.includes("admin")) {
      const User = (await import("../models/user.model.js")).default;
      const admins = await User.find({ role: "admin" });

      for (const admin of admins) {
        await createNotification({
          recipient: admin._id,
          sender: req.user._id,
          type: "timetable_uploaded",
          message: `New timetable "${title}" uploaded by ${req.user.firstName} ${req.user.lastName}`,
          link: `/admin/academic/timetables/${timetable._id}`,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Timetable uploaded successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("Error uploading timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading timetable",
      error: error.message,
    });
  }
};

/**
 * Update timetable
 */
export const updateTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    if (
      !timetable.isApproved &&
      !shouldUseTeacherPrivileges(req.user?.role)
    ) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    // Check permissions - teachers and admins can update any timetable
    if (
      !req.user.role.includes("admin") &&
      !req.user.role.includes("teacher")
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this timetable",
      });
    }

    const {
      title,
      course,
      semester,
      courseId,
      semesterId,
      academicYear,
      degreeType,
      description,
      timetableType,
      effectiveFrom,
      effectiveTo,
      isActive,
      tags,
      status,
    } = req.body;

    console.log("DEBUG: updateTimetable received:", {
      course,
      semester,
      courseId,
      semesterId,
      status,
      reqBody: req.body,
    });

    // Parse tags if it's a string
    let parsedTags = timetable.tags;
    if (tags) {
      parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
    }

    // Handle course/semester - form sends courseId/semesterId but we need to resolve to names
    let finalCourse = course || timetable.course;
    let finalSemester = semester || timetable.semester;

    // If we got courseId/semesterId, we need to resolve them to names
    if (courseId && courseId !== course) {
      // Find the course name from the ID
      const Course = (await import("../models/course.model.js")).default;
      const courseDoc = await Course.findById(courseId);
      if (courseDoc) {
        finalCourse = courseDoc.title || courseDoc.name || courseId;
      }
    }

    if (semesterId && semesterId !== semester) {
      // Find the semester name from the ID
      const Semester = (await import("../models/semester.model.js")).default;
      const semesterDoc = await Semester.findById(semesterId);
      if (semesterDoc) {
        finalSemester =
          semesterDoc.title ||
          semesterDoc.name ||
          semesterDoc.number ||
          semesterId;
      }
    }

    // Handle status update and approval logic
    let updateData = {
      title: title || timetable.title,
      course: finalCourse,
      semester: finalSemester,
      academicYear: academicYear || timetable.academicYear,
      degreeType: degreeType || timetable.degreeType,
      description: description || timetable.description,
      timetableType: timetableType || timetable.timetableType,
      effectiveFrom: effectiveFrom
        ? new Date(effectiveFrom)
        : timetable.effectiveFrom,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : timetable.effectiveTo,
      isActive: isActive !== undefined ? isActive : timetable.isActive,
      tags: parsedTags,
    };

    // Handle status field for approval logic
    if (status !== undefined) {
      if (req.user.role.includes("admin")) {
        // Admins can set any status
        updateData.isApproved = status === "Approved";
      } else if (req.user.role.includes("teacher")) {
        // Teachers can set any status
        updateData.isApproved = status === "Approved";
      }
      // Students cannot change approval status
    }

    // Update timetable
    const updatedTimetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("uploader", "firstName lastName username avatar");

    res.status(200).json({
      success: true,
      message: "Timetable updated successfully",
      data: updatedTimetable,
    });
  } catch (error) {
    console.error("Error updating timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error updating timetable",
      error: error.message,
    });
  }
};

/**
 * Delete timetable
 */
export const deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    // Check permissions - teachers and admins can delete any timetable
    if (
      !req.user.role.includes("admin") &&
      !req.user.role.includes("teacher")
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this timetable",
      });
    }

    // Delete from local storage
    try {
      await fileStorageService.deleteFile(timetable.fileId, "timetables");
    } catch (storageError) {
      console.error("Error deleting file from local storage:", storageError);
      // Continue with database deletion even if file deletion fails
      // This prevents orphaned database records
    }

    // Delete from database
    await Timetable.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Timetable deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting timetable",
      error: error.message,
    });
  }
};

/**
 * Approve timetable (Admin only)
 */
export const approveTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    timetable.isApproved = true;
    timetable.approvedBy = req.user._id;
    timetable.approvedAt = new Date();
    await timetable.save();

    // Notify uploader
    await createNotification({
      recipient: timetable.uploader,
      sender: req.user._id,
      type: "timetable_approved",
      message: `Your timetable "${timetable.title}" has been approved`,
      link: `/academic/timetables/${timetable._id}`,
    });

    // Send notifications to relevant users (same course/semester)
    if (req.body.notifyUsers) {
      const User = (await import("../models/user.model.js")).default;
      const relevantUsers = await User.find({
        // Add logic to find users interested in this course/semester
        // This could be based on user preferences or enrollment data
      });

      const recipients = [];
      for (const user of relevantUsers) {
        await createNotification({
          recipient: user._id,
          sender: req.user._id,
          type: "new_timetable",
          message: `New timetable available for ${timetable.course} - ${timetable.semester}`,
          link: `/academic/timetables/${timetable._id}`,
        });
        recipients.push(user._id);
      }

      // Record notification
      await timetable.addNotificationRecord("created", recipients);
    }

    res.status(200).json({
      success: true,
      message: "Timetable approved successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("Error approving timetable:", error);
    res.status(500).json({
      success: false,
      message: "Error approving timetable",
      error: error.message,
    });
  }
};

/**
 * Activate/Deactivate timetable (Admin only)
 */
export const toggleTimetableStatus = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    const newStatus = !timetable.isActive;

    if (newStatus) {
      await timetable.activate();
    } else {
      await timetable.deactivate();
    }

    res.status(200).json({
      success: true,
      message: `Timetable ${newStatus ? "activated" : "deactivated"
        } successfully`,
      data: timetable,
    });
  } catch (error) {
    console.error("Error toggling timetable status:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling timetable status",
      error: error.message,
    });
  }
};

/**
 * Track timetable download
 */
export const trackDownload = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    if (
      !timetable.isApproved &&
      !shouldUseTeacherPrivileges(req.user?.role)
    ) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    await timetable.incrementDownloadCount();

    res.status(200).json({
      success: true,
      downloadUrl: timetable.downloadUrl,
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
  getAllTimetables,
  getActiveTimetables,
  getTimetableById,
  uploadTimetable,
  updateTimetable,
  deleteTimetable,
  approveTimetable,
  toggleTimetableStatus,
  trackDownload,
  uploadMiddleware,
};
