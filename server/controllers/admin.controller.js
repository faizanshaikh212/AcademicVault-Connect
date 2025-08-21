import User from "../models/user.model.js";
import RoleRequest from "../models/roleRequest.model.js";
import PremiumRequest from "../models/premiumRequest.model.js";
import Notification from "../models/notification.model.js";
import Project from "../models/project.model.js";
import Blog from "../models/blog.model.js";
import { News } from "../models/news.model.js";

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProjects,
      totalBlogs,
      totalNews,
      pendingRoleRequests,
      pendingPremiumRequests,
      premiumUsers,
      teacherUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Blog.countDocuments(),
      News.countDocuments(),
      RoleRequest.countDocuments({ status: "pending" }),
      PremiumRequest.countDocuments({ status: "pending" }),
      User.countDocuments({ "premium.isPremium": true }),
      User.countDocuments({ role: "teacher" }),
    ]);

    res.json({
      totalUsers,
      totalProjects,
      totalBlogs,
      totalNews,
      pendingRoleRequests,
      pendingPremiumRequests,
      premiumUsers,
      teacherUsers,
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
    res.status(500).json({
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
      try {
        // Remove student role and add teacher role
        user.role = user.role.filter((r) => r !== "student");
        if (!user.role.includes("teacher")) {
          user.role.push("teacher");
        }

        // Save user first to ensure role update is successful
        await user.save();

        // Update request status
        request.status = "approved";
        await request.save();

        // Create notification
        await Notification.create({
          recipient: user._id,
          sender: req.user._id,
          type: "role_approved",
          link: `/profile/${user.username}`,
        });

        // Double check that the role was saved
        const updatedUser = await User.findById(user._id);
        if (!updatedUser.role.includes("teacher")) {
          throw new Error("Failed to update user role");
        }

        res.json({
          message: "Request approved. User role updated to teacher.",
        });
      } catch (error) {
        // If anything fails, roll back the changes
        request.status = "pending";
        await request.save();
        throw error; // This will be caught by the outer try-catch block
      }
    } else if (action === "reject") {
      request.status = "rejected";
      await request.save();
      await Notification.create({
        recipient: user._id,
        sender: req.user._id,
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

/**
 * @desc    Get all premium users
 * @route   GET /api/admin/premium-users
 * @access  Private/Admin
 */
const getPremiumUsers = async (req, res) => {
  try {
    const users = await User.find({ "premium.isPremium": true }).select(
      "-password"
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching premium users.",
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new user
 * @route   POST /api/admin/users
 * @access  Private/Admin
 */
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, role, premium } =
      req.body;

    // Basic validation
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({
        message:
          "Please provide all required fields (firstName, lastName, username, email, password).",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address." });
    }

    // Validate username format (alphanumeric and underscore only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message: "Username can only contain letters, numbers, and underscores.",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already registered."
            : "Username already taken.",
      });
    }

    // Create user with validated data
    const user = await User.create({
      firstName,
      lastName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      role: role || ["student"],
      premium: premium
        ? {
            isPremium: premium.isPremium || false,
            premiumSince: premium.isPremium ? new Date() : null,
            premiumExpiry: premium.isPremium
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              : null,
            lastRenewal: premium.isPremium ? new Date() : null,
          }
        : undefined,
    });

    res.status(201).json({
      message: "User created successfully.",
      user: { ...user.toObject(), password: undefined },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      message: "Server error creating user.",
      error: error.message,
    });
  }
};

/**
 * @desc    Update a user
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { firstName, lastName, username, email, role, premium } = req.body;

    // Update basic fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.username = username || user.username;
    user.email = email || user.email;
    user.role = role || user.role;

    // Update premium status if provided
    if (premium) {
      user.premium = {
        ...user.premium,
        ...premium,
        premiumExpiry: premium.isPremium
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
      };
    }

    await user.save();
    res.json({
      message: "User updated successfully.",
      user: { ...user.toObject(), password: undefined },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Username or email already exists.",
        error: error.message,
      });
    }
    res.status(500).json({
      message: "Server error updating user.",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "User not found." });
    }

    // Clean up associated data
    await Promise.all([
      // Delete related data
      RoleRequest.deleteMany({ user: req.params.id }),
      PremiumRequest.deleteMany({ user: req.params.id }),
      Notification.deleteMany({
        $or: [{ recipient: req.params.id }, { sender: req.params.id }],
      }),
      Project.updateMany(
        { collaborators: req.params.id },
        { $pull: { collaborators: req.params.id } }
      ),
    ]);

    res.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      message: "Server error deleting user.",
      error: error.message,
    });
  }
};

/**
 * @desc    Renew premium for a user
 * @route   POST /api/admin/users/:id/renew-premium
 * @access  Private/Admin
 */
const renewPremium = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const currentDate = new Date();
    const existingExpiryDate = user.premium?.premiumExpiry
      ? new Date(user.premium.premiumExpiry)
      : null;
    let newExpiryDate;

    // Calculate new expiry date
    if (existingExpiryDate && existingExpiryDate > currentDate) {
      // Add 30 days to existing expiry date
      newExpiryDate = new Date(existingExpiryDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + 30);
    } else {
      // Add 30 days to current date
      newExpiryDate = new Date(currentDate);
      newExpiryDate.setDate(currentDate.getDate() + 30);
    }

    // Update the user's premium status using findByIdAndUpdate for atomic operation
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          "premium.isPremium": true,
          "premium.premiumSince": user.premium?.premiumSince || currentDate,
          "premium.premiumExpiry": newExpiryDate,
          "premium.lastRenewal": currentDate,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new Error("Failed to update user premium status");
    }

    // Send notification to user
    await Notification.create({
      recipient: user._id,
      sender: req.user._id,
      type: "premium_renewed",
      message: `Your premium subscription has been renewed until ${newExpiryDate.toLocaleDateString()}.`,
      link: `/settings`,
    });

    res.json({
      message: "Premium renewed successfully.",
      user: { ...updatedUser.toObject(), password: undefined },
      expiryDate: newExpiryDate,
    });
  } catch (error) {
    console.error("Error renewing premium:", error);
    res.status(500).json({
      message: "Server error renewing premium.",
      error: error.message,
    });
  }
};

/**
 * @desc    Revoke premium from a user
 * @route   POST /api/admin/users/:id/revoke-premium
 * @access  Private/Admin
 */
const revokePremium = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.premium = {
      isPremium: false,
      premiumSince: null,
      premiumExpiry: null,
      lastRenewal: null,
    };

    await user.save();

    // Send notification to user
    await Notification.create({
      recipient: user._id,
      sender: req.user._id,
      type: "premium_revoked",
      message: "Your premium subscription has been revoked.",
      link: `/settings`,
    });

    res.json({
      message: "Premium revoked successfully.",
      user: { ...user.toObject(), password: undefined },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error revoking premium.",
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
  updateUser,
  deleteUser,
  getPremiumUsers,
  renewPremium,
  revokePremium,
  createUser,
  deletePremiumRequest,
};

/**
 * @desc    Delete a premium request
 * @route   DELETE /api/admin/premium-requests/:id
 * @access  Private/Admin
 */
const deletePremiumRequest = async (req, res) => {
  try {
    const result = await PremiumRequest.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Premium request not found." });
    }

    res.json({ message: "Premium request deleted successfully." });
  } catch (error) {
    console.error("Error deleting premium request:", error);
    res.status(500).json({
      message: "Server error deleting premium request.",
      error: error.message,
    });
  }
};
