import Notification from "../models/notification.model.js";

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
      isCleared: false,
    })
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

/**
 * @desc    Get all notifications history for the logged-in user
 * @route   GET /api/notifications/history
 * @access  Private
 */
const getNotificationHistory = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .populate("sender", "username profile.avatar")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error fetching notification history." });
  }
};

/**
 * @desc    Clear notifications by marking them as cleared
 * @route   POST /api/notifications/clear
 * @access  Private
 */
const clearNotifications = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isCleared: false },
      { $set: { isCleared: true } }
    );
    res.status(200).json({ message: "Notifications cleared." });
  } catch (error) {
    res.status(500).json({ message: "Server error clearing notifications." });
  }
};

/**
 * @desc    Create a new notification
 * @param   {Object} notificationData - Notification data
 * @access  Internal function
 */
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export {
  getNotifications,
  markNotificationsAsRead,
  getNotificationHistory,
  clearNotifications,
  createNotification,
};
