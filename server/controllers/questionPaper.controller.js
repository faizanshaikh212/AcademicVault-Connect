/**
 * Question Papers Controller
 * Handles CRUD operations for question papers
 */

import QuestionPaper from "../models/questionPaper.model.js";
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
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed."
        )
      );
    }
  },
});

/**
 * Get all question papers with filtering
 */
export const getAllQuestionPapers = async (req, res) => {
  try {
    const {
      degreeType,
      course,
      semester,
      subject,
      examYear,
      examType,
      search,
      keyword,
      isApproved,
      page = 1,
      limit = 20,
      sortBy = "examYear",
      sortOrder = "desc",
    } = req.query;

    // Build query
    let query = {};

    // Handle approval status filtering
    if (isApproved !== undefined) {
      query.isApproved = isApproved === "true";
    } else {
      // Default to showing approved items only for public access
      // If user is authenticated, include their own uploads (so teachers see their unapproved uploads)
      if (req.user && req.user._id) {
        query.$or = [{ isApproved: true }, { uploader: req.user._id }];
      } else {
        query.isApproved = true;
      }
    }

    // Flexible regex/OR search across common fields (supports short queries)
    // Accept both `search` and `keyword` query params for compatibility with other endpoints
    const qParam = search || keyword;
    if (qParam) {
      // Helper: escape regex special chars
      const escapeRegex = (s) =>
        String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const raw = String(qParam).trim();
      if (raw.length > 0) {
        const orClauses = [];

        // Add full-phrase match first (case-insensitive substring)
        const escapedFull = escapeRegex(raw);
        orClauses.push({ title: { $regex: escapedFull, $options: "i" } });
        orClauses.push({ course: { $regex: escapedFull, $options: "i" } });
        orClauses.push({ subject: { $regex: escapedFull, $options: "i" } });
        orClauses.push({ description: { $regex: escapedFull, $options: "i" } });
        orClauses.push({ tags: { $regex: escapedFull, $options: "i" } });

        // Tokenize query (split by whitespace) and match any token as substring
        const tokens = raw.split(/\s+/).filter(Boolean);
        tokens.forEach((t) => {
          const esc = escapeRegex(t);
          orClauses.push({ title: { $regex: esc, $options: "i" } });
          orClauses.push({ course: { $regex: esc, $options: "i" } });
          orClauses.push({ subject: { $regex: esc, $options: "i" } });
          orClauses.push({ description: { $regex: esc, $options: "i" } });
          orClauses.push({ tags: { $regex: esc, $options: "i" } });
        });

        // If any token or the full query is numeric, also match examYear
        if (!Number.isNaN(Number(raw))) {
          orClauses.push({ examYear: parseInt(raw) });
        } else {
          tokens.forEach((t) => {
            if (!Number.isNaN(Number(t))) {
              orClauses.push({ examYear: parseInt(t) });
            }
          });
        }

        query.$or = orClauses;
      }
    }

    // Filters
    if (degreeType) query.degreeType = degreeType;
    if (course) query.course = new RegExp(course, "i");
    if (semester) query.semester = semester;
    if (subject) {
      // Make subject search more flexible - handle partial matches and variations
      const subjectPattern = subject
        .replace(/\s+/g, "\\s*")
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.subject = new RegExp(subjectPattern, "i");
    }
    if (examYear) query.examYear = parseInt(examYear);
    if (examType) query.examType = examType;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const questionPapers = await QuestionPaper.find(query)
      .populate("uploader", "firstName lastName username avatar")
      .populate("approvedBy", "firstName lastName username")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await QuestionPaper.countDocuments(query);

    res.status(200).json({
      success: true,
      data: questionPapers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching question papers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching question papers",
      error: error.message,
    });
  }
};

/**
 * Debug endpoint to check available subjects
 */
export const getAvailableSubjects = async (req, res) => {
  try {
    const { degreeType, course } = req.query;

    let query = { isApproved: true };
    if (degreeType) query.degreeType = degreeType;
    if (course) query.course = new RegExp(course, "i");

    const subjects = await QuestionPaper.distinct("subject", query);

    res.status(200).json({
      success: true,
      data: subjects.sort(),
      query: query,
    });
  } catch (error) {
    console.error("Error fetching available subjects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available subjects",
      error: error.message,
    });
  }
};

/**
 * Get question papers by category structure
 */
