import Project from "../models/project.model.js";
import User from "../models/user.model.js";

// ... (all the functions: createProject, getAllProjects, etc. are here)

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      coverImage,
      screenshots,
      projectLink,
      sourceCodeLink,
      tags,
      extraLinks,
      socialMediaLinks,
    } = req.body;
    if (!title || !description || !coverImage) {
      return res
        .status(400)
        .json({ message: "Title, description, and cover image are required." });
    }
    const project = new Project({
      author: req.user._id,
      title,
      description,
      coverImage,
      screenshots,
      projectLink,
      sourceCodeLink,
      tags,
      extraLinks,
      socialMediaLinks,
    });
    const createdProject = await project.save();
    res.status(201).json(createdProject);
  } catch (error) {
    res.status(500).json({
      message: "Server error creating project.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all projects with search and filtering
 * @route   GET /api/projects
 * @access  Public
 */
const getAllProjects = async (req, res) => {
  try {
    const keyword = req.query.keyword
      ? {
          $or: [
            { title: { $regex: req.query.keyword, $options: "i" } },
            { description: { $regex: req.query.keyword, $options: "i" } },
            { tags: { $regex: req.query.keyword, $options: "i" } },
          ],
        }
      : {};
    const projects = await Project.find({ ...keyword })
      .populate("author", "username firstName lastName profile.avatar")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching projects.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get a single project by ID
 * @route   GET /api/projects/:id
 * @access  Public
 */
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "author",
      "username firstName lastName profile.avatar"
    );
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ message: "Project not found" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching project.",
      error: error.message,
    });
  }
};

/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    // Allow admins to edit any project
    if (
      !req.user.role.includes("admin") &&
      project.author.toString() !== req.user._id.toString()
    ) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this project." });
    }
    const {
      title,
      description,
      coverImage,
      screenshots,
      projectLink,
      sourceCodeLink,
      tags,
      extraLinks,
      socialMediaLinks,
    } = req.body;
    project.title = title || project.title;
    project.description = description || project.description;
    project.coverImage = coverImage || project.coverImage;
    project.screenshots = screenshots ?? project.screenshots;
    project.projectLink = projectLink ?? project.projectLink;
    project.sourceCodeLink = sourceCodeLink ?? project.sourceCodeLink;
    project.tags = tags ?? project.tags;
    project.extraLinks = extraLinks ?? project.extraLinks;
    project.socialMediaLinks = socialMediaLinks ?? project.socialMediaLinks;
    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({
      message: "Server error updating project.",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    // Allow admins to delete any project
    if (
      !req.user.role.includes("admin") &&
      project.author.toString() !== req.user._id.toString()
    ) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this project." });
    }
    await project.deleteOne();
    res.json({ message: "Project removed successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Server error deleting project.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all projects by a specific user ID
 * @route   GET /api/projects/user/:userId
 * @access  Public
 */
const getProjectsByUserId = async (req, res) => {
  try {
    const projects = await Project.find({ author: req.params.userId })
      .populate("author", "username firstName lastName profile.avatar")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching user projects.",
      error: error.message,
    });
  }
};

export {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject, // The duplicate was here
  getProjectsByUserId,
};
