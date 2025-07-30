import express from "express";
import {
  getNotifications,
  markNotificationsAsRead,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All notification routes are protected
router.route("/").get(protect, getNotifications);
router.route("/read").post(protect, markNotificationsAsRead);

export default router;