export const getQuestionPapersByCategory = async (req, res) => {
  try {
    const { degreeType, course } = req.params;

    if (!degreeType) {
      // Return all degree types
      const degreeTypes = await QuestionPaper.distinct("degreeType", {
        isApproved: true,
      });
      return res.status(200).json({
        success: true,
        data: degreeTypes,
      });
    }

    if (!course) {
      // Return courses for the degree type
      const courses = await QuestionPaper.distinct("course", {
        degreeType,
        isApproved: true,
      });
      return res.status(200).json({
        success: true,
        data: courses,
      });
    }

    // Return semesters and papers for the course
    // Include approved papers and also include the requesting user's own uploads (so teachers see theirs)
    // Some legacy records may not have degreeType set. Try degreeType+course first; if no results, fall back to course-only.
    const buildFinalQuery = (baseQuery) => {
      if (req.user && req.user._id) {
        return {
          $or: [
            { ...baseQuery, isApproved: true },
            { ...baseQuery, uploader: req.user._id },
          ],
        };
      }
      return { ...baseQuery, isApproved: true };
    };

    const baseWithDegree = { degreeType, course: new RegExp(course, "i") };
    let papers = await QuestionPaper.find(buildFinalQuery(baseWithDegree))
      .populate("uploader", "firstName lastName username avatar")
      .sort({ semester: 1, examYear: -1, subject: 1 });

    // If no papers found and degreeType was provided, try a fallback search by course only (handles legacy docs without degreeType)
    if ((!papers || papers.length === 0) && degreeType) {
      const baseCourseOnly = { course: new RegExp(course, "i") };
      papers = await QuestionPaper.find(buildFinalQuery(baseCourseOnly))
        .populate("uploader", "firstName lastName username avatar")
        .sort({ semester: 1, examYear: -1, subject: 1 });
    }

    // Debug logging to help troubleshoot
    console.log(
      `Found ${papers.length} papers for degreeType: ${degreeType}, course: ${course}`
    );
    if (papers.length > 0) {
      console.log(
        "Sample subjects:",
        papers.slice(0, 3).map((p) => p.subject)
      );
    }

    // Additional fallback: if still no papers, try a more flexible search
    if (!papers || papers.length === 0) {
      console.log(
        `No papers found for degreeType: ${degreeType}, course: ${course}. Trying flexible search...`
      );

      // Try searching without degreeType constraint
      const flexibleQuery = { course: new RegExp(course, "i") };
      papers = await QuestionPaper.find(buildFinalQuery(flexibleQuery))
        .populate("uploader", "firstName lastName username avatar")
        .sort({ semester: 1, examYear: -1, subject: 1 });

      console.log(`Flexible search found ${papers.length} papers`);
    }

    // Group by semester
    const groupedBySemester = papers.reduce((acc, paper) => {
      const semester = paper.semester || "General";
      if (!acc[semester]) {
        acc[semester] = [];
      }
      acc[semester].push(paper);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: groupedBySemester,
    });
  } catch (error) {
    console.error("Error fetching question papers by category:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching question papers by category",
      error: error.message,
    });
  }
};

/**
 * Get single question paper by ID
 */
export const getQuestionPaperById = async (req, res) => {
  try {
    const questionPaper = await QuestionPaper.findById(req.params.id)
      .populate("uploader", "firstName lastName username avatar")
      .populate("approvedBy", "firstName lastName username");

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found",
      });
    }

    // Increment view count
    await questionPaper.incrementViewCount();

    res.status(200).json({
      success: true,
      data: questionPaper,
    });
  } catch (error) {
    console.error("Error fetching question paper:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching question paper",
      error: error.message,
    });
  }
};

/**
 * Upload new question paper
 */
