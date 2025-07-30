import User from "../models/user.model.js";
import RoleRequest from "../models/roleRequest.model.js";
import Notification from "../models/notification.model.js";
import Project from "../models/project.model.js";

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProjects = await Project.countDocuments();
    const pendingRequests = await RoleRequest.countDocuments({
      status: "pending",
    });

    res.json({
      totalUsers,
      totalProjects,
      pendingRequests,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching dashboard stats.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all users (for admin)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error fetching users.", error: error.message });
  }
};

/**
 * @desc    Update a user's role (for admin)
 * @route   PUT /api/admin/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { roles } = req.body; // Expecting an array of roles

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (
      !Array.isArray(roles) ||
      roles.some((r) => !["student", "teacher", "admin"].includes(r))
    ) {
      return res.status(400).json({ message: "Invalid roles array provided." });
    }

    user.role = roles; // Assign the new array of roles
    await user.save();
    res.json({ message: `User roles updated.` });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Server error updating user role.",
        error: error.message,
      });
  }
};

/**
 * @desc    Get all role requests (for admin)
 * @route   GET /api/admin/rolerequests
 * @access  Private/Admin
 */
const getRoleRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.find({ status: "pending" }).populate(
      "user",
      "username firstName lastName email"
    );
    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching role requests.",
      error: error.message,
    });
  }
};

/**
 * @desc    Handle a role request (approve/reject)
 * @route   POST /api/admin/rolerequests/:id
 * @access  Private/Admin
 */
const handleRoleRequest = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const request = await RoleRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Role request not found." });
    }

    const user = await User.findById(request.user);
    if (!user) {
      request.status = "rejected";
      await request.save();
      return res
        .status(404)
        .json({ message: "User associated with request not found." });
    }

    if (action === "approve") {
      user.role = "teacher";
      await user.save();
      request.status = "approved";
      await request.save();

      // Create a notification for the user
      await Notification.create({
        recipient: user._id,
        sender: req.user._id, // The admin who approved
        type: "role_approved",
        link: `/profile/${user.username}`, // Link to their profile
      });

      res.json({ message: "Request approved. User role updated to teacher." });
    } else if (action === "reject") {
      request.status = "rejected";
      await request.save();

      // Create a notification for the user
      await Notification.create({
        recipient: user._id,
        sender: req.user._id, // The admin who rejected
        type: "role_rejected",
        link: `/profile/${user.username}`,
      });

      res.json({ message: "Request rejected." });
    } else {
      res.status(400).json({ message: "Invalid action." });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error handling role request.",
      error: error.message,
    });
  }
};

export {
  getAllUsers,
  updateUserRole,
  getRoleRequests,
  handleRoleRequest,
  getDashboardStats,
};
