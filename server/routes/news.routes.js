import express from "express";
import { News, NewsletterSubscriber } from "../models/news.model.js";
import { protect as auth } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/admin.middleware.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import logger from "../utils/logger.js";

const newsRouter = express.Router();

// Check subscription status
newsRouter.get("/news/check-subscription/:email", async (req, res) => {
  try {
    const subscriber = await NewsletterSubscriber.findOne({
      email: req.params.email,
    }).populate("user", "email");

    if (!subscriber) {
      return res.json({ isSubscribed: false, isActive: false });
    }

    res.json({
      isSubscribed: true,
      isActive: subscriber.isActive,
      _id: subscriber._id,
      email: subscriber.email,
      user: subscriber.user,
      subscriptionDate: subscriber.createdAt,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to check subscription status",
      error: error.message,
    });
  }
});

// Subscribe to newsletter
newsRouter.post("/news/subscribe", async (req, res) => {
  try {
    logger.debug("Subscribe request body:", req.body);
    const { email, userId } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if already subscribed
    const existingSubscriber = await NewsletterSubscriber.findOne({
      $or: [{ email }, { user: userId }],
    });

    logger.debug("Existing subscriber:", existingSubscriber);

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({ message: "Email already subscribed" });
      } else {
        // Reactivate subscription and update user reference if needed
        existingSubscriber.isActive = true;
        if (userId) {
          existingSubscriber.user = userId;
          existingSubscriber.email = email; // Use provided email
        }
        await existingSubscriber.save();

        // Update user model if this is a user subscription
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            $set: {
              newsletterSubscription: {
                _id: existingSubscriber._id,
                isActive: true,
                subscriptionDate: existingSubscriber.createdAt,
              },
            },
          });
        }

        // Fetch the updated subscriber with populated user data
        const updatedSubscriber = await NewsletterSubscriber.findById(
          existingSubscriber._id
        ).populate("user", "email username");

        return res.status(200).json({
          message: "Subscription reactivated",
          subscriber: updatedSubscriber,
        });
      }
    }

    // Create new subscriber
    const newSubscriber = await NewsletterSubscriber.create({
      email,
      user: req.body.userId || null,
      isActive: true,
    });

    logger.debug("Created new subscriber:", newSubscriber);

    // Find the user and attach this subscription
    if (req.body.userId) {
      try {
        const user = await User.findById(req.body.userId);
        if (user) {
          await User.findByIdAndUpdate(user._id, {
            $set: {
              newsletterSubscription: {
                _id: newSubscriber._id,
                isActive: true,
                subscriptionDate: newSubscriber.createdAt,
              },
            },
          });
        }
      } catch (updateError) {
        if (process.env.NODE_ENV !== "production") {
          logger.error("Error updating user subscription:", updateError);
        }
        // Don't throw error here, as the subscription was created successfully
      }
    }

    // Fetch the updated subscriber with populated user data
    const updatedSubscriber = await NewsletterSubscriber.findById(
      newSubscriber._id
    ).populate("user", "email username");

    res.status(201).json({
      message: "Successfully subscribed to newsletter",
      subscriber: updatedSubscriber,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to subscribe", error: error.message });
  }
});

// Get all news (published)
newsRouter.get("/news", async (req, res) => {
  try {
    const news = await News.find({ isPublished: true })
      .populate("author", "username")
      .sort({ createdAt: -1 });
    res.json(news);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch news", error: error.message });
  }
});

// Get all subscribers (admin only)
newsRouter.get("/news/subscribers", [auth, admin], async (req, res) => {
  try {
    const subscribers = await NewsletterSubscriber.find()
      .populate("user", "username email firstName lastName")
      .sort({ createdAt: -1 });

    const formattedSubscribers = subscribers.map((sub) => {
      const data = sub.toObject();
      if (data.user) {
        // This is a registered user
        const displayName =
          `${data.user.firstName} ${data.user.lastName}`.trim() ||
          data.user.username;
        return {
          ...data,
          isRegisteredUser: true,
          email: data.user.email,
          displayName,
          userType: "Registered User",
        };
      }
      return {
        ...data,
        isRegisteredUser: false,
        displayName: "Guest User",
        userType: "Guest",
      };
    });

    res.json(formattedSubscribers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch subscribers", error: error.message });
  }
});

// Get all news (admin)
newsRouter.get("/news/all", [auth, admin], async (req, res) => {
  try {
    const news = await News.find()
      .populate("author", "username")
      .sort({ createdAt: -1 });
    res.json(news);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch news", error: error.message });
  }
});

// Get single news article
newsRouter.get("/news/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate(
      "author",
      "username"
    );
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }
    res.json(news);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch news", error: error.message });
  }
});

