import express from "express";
import { News, NewsletterSubscriber } from "../models/news.model.js";
import { protect as auth } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/admin.middleware.js";

const newsRouter = express.Router();

// Check subscription status
newsRouter.get("/news/check-subscription/:email", async (req, res) => {
  try {
    const subscriber = await NewsletterSubscriber.findOne({
      email: req.params.email,
    });
    res.json({
      isSubscribed: !!subscriber,
      isActive: subscriber ? subscriber.isActive : false,
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
    const { email } = req.body;

    // Check if already subscribed
    const existingSubscriber = await NewsletterSubscriber.findOne({ email });
    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({ message: "Email already subscribed" });
      } else {
        // Reactivate subscription
        existingSubscriber.isActive = true;
        await existingSubscriber.save();
        return res.status(200).json({ message: "Subscription reactivated" });
      }
    }

    // Create new subscriber
    await NewsletterSubscriber.create({ email });
    res.status(201).json({ message: "Successfully subscribed to newsletter" });
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
    const subscribers = await NewsletterSubscriber.find().sort({
      createdAt: -1,
    });
    res.json(subscribers);
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
    const news = await News.create({
      ...req.body,
      author: req.user._id,
    });
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

// Update subscriber status (admin only)
newsRouter.put("/news/subscribers/:id", [auth, admin], async (req, res) => {
  try {
    const subscriber = await NewsletterSubscriber.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    );
    res.json(subscriber);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update subscriber", error: error.message });
  }
});

// Delete subscriber (admin only)
newsRouter.delete("/news/subscribers/:id", [auth, admin], async (req, res) => {
  try {
    await NewsletterSubscriber.findByIdAndDelete(req.params.id);
    res.json({ message: "Subscriber deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete subscriber", error: error.message });
  }
});

export { newsRouter as default };
