import Notification from "../models/notification.model.js";

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "username profile.avatar")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching notifications." });
  }
};

/**
 * @desc    Mark notifications as read
 * @route   POST /api/notifications/read
 * @access  Private
 */
const markNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: "Notifications marked as read." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error marking notifications as read." });
  }
};

export { getNotifications, markNotificationsAsRead };
