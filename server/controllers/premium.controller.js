import PremiumRequest from "../models/premiumRequest.model.js";
import User from "../models/user.model.js";
import logger from "../utils/logger.js";

/**
 * @desc    Submit a request for premium status
 * @route   POST /api/users/request-premium
 * @access  Private
 */
export const submitPremiumRequest = async (req, res) => {
  const { fullName, paymentMethodId } = req.body;
  const userId = req.user._id;

  try {
    // Check if user is already premium
    const user = await User.findById(userId);
    if (user.premium.isPremium) {
      return res
        .status(400)
        .json({ message: "You already have premium status." });
    }

    // Check if a request already exists
    const existingRequest = await PremiumRequest.findOne({ user: userId });
    if (existingRequest && existingRequest.status === "pending") {
      return res
        .status(400)
        .json({ message: "You already have a pending premium request." });
    }

    // If a rejected request exists, update it. Otherwise, create a new one.
    if (existingRequest) {
      existingRequest.fullName = fullName;
      existingRequest.paymentMethodId = paymentMethodId;
      existingRequest.status = "pending";
      await existingRequest.save();
    } else {
      await PremiumRequest.create({
        user: userId,
        fullName,
        paymentMethodId,
      });
    }

    res.status(201).json({
      message: "Your request for premium status has been submitted.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error submitting request.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all premium requests (admin only)
 * @route   GET /api/admin/premium-requests
 * @access  Private/Admin
 */
export const getAllPremiumRequests = async (req, res) => {
  try {
    const requests = await PremiumRequest.find()
      .populate("user", "username email")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching premium requests.",
      error: error.message,
    });
  }
};

/**
 * @desc    Update premium request status (admin only)
 * @route   PUT /api/admin/premium-requests/:id
 * @access  Private/Admin
 */
/**
 * @desc    Delete a premium request (admin only)
 * @route   DELETE /api/admin/premium-requests/:id
 * @access  Private/Admin
 */
export const deletePremiumRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const request = await PremiumRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Premium request not found." });
    }

    await request.deleteOne();
    res.json({ message: "Premium request deleted successfully." });
  } catch (error) {
    logger.error("Error deleting premium request:", error);
    res.status(500).json({
      message: "Server error deleting premium request.",
      error: error.message,
    });
  }
};

export const updatePremiumRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  try {
    logger.debug("Processing request:", id);
    logger.debug("Status:", status);
    logger.debug("Admin Notes:", adminNotes);

    // Find the request and populate the user information
    const request = await PremiumRequest.findById(id).populate("user");
    logger.debug("Found request:", request);

    if (!request) {
      return res.status(404).json({ message: "Premium request not found." });
    }

    // Validate the status
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided" });
    }

    // Extract the user ID from the populated request
    const userId =
      typeof request.user === "object" ? request.user._id : request.user;

    // Get the user document first to ensure it exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      // Update the request status
      request.status = status;
      request.adminNotes = adminNotes || ""; // Ensure adminNotes is never undefined
      await request.save();

      // If approved, update the user's premium status
      if (status === "approved") {
        // Update the user using findByIdAndUpdate for atomic operation
        await User.findByIdAndUpdate(user._id, {
          $set: {
            "premium.isPremium": true,
            "premium.premiumSince": new Date(),
          },
        });
      }

      const updatedRequest = await request.populate("user");
      res.json({
        message: "Premium request status updated successfully.",
        request: updatedRequest,
      });
    } catch (saveError) {
      logger.error("Error saving changes:", saveError);
      throw saveError;
    }
  } catch (error) {
    logger.error("Error details:", error);
    logger.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server error updating premium request.",
      error: error.message,
      details: error.stack,
    });
  }
};
