import User from "../models/user.model.js";
import RoleRequest from "../models/roleRequest.model.js";
import Notification from "../models/notification.model.js";

/**
 * @desc    Get user profile by username
 * @route   GET /api/users/:username
 * @access  Public
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "-password -email -socials.blockedUsers -settings.theme"
    );

    if (user) {
      const publicProfile = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        profile: user.profile,
        createdAt: user.createdAt,
        socials: {
          followersCount: user.socials.followers.length,
          followingCount: user.socials.following.length,
          friendsCount: user.socials.friends.length,
        },
        isFollowing: false, // Default to false
      };

      // **THE FIX:** If a user is logged in (which we can check via req.user,
      // even on a public route if a token is sent), check the follow status.
      if (req.user) {
        const currentUser = await User.findById(req.user._id);
        if (currentUser && currentUser.socials.following.includes(user._id)) {
          publicProfile.isFollowing = true;
        }
      }

      res.json(publicProfile);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching user profile.",
      error: error.message,
    });
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.username = req.body.username || user.username;

      if (req.body.profile) {
        user.profile.bio = req.body.profile.bio ?? user.profile.bio;
        user.profile.connections =
          req.body.profile.connections ?? user.profile.connections;

        // Handle avatar updates with GIF check
        if (req.body.profile.avatar !== undefined) {
          if (req.body.profile.avatar === null) {
            // Remove avatar
            user.profile.avatar = "";
            user.profile.isAvatarGif = false;
          } else if (req.body.profile.avatar) {
            const isGif = req.body.profile.avatar.endsWith(".gif");
            if (isGif && !user.premium.isPremium) {
              return res
                .status(403)
                .json({ message: "Animated avatars are a premium feature." });
            }

            // Add current avatar to history if it exists and is not already in history
            if (
              user.profile.avatar &&
              !user.profile.avatarHistory.includes(user.profile.avatar)
            ) {
              user.profile.avatarHistory.unshift(user.profile.avatar);
              // Keep only last 3 avatars
              user.profile.avatarHistory = user.profile.avatarHistory.slice(
                0,
                3
              );
            }

            user.profile.avatar = req.body.profile.avatar;
            user.profile.isAvatarGif = isGif;
          }
        }
      }

      const updatedUser = await user.save();

      // Return the full, updated user object
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Username already taken." });
    }
    res.status(500).json({
      message: "Server error updating profile.",
      error: error.message,
    });
  }
};

/**
 * @desc    Update user settings
 * @route   PUT /api/users/settings
 * @access  Private
 */
const updateUserSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.settings) {
        user.settings.isPrivate =
          req.body.settings.isPrivate ?? user.settings.isPrivate;
        user.settings.theme = req.body.settings.theme ?? user.settings.theme;
        user.settings.blockedContent =
          req.body.settings.blockedContent ?? user.settings.blockedContent;
      }

      const updatedUser = await user.save();
      res.json(updatedUser.settings);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error updating settings.",
      error: error.message,
    });
  }
};

/**
 * @desc    Follow or unfollow a user
 * @route   POST /api/users/:id/follow
 * @access  Private
 */
const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }
    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User to follow not found." });
    }
    const isFollowing = currentUser.socials.following.includes(targetUserId);
    if (isFollowing) {
      currentUser.socials.following.pull(targetUserId);
      targetUser.socials.followers.pull(currentUserId);
      await currentUser.save();
      await targetUser.save();
      return res.json({
        message: "Successfully unfollowed user.",
        action: "unfollowed",
        isFollowing: false,
      });
    } else {
      currentUser.socials.following.push(targetUserId);
      targetUser.socials.followers.push(currentUserId);
      await currentUser.save();
      await targetUser.save();

      const notification = await Notification.create({
        recipient: targetUser._id,
        sender: currentUser._id,
        type: "follow",
        link: `/profile/${currentUser.username}`,
      });

      // THE FIX: Safely check if req.io exists before emitting
      if (req.io) {
        req.io
          .to(targetUser._id.toString())
          .emit("new notification", notification);
      }

      return res.json({
        message: "Successfully followed user.",
        action: "followed",
        isFollowing: true,
      });
    }
  } catch (error) {
    console.error("Follow Error:", error);
    res.status(500).json({
      message: "Server error during follow action.",
      error: error.message,
    });
  }
};

/**
 * @desc    Send, accept, decline, or remove a friend
 * @route   POST /api/users/:id/friend
 * @access  Private
 */