// Admin routes
// Create news
newsRouter.post("/news/create", [auth, admin], async (req, res) => {
  try {
    const { title, content, summary, coverImage } = req.body;

    // Validate required fields
    if (!title || !content || !summary || !coverImage) {
      return res.status(400).json({
        message: "Title, content, summary and coverImage are required fields",
      });
    }

    logger.debug("Creating news with title:", title);

    const news = await News.create({
      title,
      content,
      summary,
      coverImage,
      author: req.user._id,
      isPublished: true,
      attachments: req.body.attachments || [],
    });

    logger.debug("Created news:", news);

    // Send notifications to all active subscribers who are registered users
    const activeSubscribers = await NewsletterSubscriber.find({
      isActive: true,
      user: { $ne: null },
    });

    logger.debug("Active subscribers:", activeSubscribers);

    // Use the exact title for the notification
    const notifications = activeSubscribers.map((subscriber) => ({
      recipient: subscriber.user,
      sender: req.user._id,
      type: "new_news",
      message: title,
      link: `/news/${news._id}`,
      isRead: false,
    }));

    logger.debug("Created notifications:", notifications);

    if (notifications.length > 0) {
      const createdNotifications = await Notification.insertMany(notifications);
      logger.debug("Inserted notifications:", createdNotifications);
    }

    res.status(201).json(news);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create news", error: error.message });
  }
});

// Update news
newsRouter.put("/news/:id", [auth, admin], async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    res.json(news);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update news", error: error.message });
  }
});

// Delete news
newsRouter.delete("/news/:id", [auth, admin], async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.json({ message: "News deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete news", error: error.message });
  }
});

// Update subscriber status
newsRouter.put("/news/subscribers/:id", async (req, res) => {
  try {
    logger.debug("Updating subscriber:", {
      id: req.params.id,
      body: req.body,
    });

    // Find the subscriber first
    const existingSubscriber = await NewsletterSubscriber.findById(
      req.params.id
    );
    if (!existingSubscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }

    // Update the subscriber
    const updatedSubscriber = await NewsletterSubscriber.findByIdAndUpdate(
      req.params.id,
      {
        isActive: req.body.isActive,
        ...(req.body.userId ? { user: req.body.userId } : {}),
      },
      { new: true }
    ).populate("user", "email");

    // Also update the user's subscription status if this is a user subscription
    if (existingSubscriber.user) {
      await User.findByIdAndUpdate(existingSubscriber.user, {
        $set: {
          newsletterSubscription: {
            _id: updatedSubscriber._id,
            isActive: req.body.isActive,
            subscriptionDate: existingSubscriber.createdAt,
          },
        },
      });
    }

    logger.debug("Updated subscriber:", updatedSubscriber);
    res.json(updatedSubscriber);
  } catch (error) {
    logger.error("Error updating subscriber:", error);
    res.status(500).json({
      message: "Failed to update subscriber",
      error: error.message,
    });
  }
});

// Delete subscriber (admin only)
newsRouter.delete("/news/subscribers/:id", [auth, admin], async (req, res) => {
  try {
    // Find subscriber first to get user reference if any
    const subscriber = await NewsletterSubscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }

    // If this is a user subscription, update the user model
    if (subscriber.user) {
      await User.findByIdAndUpdate(subscriber.user, {
        $unset: { newsletterSubscription: "" },
      });
    }

    // Now delete the subscriber
    await NewsletterSubscriber.findByIdAndDelete(req.params.id);
    res.json({ message: "Subscriber deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete subscriber", error: error.message });
  }
});

export { newsRouter as default };
