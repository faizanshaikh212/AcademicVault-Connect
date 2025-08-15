import Page from "../models/page.model.js";

/**
 * @desc    Get a page by its slug
 * @route   GET /api/pages/:slug
 * @access  Public
 */
export const getPageBySlug = async (req, res) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug });
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }
    res.json(page);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch page",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all pages
 * @route   GET /api/pages
 * @access  Admin
 */
export const getAllPages = async (req, res) => {
  try {
    const pages = await Page.find().sort({ createdAt: -1 });
    res.json(pages);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch pages",
      error: error.message,
    });
  }
};

/**
 * @desc    Update a page
 * @route   PUT /api/pages/:slug
 * @access  Admin
 */
export const updatePage = async (req, res) => {
  try {
    const { title, content } = req.body;
    const page = await Page.findOneAndUpdate(
      { slug: req.params.slug },
      {
        title,
        content,
        lastUpdatedBy: req.user._id,
      },
      { new: true, upsert: true }
    );
    res.json(page);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update page",
      error: error.message,
    });
  }
};
