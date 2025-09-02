/**
 * Academic Resources Routes
 * Centralized routing for all academic resource endpoints
 */

import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { admin } from '../middleware/admin.middleware.js';

// Import controllers
import academicNoteController from '../controllers/academicNote.controller.js';
import questionPaperController from '../controllers/questionPaper.controller.js';
import syllabusController from '../controllers/syllabus.controller.js';
import timetableController from '../controllers/timetable.controller.js';

const router = express.Router();

// ===== ACADEMIC NOTES ROUTES =====

// Public routes
router.get('/notes', academicNoteController.getAllNotes);
router.get('/notes/:id', academicNoteController.getNoteById);
router.post('/notes/:id/download', academicNoteController.trackDownload);

// Protected routes (authenticated users)
router.post('/notes', 
  protect, 
  academicNoteController.uploadMiddleware, 
  academicNoteController.uploadNote
);
router.put('/notes/:id', protect, academicNoteController.updateNote);
router.delete('/notes/:id', protect, academicNoteController.deleteNote);

// Admin only routes
router.post('/notes/:id/approve', protect, admin, academicNoteController.approveNote);
router.post('/notes/:id/reject', protect, admin, academicNoteController.rejectNote);

// ===== QUESTION PAPERS ROUTES =====

// Public routes
router.get('/question-papers', questionPaperController.getAllQuestionPapers);
router.get('/question-papers/categories', questionPaperController.getQuestionPapersByCategory);
router.get('/question-papers/categories/:degreeType', questionPaperController.getQuestionPapersByCategory);
router.get('/question-papers/categories/:degreeType/:course', questionPaperController.getQuestionPapersByCategory);
router.get('/question-papers/:id', questionPaperController.getQuestionPaperById);
router.post('/question-papers/:id/download', questionPaperController.trackDownload);

// Protected routes (authenticated users)
router.post('/question-papers', 
  protect, 
  questionPaperController.uploadMiddleware, 
  questionPaperController.uploadQuestionPaper
);
router.put('/question-papers/:id', protect, questionPaperController.updateQuestionPaper);
router.delete('/question-papers/:id', protect, questionPaperController.deleteQuestionPaper);

// Admin only routes
router.post('/question-papers/:id/approve', protect, admin, questionPaperController.approveQuestionPaper);

// ===== SYLLABUS ROUTES =====

// Public routes
router.get('/syllabus', syllabusController.getAllSyllabus);
router.get('/syllabus/:id', syllabusController.getSyllabusById);
router.post('/syllabus/:id/download', syllabusController.trackDownload);

// Protected routes (authenticated users)
router.post('/syllabus', 
  protect, 
  syllabusController.uploadMiddleware, 
  syllabusController.uploadSyllabus
);
router.put('/syllabus/:id', protect, syllabusController.updateSyllabus);
router.put('/syllabus/:id/file', 
  protect, 
  syllabusController.uploadMiddleware, 
  syllabusController.updateSyllabusFile
);
router.delete('/syllabus/:id', protect, syllabusController.deleteSyllabus);

// Admin only routes
router.post('/syllabus/:id/approve', protect, admin, syllabusController.approveSyllabus);

// ===== TIMETABLES ROUTES =====

// Public routes
router.get('/timetables', timetableController.getAllTimetables);
router.get('/timetables/active', timetableController.getActiveTimetables);
router.get('/timetables/:id', timetableController.getTimetableById);
router.post('/timetables/:id/download', timetableController.trackDownload);

// Protected routes (authenticated users)
router.post('/timetables', 
  protect, 
  timetableController.uploadMiddleware, 
  timetableController.uploadTimetable
);
router.put('/timetables/:id', protect, timetableController.updateTimetable);
router.delete('/timetables/:id', protect, timetableController.deleteTimetable);

// Admin only routes
router.post('/timetables/:id/approve', protect, admin, timetableController.approveTimetable);
router.post('/timetables/:id/toggle-status', protect, admin, timetableController.toggleTimetableStatus);

// ===== ADMIN ANALYTICS ROUTES =====

