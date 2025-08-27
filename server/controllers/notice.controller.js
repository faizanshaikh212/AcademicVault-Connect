import Notice from "../models/notice.model.js";
import Course from "../models/course.model.js";

export const listNotices = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: { $ne: true } };
    if (search) query.$text = { $search: search };
    const notices = await Notice.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notices" });
  }
};

export const listTeacherNotices = async (req, res) => {
  try {
    const notices = await Notice.find({
      createdBy: req.user._id,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch teacher notices" });
  }
};

export const createNotice = async (req, res) => {
  try {
    const { title, description, tags, target, attachments, coverImage } =
      req.body;

    // Validate target.course if provided
    if (target?.course) {
      const course = await Course.findById(target.course);
      if (!course) return res.status(400).json({ message: "Invalid course" });
    }

    // If no cover image was uploaded, use the default
    const coverImageData = coverImage || {
      url: "placeholderimage1234567890.png",
      fileId: null,
    };

    const notice = await Notice.create({
      title,
      description,
      coverImage: coverImageData,
      tags: tags || [],
      target: target || {},
      attachments: attachments || [],
      createdBy: req.user._id,
    });

    res.status(201).json(notice);
  } catch (error) {
    console.error("Failed to create notice:", error);
    res.status(500).json({ message: "Failed to create notice" });
  }
};

export const getNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notice" });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });

    // Delete files from Google Drive
    if (notice.coverImage?.fileId) {
      try {
        await deleteFile(notice.coverImage.fileId);
      } catch (error) {
        console.error("Failed to delete cover image:", error);
      }
    }

    if (notice.attachments?.length > 0) {
      for (const attachment of notice.attachments) {
        try {
          await deleteFile(attachment.fileId);
        } catch (error) {
          console.error(
            `Failed to delete attachment ${attachment.name}:`,
            error
          );
        }
      }
    }

    // Soft delete
    notice.isDeleted = true;
    await notice.save();
    res.json({ message: "Notice deleted" });
  } catch (error) {
    console.error("Failed to delete notice:", error);
    res.status(500).json({ message: "Failed to delete notice" });
  }
};
