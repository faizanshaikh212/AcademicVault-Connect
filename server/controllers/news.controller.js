import { News, NewsletterSubscriber } from "../models/news.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

// Get all news (published)
export const getPublishedNews = async (req, res) => {
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
};

// Get all news (admin)
export const getAllNews = async (req, res) => {
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
};

// Get single news article
export const getNewsById = async (req, res) => {
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
};

// Create news
export const createNews = async (req, res) => {
  try {
    const { title, content, summary, coverImage } = req.body;

    // Validate required fields
    if (!title || !content || !summary || !coverImage) {
      return res.status(400).json({
        message: "Title, content, summary and coverImage are required fields",
      });
    }

    const news = await News.create({
      title,
      content,
      summary,
      coverImage,
      author: req.user._id,
      isPublished: true,
    });

    // Send notifications to all active subscribers who are registered users
    const activeSubscribers = await NewsletterSubscriber.find({
      isActive: true,
      user: { $ne: null },
    });

    const notifications = activeSubscribers.map((subscriber) => ({
      recipient: subscriber.user,
      sender: req.user._id,
      type: "new_news",
      message: title,
      link: `/news/${news._id}`,
      isRead: false,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(news);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create news", error: error.message });
  }
};

// Update news
export const updateNews = async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }
    res.json(news);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update news", error: error.message });
  }
};

// Delete news
export const deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }
    res.json({ message: "News deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete news", error: error.message });
  }
};

// Get all subscribers for admin
export const getSubscribers = async (req, res) => {
  try {
    const subscribers = await NewsletterSubscriber.find()
      .populate("user", "username email profile")
      .sort({ createdAt: -1 });

    const formattedSubscribers = await Promise.all(
      subscribers.map(async (sub) => {
        const data = sub.toObject();
        if (data.user) {
          // If it's a registered user
          return {
            ...data,
            isRegisteredUser: true,
            displayName: data.user.username,
            displayEmail: data.user.email,
            avatar: data.user.profile?.avatar,
          };
        } else {
          // If it's a guest subscriber
          return {
            ...data,
            isRegisteredUser: false,
            displayName: "Guest Subscriber",
            displayEmail: data.email,
            avatar: null,
          };
        }
      })
    );

    res.json(formattedSubscribers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch subscribers", error: error.message });
  }
};

// Update subscriber status
export const updateSubscriber = async (req, res) => {
  try {
    // Find the subscriber first
    const existingSubscriber = await NewsletterSubscriber.findById(
      req.params.id
    );
    if (!existingSubscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }

    // Update the subscriber
    const subscriber = await NewsletterSubscriber.findByIdAndUpdate(
      req.params.id,
      {
        isActive: req.body.isActive,
        ...(req.body.userId ? { user: req.body.userId } : {}),
      },
      { new: true }
    ).populate("user", "username email profile");

    // If this is a user subscription, update the user model
    if (existingSubscriber.user) {
      if (!req.body.isActive) {
        // If deactivating, remove the subscription from user
        await User.findByIdAndUpdate(existingSubscriber.user, {
          $unset: { newsletterSubscription: "" },
        });
      } else {
        // If activating, update the subscription
        await User.findByIdAndUpdate(existingSubscriber.user, {
          $set: {
            newsletterSubscription: {
              _id: subscriber._id,
              isActive: true,
              subscriptionDate: existingSubscriber.createdAt,
            },
          },
        });
      }
    }

    // Return updated subscriber and user ID if it's a user subscription
    res.json({
      subscriber,
      userId: existingSubscriber.user || null,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update subscriber", error: error.message });
  }
};

// Delete subscriber
export const deleteSubscriber = async (req, res) => {
  try {
    // First, find the subscriber to get user info if it exists
    const subscriber = await NewsletterSubscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }

    // If this is a user subscription, update the user model first
    if (subscriber.user) {
      await User.findByIdAndUpdate(subscriber.user, {
        $unset: { newsletterSubscription: "" },
      });

      // Also update user's client-side state
      await User.findByIdAndUpdate(subscriber.user, {
        $set: { isSubscribedToNewsletter: false },
      });
    }

    // Now delete the subscription
    await NewsletterSubscriber.findByIdAndDelete(req.params.id);

    // Return success with user ID if it was a user subscription
    res.json({
      message: "Subscriber deleted successfully",
      userId: subscriber.user || null,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete subscriber", error: error.message });
  }
};

// Check subscription status
export const checkSubscription = async (req, res) => {
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
};

// Create or update newsletter subscription
export const handleSubscription = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.body.userId;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if already subscribed
    const existingSubscriber = await NewsletterSubscriber.findOne({
      $or: [{ email }, { user: userId }],
    });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({ message: "Email already subscribed" });
      } else {
        // Reactivate subscription and update user reference if needed
        existingSubscriber.isActive = true;
        if (userId) {
          existingSubscriber.user = userId;
          existingSubscriber.email = email;
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

        return res.status(200).json({ message: "Subscription reactivated" });
      }
    }

    // Create new subscriber
    const newSubscriber = await NewsletterSubscriber.create({
      email,
      user: userId || null,
      isActive: true,
    });

    // Update user model if this is a user subscription
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $set: {
          newsletterSubscription: {
            _id: newSubscriber._id,
            isActive: true,
            subscriptionDate: newSubscriber.createdAt,
          },
        },
      });
    }

    res.status(201).json({ message: "Successfully subscribed to newsletter" });
  } catch (error) {
    // Check for duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already subscribed" });
    }
    res
      .status(500)
      .json({ message: "Failed to subscribe", error: error.message });
  }
};