const handleFriendRequest = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;
    const { action } = req.body;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot friend yourself." });
    }
    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    switch (action) {
      case "send":
        if (
          targetUser.socials.friendRequests.includes(currentUserId) ||
          currentUser.socials.friends.includes(targetUserId)
        ) {
          return res.status(400).json({
            message: "Friend request already sent or you are already friends.",
          });
        }
        targetUser.socials.friendRequests.push(currentUserId);
        await targetUser.save();

        // Create and emit notification for friend request
        const frNotification = await Notification.create({
          recipient: targetUser._id,
          sender: currentUser._id,
          type: "friend_request",
          link: `/profile/${currentUser.username}`,
        });
        if (req.io)
          req.io
            .to(targetUser._id.toString())
            .emit("new notification", frNotification);

        return res.json({ message: "Friend request sent." });

      case "accept":
        if (!currentUser.socials.friendRequests.includes(targetUserId)) {
          return res
            .status(400)
            .json({ message: "No friend request from this user." });
        }
        currentUser.socials.friendRequests.pull(targetUserId);
        currentUser.socials.friends.push(targetUserId);
        targetUser.socials.friends.push(currentUserId);
        await currentUser.save();
        await targetUser.save();

        // Create and emit notification for accepted request
        const accNotification = await Notification.create({
          recipient: targetUser._id,
          sender: currentUser._id,
          type: "friend_request_accepted",
          link: `/profile/${currentUser.username}`,
        });
        if (req.io)
          req.io
            .to(targetUser._id.toString())
            .emit("new notification", accNotification);

        return res.json({ message: "Friend request accepted." });

      // ... (decline and remove cases are unchanged)
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error during friend action.",
      error: error.message,
    });
  }
};

/**
 * @desc    Block or unblock a user
 * @route   POST /api/users/:id/block
 * @access  Private
 */
const blockUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot block yourself." });
    }

    const currentUser = await User.findById(currentUserId);
    const isBlocked = currentUser.socials.blockedUsers.includes(targetUserId);

    if (isBlocked) {
      // Unblock user
      currentUser.socials.blockedUsers.pull(targetUserId);
      await currentUser.save();
      return res.json({ message: "User unblocked." });
    } else {
      // Block user
      currentUser.socials.blockedUsers.push(targetUserId);
      // Also remove any existing social connections
      currentUser.socials.friends.pull(targetUserId);
      currentUser.socials.following.pull(targetUserId);
      currentUser.socials.followers.pull(targetUserId);

      const targetUser = await User.findById(targetUserId);
      if (targetUser) {
        targetUser.socials.friends.pull(currentUserId);
        targetUser.socials.following.pull(currentUserId);
        targetUser.socials.followers.pull(currentUserId);
        await targetUser.save();
      }

      await currentUser.save();
      return res.json({ message: "User blocked." });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error during block action.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all public user profiles for the network page
 * @route   GET /api/users/all
 * @access  Public
 */
const getAllPublicUsers = async (req, res) => {
  try {
    // Find users that are not private and select only public fields
    const users = await User.find({ "settings.isPrivate": false }).select(
      "firstName lastName username profile.avatar profile.bio"
    );
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error fetching users.", error: error.message });
  }
};

/**
 * @desc    Submit a request to become a teacher
 * @route   POST /api/users/request-teacher-role
 * @access  Private
 */
const submitRoleRequest = async (req, res) => {
  const { fullName, qualifications, bio } = req.body;
  const userId = req.user._id;

  try {
    // Check if a request already exists
    const existingRequest = await RoleRequest.findOne({ user: userId });
    if (existingRequest && existingRequest.status === "pending") {
      return res
        .status(400)
        .json({ message: "You already have a pending role request." });
    }

    // If a rejected request exists, update it. Otherwise, create a new one.
    if (existingRequest) {
      existingRequest.fullName = fullName;
      existingRequest.qualifications = qualifications;
      existingRequest.bio = bio;
      existingRequest.status = "pending";
      await existingRequest.save();
    } else {
      await RoleRequest.create({
        user: userId,
        fullName,
        qualifications,
        bio,
      });
    }

    res.status(201).json({
      message: "Your request to become a teacher has been submitted.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error submitting request.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get user by MongoDB ObjectId
 * @route   GET /api/users/id/:id
 * @access  Public
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ username: user.username });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching user by ID.",
      error: error.message,
    });
  }
};

export {
  getUserProfile,
  updateUserProfile,
  updateUserSettings,
  followUser,
  handleFriendRequest,
  blockUser,
  getAllPublicUsers,
  submitRoleRequest,
};
