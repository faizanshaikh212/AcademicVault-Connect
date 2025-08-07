import cron from "node-cron";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

// Schedule job to run daily at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();

    // Find users whose premium is about to expire in 7 days or has expired
    const users = await User.find({
      "premium.isPremium": true,
      "premium.premiumExpiry": {
        $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    for (const user of users) {
      const expiryDate = new Date(user.premium.premiumExpiry);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // If premium has expired
      if (daysUntilExpiry <= 0) {
        user.premium.isPremium = false;
        user.premium.premiumExpiry = null;
        await user.save();

        // Create expired notification
        await Notification.create({
          recipient: user._id,
          type: "premium_expired",
          message: "Your premium subscription has expired.",
          link: "/settings",
        });
      }
      // If premium is about to expire in 7 days
      else if (daysUntilExpiry <= 7 && !user.premium.expiryNotified) {
        // Create expiring soon notification
        await Notification.create({
          recipient: user._id,
          type: "premium_expiring",
          message: `Your premium subscription will expire in ${daysUntilExpiry} days.`,
          link: "/settings",
        });

        // Mark that we've sent the notification
        user.premium.expiryNotified = true;
        await user.save();
      }
    }
  } catch (error) {
    console.error("Premium expiration check error:", error);
  }
});