// Get analytics data for admin dashboard
router.get('/analytics/overview', protect, admin, async (req, res) => {
  try {
    const AcademicNote = (await import('../models/academicNote.model.js')).default;
    const QuestionPaper = (await import('../models/questionPaper.model.js')).default;
    const Syllabus = (await import('../models/syllabus.model.js')).default;
    const Timetable = (await import('../models/timetable.model.js')).default;

    // Get counts
    const notesCount = await AcademicNote.countDocuments({ isApproved: true });
    const questionPapersCount = await QuestionPaper.countDocuments({ isApproved: true });
    const syllabusCount = await Syllabus.countDocuments({ isApproved: true });
    const timetablesCount = await Timetable.countDocuments({ isApproved: true });

    // Get pending approvals
    const pendingNotes = await AcademicNote.countDocuments({ isApproved: false });
    const pendingQuestionPapers = await QuestionPaper.countDocuments({ isApproved: false });
    const pendingSyllabus = await Syllabus.countDocuments({ isApproved: false });
    const pendingTimetables = await Timetable.countDocuments({ isApproved: false });

    // Get recent uploads (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentNotes = await AcademicNote.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentQuestionPapers = await QuestionPaper.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentSyllabus = await Syllabus.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentTimetables = await Timetable.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Get top downloaded resources
    const topNotes = await AcademicNote.find({ isApproved: true })
      .sort({ downloadCount: -1 })
      .limit(5)
      .populate('uploader', 'firstName lastName username');

    const topQuestionPapers = await QuestionPaper.find({ isApproved: true })
      .sort({ downloadCount: -1 })
      .limit(5)
      .populate('uploader', 'firstName lastName username');

    res.status(200).json({
      success: true,
      data: {
        counts: {
          notes: notesCount,
          questionPapers: questionPapersCount,
          syllabus: syllabusCount,
          timetables: timetablesCount,
        },
        pending: {
          notes: pendingNotes,
          questionPapers: pendingQuestionPapers,
          syllabus: pendingSyllabus,
          timetables: pendingTimetables,
          total: pendingNotes + pendingQuestionPapers + pendingSyllabus + pendingTimetables,
        },
        recent: {
          notes: recentNotes,
          questionPapers: recentQuestionPapers,
          syllabus: recentSyllabus,
          timetables: recentTimetables,
          total: recentNotes + recentQuestionPapers + recentSyllabus + recentTimetables,
        },
        topResources: {
          notes: topNotes,
          questionPapers: topQuestionPapers,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message,
    });
  }
});

// Get pending approvals for admin
router.get('/pending-approvals', protect, admin, async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let results = {};

    if (!type || type === 'notes') {
      const AcademicNote = (await import('../models/academicNote.model.js')).default;
      const notes = await AcademicNote.find({ isApproved: false })
        .populate('uploader', 'firstName lastName username avatar')
        .sort({ createdAt: -1 })
        .skip(type === 'notes' ? skip : 0)
        .limit(type === 'notes' ? parseInt(limit) : 5);
      results.notes = notes;
    }

    if (!type || type === 'questionPapers') {
      const QuestionPaper = (await import('../models/questionPaper.model.js')).default;
      const questionPapers = await QuestionPaper.find({ isApproved: false })
        .populate('uploader', 'firstName lastName username avatar')
        .sort({ createdAt: -1 })
        .skip(type === 'questionPapers' ? skip : 0)
        .limit(type === 'questionPapers' ? parseInt(limit) : 5);
      results.questionPapers = questionPapers;
    }

    if (!type || type === 'syllabus') {
      const Syllabus = (await import('../models/syllabus.model.js')).default;
      const syllabus = await Syllabus.find({ isApproved: false })
        .populate('uploader', 'firstName lastName username avatar')
        .sort({ createdAt: -1 })
        .skip(type === 'syllabus' ? skip : 0)
        .limit(type === 'syllabus' ? parseInt(limit) : 5);
      results.syllabus = syllabus;
    }

    if (!type || type === 'timetables') {
      const Timetable = (await import('../models/timetable.model.js')).default;
      const timetables = await Timetable.find({ isApproved: false })
        .populate('uploader', 'firstName lastName username avatar')
        .sort({ createdAt: -1 })
        .skip(type === 'timetables' ? skip : 0)
        .limit(type === 'timetables' ? parseInt(limit) : 5);
      results.timetables = timetables;
    }

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals',
      error: error.message,
    });
  }
});

// Global search across all academic resources
router.get('/search', async (req, res) => {
  try {
    const { q, type, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const searchQuery = { 
      $text: { $search: q }, 
      isApproved: true 
    };

    let results = {};

    if (!type || type === 'notes') {
      const AcademicNote = (await import('../models/academicNote.model.js')).default;
      const notes = await AcademicNote.find(searchQuery)
        .populate('uploader', 'firstName lastName username')
        .limit(parseInt(limit))
        .sort({ score: { $meta: 'textScore' } });
      results.notes = notes;
    }

    if (!type || type === 'questionPapers') {
      const QuestionPaper = (await import('../models/questionPaper.model.js')).default;
      const questionPapers = await QuestionPaper.find(searchQuery)
        .populate('uploader', 'firstName lastName username')
        .limit(parseInt(limit))
        .sort({ score: { $meta: 'textScore' } });
      results.questionPapers = questionPapers;
    }

    if (!type || type === 'syllabus') {
      const Syllabus = (await import('../models/syllabus.model.js')).default;
      const syllabus = await Syllabus.find(searchQuery)
        .populate('uploader', 'firstName lastName username')
        .limit(parseInt(limit))
        .sort({ score: { $meta: 'textScore' } });
      results.syllabus = syllabus;
    }

    if (!type || type === 'timetables') {
      const Timetable = (await import('../models/timetable.model.js')).default;
      const timetables = await Timetable.find(searchQuery)
        .populate('uploader', 'firstName lastName username')
        .limit(parseInt(limit))
        .sort({ score: { $meta: 'textScore' } });
      results.timetables = timetables;
    }

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: error.message,
    });
  }
});

export default router;