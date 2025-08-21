import Blog from "../models/blog.model.js";
import User from "../models/user.model.js";

/**
 * Creates a new blog post
 * @route POST /api/blogs
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing blog data
 * @param {string} req.body.title - Blog title
 * @param {string} req.body.content - Blog content
 * @param {string} req.body.coverImage - URL of the blog cover image
 * @param {string[]} req.body.tags - Array of blog tags
 * @param {Object} res - Express response object
 * @returns {Object} Created blog post
 */
const createBlog = async (req, res) => {
  try {
    const { title, content, coverImage, tags } = req.body;
    if (!title || !content || !coverImage) {
      return res
        .status(400)
        .json({ message: "Title, content, and cover image are required." });
    }
    const blog = new Blog({
      author: req.user._id,
      title,
      content,
      coverImage,
      tags,
    });
    const createdBlog = await blog.save();
    res.status(201).json(createdBlog);
  } catch (error) {
    res.status(500).json({
      message: "Server error creating blog post.",
      error: error.message,
    });
  }
};
const getAllBlogs = async (req, res) => {
  try {
    const keyword = req.query.keyword
      ? {
          $or: [
            { title: { $regex: req.query.keyword, $options: "i" } },
            { tags: { $regex: req.query.keyword, $options: "i" } },
          ],
        }
      : {};
    const blogs = await Blog.find({ ...keyword })
      .populate("author", "username firstName lastName profile.avatar")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error fetching blogs.", error: error.message });
  }
};
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "author",
      "username firstName lastName profile.avatar"
    );
    if (blog) {
      res.json(blog);
    } else {
      res.status(404).json({ message: "Blog post not found" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching blog post.",
      error: error.message,
    });
  }
};
const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // Allow admins to edit any blog post
    if (
      !req.user.role.includes("admin") &&
      blog.author.toString() !== req.user._id.toString()
    ) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this blog post." });
    }

    const { title, content, coverImage, tags } = req.body;
    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.coverImage = coverImage || blog.coverImage;
    blog.tags = tags ?? blog.tags;
    const updatedBlog = await blog.save();
    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({
      message: "Server error updating blog post.",
      error: error.message,
    });
  }
};
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // Allow admins to delete any blog post
    if (
      !req.user.role.includes("admin") &&
      blog.author.toString() !== req.user._id.toString()
    ) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this blog post." });
    }

    await blog.deleteOne();
    res.json({ message: "Blog post removed successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Server error deleting blog post.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all blogs by a specific user ID
 * @route   GET /api/blogs/user/:userId
 * @access  Public
 */
const getBlogsByUserId = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.params.userId })
      .populate("author", "username firstName lastName profile.avatar")
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching user blogs.",
      error: error.message,
    });
  }
};

export {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getBlogsByUserId,
};