export const uploadQuestionPaper = async (req, res) => {
  try {
    const {
      title,
      degreeType,
      course,
      semester,
      subject,
      examYear,
      month,
      year,
      examType,
      description,
      tags,
      status,
    } = req.body;

    // Allow either uploaded file or external file URL
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
      fileExtension = req.file.originalname.split(".").pop().toLowerCase();
      const fileName = `${Date.now()}-${req.file.originalname}`;

      // Upload to storage (Google Drive)
      uploadedFile = await fileStorageService.uploadFile(
        req.file.buffer,
        fileName,
        req.file.mimetype,
        "questionPapers",
        { course, subject, degreeType }
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
      const allowedExts = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
      fileExtension = allowedExts.includes(extLower) ? extLower : "url";
      originalFileName = fileUrl.split("/").pop() || fileUrl;
      fileSize = 0;
    }

    // Create question paper record
    const questionPaper = new QuestionPaper({
      title,
      degreeType,
      course,
      semester,
      subject,
      examYear: parseInt(examYear),
      month: month || undefined,
      year: year ? parseInt(year) : examYear ? parseInt(examYear) : undefined,
      examType,
      description,
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

    await questionPaper.save();

    // Populate uploader info
    await questionPaper.populate(
      "uploader",
      "firstName lastName username avatar"
    );

    // Create notification for admin if user upload
    if (!req.user.role.includes("admin")) {
      const User = (await import("../models/user.model.js")).default;
      const admins = await User.find({ role: "admin" });

      for (const admin of admins) {
        await createNotification({
          recipient: admin._id,
          sender: req.user._id,
          type: "question_paper_uploaded",
          message: `New question paper "${title}" uploaded by ${req.user.firstName} ${req.user.lastName}`,
          link: `/admin/academic/question-papers/${questionPaper._id}`,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Question paper uploaded successfully",
      data: questionPaper,
    });
  } catch (error) {
    console.error("Error uploading question paper:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading question paper",
      error: error.message,
    });
  }
};

/**
 * Update question paper
 */
export const updateQuestionPaper = async (req, res) => {
  try {
    const questionPaper = await QuestionPaper.findById(req.params.id);

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found",
      });
    }

    // Check permissions
    if (
      !req.user.role.includes("admin") &&
      questionPaper.uploader.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this question paper",
      });
    }

    const {
      title,
      degreeType,
      course,
      semester,
      subject,
      examYear,
      month,
      year,
      examType,
      description,
      tags,
      status,
    } = req.body;

    // Parse tags if it's a string
    let parsedTags = questionPaper.tags;
    if (tags) {
      parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
    }

    // Prepare update object
    const updateData = {
      title: title || questionPaper.title,
      degreeType: degreeType || questionPaper.degreeType,
      course: course || questionPaper.course,
      semester: semester || questionPaper.semester,
      subject: subject || questionPaper.subject,
      examYear: examYear ? parseInt(examYear) : questionPaper.examYear,
      month: month || questionPaper.month,
      year: year
        ? parseInt(year)
        : questionPaper.year || questionPaper.examYear,
      examType: examType || questionPaper.examType,
      description: description || questionPaper.description,
      tags: parsedTags,
    };

    // Handle status field - convert to isApproved and status
    if (status !== undefined) {
      const statusValue = String(status).trim();
      if (statusValue === "Approved") {
        updateData.isApproved = true;
        updateData.status = "approved";
        updateData.approvedBy = req.user._id;
        updateData.approvedAt = new Date();
      } else if (statusValue === "In for Review") {
        updateData.isApproved = false;
        updateData.status = "pending";
        // Clear approval fields if changing from approved to pending
        if (questionPaper.isApproved) {
          updateData.approvedBy = undefined;
          updateData.approvedAt = undefined;
        }
      } else if (statusValue === "Disapproved") {
        updateData.isApproved = false;
        updateData.status = "rejected";
        updateData.approvedBy = undefined;
        updateData.approvedAt = undefined;
      }
    }

    // Update question paper
    const updatedQuestionPaper = await QuestionPaper.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("uploader", "firstName lastName username avatar");

    res.status(200).json({
      success: true,
      message: "Question paper updated successfully",
      data: updatedQuestionPaper,
    });
  } catch (error) {
    console.error("Error updating question paper:", error);
    res.status(500).json({
      success: false,
      message: "Error updating question paper",
      error: error.message,
    });
  }
};

/**
 * Delete question paper
 */
export const deleteQuestionPaper = async (req, res) => {
  try {
    const questionPaper = await QuestionPaper.findById(req.params.id);

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found",
      });
    }

    // Check permissions
    if (
      !req.user.role.includes("admin") &&
      questionPaper.uploader.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this question paper",
      });
    }

    // Delete from storage
    try {
      await fileStorageService.deleteFile(
        questionPaper.fileId,
        "questionPapers"
      );
    } catch (storageError) {
      console.error("Error deleting file from storage:", storageError);
    }

    // Delete from database
    await QuestionPaper.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Question paper deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting question paper:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting question paper",
      error: error.message,
    });
  }
};

/**
 * Approve question paper (Admin only)
 */
export const approveQuestionPaper = async (req, res) => {
  try {
    const questionPaper = await QuestionPaper.findById(req.params.id);

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found",
      });
    }

    questionPaper.isApproved = true;
    questionPaper.approvedBy = req.user._id;
    questionPaper.approvedAt = new Date();
    await questionPaper.save();

    // Notify uploader
    await createNotification({
      recipient: questionPaper.uploader,
      sender: req.user._id,
      type: "question_paper_approved",
      message: `Your question paper "${questionPaper.title}" has been approved`,
      link: `/academic/question-papers/${questionPaper._id}`,
    });

    res.status(200).json({
      success: true,
      message: "Question paper approved successfully",
      data: questionPaper,
    });
  } catch (error) {
    console.error("Error approving question paper:", error);
    res.status(500).json({
      success: false,
      message: "Error approving question paper",
      error: error.message,
    });
  }
};

/**
 * Track question paper download
 */
export const trackDownload = async (req, res) => {
  try {
    const questionPaper = await QuestionPaper.findById(req.params.id);

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found",
      });
    }

    await questionPaper.incrementDownloadCount();

    res.status(200).json({
      success: true,
      downloadUrl: questionPaper.downloadUrl,
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
  getAllQuestionPapers,
  getQuestionPapersByCategory,
  getQuestionPaperById,
  uploadQuestionPaper,
  updateQuestionPaper,
  deleteQuestionPaper,
  approveQuestionPaper,
  trackDownload,
  getAvailableSubjects,
  uploadMiddleware,
};
