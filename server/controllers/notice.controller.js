import { Notice } from "../models/notice.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { shouldUseTeacherPrivileges } from "../utils/roleUtils.js";

// Get all published notices
export const getPublishedNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ isPublished: true })
      .populate("author", "username")
      .sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notices", error: error.message });
  }
};

// Get all notices (admin)
export const getAllNotices = async (req, res) => {
  try {
    console.log("Attempting to fetch all notices...");
    const notices = await Notice.find()
      .populate("author", "username")
      .sort({ createdAt: -1 });
    console.log("Successfully fetched notices:", notices.length);
    res.json(notices);
  } catch (error) {
    console.error("Error in getAllNotices:", error);
    res.status(500).json({ message: "Failed to fetch notices", error: error.message });
  }
};

// Get single notice
export const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id).populate("author", "username");
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    if (!notice.isPublished && !shouldUseTeacherPrivileges(req.user?.role)) {
      return res.status(404).json({ message: "Notice not found" });
    }
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notice", error: error.message });
  }
};

// Create notice (teacher or admin)
export const createNotice = async (req, res) => {
  try {
    const { title, content, summary, coverImage, attachments } = req.body;
    if (!title || !content || !summary || !coverImage) {
      return res.status(400).json({ message: "Title, content, summary and coverImage are required fields" });
    }

    if (attachments && !Array.isArray(attachments)) {
      return res.status(400).json({ message: "Attachments must be an array" });
    }

    const notice = await Notice.create({
      title,
      content,
      summary,
      coverImage,
      author: req.user._id,
      isPublished: true,
      attachments: attachments || [],
    });

    // Notify all users with role 'student'
    const students = await User.find({ role: "student" }, "_id");
    const notifications = students.map((s) => ({
      recipient: s._id,
      sender: req.user._id,
      type: "new_notice",
      message: title,
      link: `/notices/${notice._id}`,
      isRead: false,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: "Failed to create notice", error: error.message });
  }
};

// Update notice
export const updateNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, { ...req.body }, { new: true });
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: "Failed to update notice", error: error.message });
  }
};

// Delete notice
export const deleteNotice = async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: "Notice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete notice", error: error.message });
  }
};
